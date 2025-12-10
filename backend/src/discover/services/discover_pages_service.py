from fastapi import HTTPException, Query, Depends
from page.models.page_model import Page

from book.book_repo import BookRepo
from page.page_repo import PageRepo

async def get_random_pages(count: int,
                           books_repo: BookRepo,
                           pages_repo: PageRepo):
    
    """Get `count` random pages from books with substantial OCR and translation content"""
    pages_to_return = count
    try:
        # Find pages with sufficient content
        # OCR data >= 100 chars and translation data >= 200 chars
        pipeline = [
            {
                "$match": {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$strLenCP": {"$ifNull": ["$ocr.data", ""]}}, 100]},
                            {"$gte": [{"$strLenCP": {"$ifNull": ["$translation.data", ""]}}, 200]}
                        ]
                    }
                }
            },
            {"$sample": {"size": 10}}  # Get 10 random pages first
        ]
                
        cursor = await pages_repo.aggregate(pipeline)
        raw_pages = await cursor.to_list(10)
        
        if not raw_pages:
            return {"pages": []}
        
        # Convert MongoDB documents into Page model instances so we can use attributes
        page_models = []
        for doc in raw_pages:
            # Normalize document for Pydantic:
            # - ensure 'id' is present as string (use existing 'id' or fallback to stringified '_id')
            # - remove MongoDB '_id' to avoid unexpected types
            normalized = dict(doc)  # shallow copy
            if "_id" in normalized:
                normalized.pop("_id")
            if "id" not in normalized or not normalized.get("id"):
                # fallback to stringified ObjectId if present originally
                orig_id = doc.get("_id")
                normalized["id"] = str(orig_id) if orig_id is not None else ""
            try:
                page_obj = Page.model_validate(normalized)
                page_models.append(page_obj)
            except Exception:
                # Skip documents that don't validate as Page
                continue
        
        if not page_models:
            return {"pages": []}
        
        # Try to get pages from different books, but not strictly required
        selected_pages = []
        used_book_ids = set()
        
        # First pass: try to get unique books
        for page in page_models:
            if len(selected_pages) >= pages_to_return:
                break
            if page.book_id not in used_book_ids:
                selected_pages.append(page)
                used_book_ids.add(page.book_id)
        
        # Second pass: fill remaining slots if needed
        for page in page_models:
            if len(selected_pages) >= pages_to_return:
                break
            if page not in selected_pages:
                selected_pages.append(page)
        
        # Get book details for each page and build result using Page attributes
        result_pages = []
        for page in selected_pages[:pages_to_return]:
            book = await books_repo.find_one({"id": page.book_id})
            if book:
                page_with_book = {
                    "id": page.id,
                    "book_id": page.book_id,
                    "page_number": page.page_number,
                    "photo": page.photo,
                    "thumbnail": page.thumbnail,
                    "ocr": page.ocr,
                    "translation": page.translation,
                    "book_title": book.get("title", ""),
                    "book_author": book.get("author", ""),
                    "book_language": book.get("language", "")
                }
                result_pages.append(page_with_book)
        
        return {"pages": result_pages}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch random pages: {e}")