import os
from fastapi import UploadFile, HTTPException, BackgroundTasks
from typing import Optional
from datetime import datetime, timezone

from page.models.page_model import Page
from book.models.book_model import Book
from core.models.models import Tenant

from book.book_repo import BookRepo
from page.page_repo import PageRepo

from cell.services.s3_service import S3Service
from utils.helpers import (
    compress_image, 
    get_compressed_image_from_url,
    MockUploadFile
)

from ai.services import ai_registry

_DEFAULT_BOOK_THUMBNAIL_WIDTH:int = 400

async def create_book_service(title: str,
                              author: str,
                              published: str,
                              language: str,
                              thumbnail: Optional[UploadFile],
                              tenant_name: Optional[str],
                              tenant_external_id: Optional[str],
                              bg_tasks: BackgroundTasks,
                              books_repo: BookRepo,
                              s3: S3Service
                              ) -> Book:
    # Create book object first to get an ID
    book = Book(
        title=title,
        author=author,
        published=published,
        language=language,
        pages_count=0,
        thumbnail="",
        tenant=Tenant(name=tenant_name, external_id=tenant_external_id) if tenant_name else None        
    )    
    
    if thumbnail and thumbnail.size and thumbnail.size > 0 and thumbnail.filename != "":        
        compressed_thumbnail = await compress_image(thumbnail, _DEFAULT_BOOK_THUMBNAIL_WIDTH)
        thumbnail.file.seek(0)
        mock_file = MockUploadFile(compressed_thumbnail, thumbnail.filename, thumbnail.content_type)
        book.thumbnail = await s3.upload_book_thumbnail(book_id=book.id,
                                                                width=_DEFAULT_BOOK_THUMBNAIL_WIDTH,
                                                                file=mock_file
                                                               )

    await books_repo.insert_one(book.model_dump())

    bg_tasks.add_task(_translate_title_and_update_record,
                          book.id,
                          title,
                          language,
                          books_repo
                    )
    
    return book

async def get_book_service(book_id: str, books_repo: BookRepo, pages_repo: PageRepo) -> Book:
    book_data = await books_repo.find_one({"id": book_id})
    if not book_data:
        raise HTTPException(status_code=404, detail="Book not found")
    
    book = Book(**book_data)

    page_count = await pages_repo.count_documents({"book_id": book_id})
    book.pages_count = page_count
    
    return book

async def update_book_service(book_id: str,
                              title: Optional[str],
                              author: Optional[str],
                              published: Optional[str],
                              language: Optional[str],
                              thumbnail: Optional[UploadFile],
                              bg_tasks: BackgroundTasks,
                              books_repo: BookRepo,
                              pages_repo: PageRepo,
                              s3: S3Service
) -> Book:
    
    book_data = await books_repo.find_one({"id": book_id})
    if not book_data:
        raise HTTPException(status_code=404, detail="Book not found")
    book = Book(**book_data)

    update_data = {}
    if title and title != book.title:
        update_data["title"] = title

    if author and author != book.author:
        update_data["author"] = author

    if published and published != book.published:
        update_data["published"] = published

    if language and language != book.language:
        update_data["language"] = language
    
    if thumbnail and thumbnail.size and thumbnail.size > 0 and thumbnail.filename != "":
        # Delete old thumbnail if it exists
        if book.thumbnail:
            await s3.delete_files([book.thumbnail])
        
        compressed_thumbnail = await compress_image(thumbnail, _DEFAULT_BOOK_THUMBNAIL_WIDTH)
        thumbnail.file.seek(0)
        mock_file = MockUploadFile(compressed_thumbnail, thumbnail.filename, thumbnail.content_type)
        thumbnail_url = await s3.upload_book_thumbnail(book_id=book_id,
                                                       width=_DEFAULT_BOOK_THUMBNAIL_WIDTH,
                                                       file=mock_file
                                                       )
        update_data["thumbnail"] = thumbnail_url        

    # Update the book record in the database
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)        
        await books_repo.update_one({"id": book_id}, {"$set": update_data})
        
        # If title was updated, re-translate in background
        updated_title = update_data.get("title")
        if updated_title:
            bg_tasks.add_task(_translate_title_and_update_record,
                                  book_id,
                                  updated_title,
                                  language or book.language,
                                  books_repo
                            )
    
    # Fetch the updated book ¯ return
    updated_book_data = await books_repo.find_one({"id": book_id})
    if not updated_book_data:
        raise HTTPException(status_code=404, detail="Book not found")
    
    updated_book = Book(**updated_book_data)
    page_count = await pages_repo.count_documents({"book_id": book_id})
    updated_book.pages_count = page_count
    
    return updated_book

async def delete_book_service(book_id: str,
                              password: str,
                              books_repo: BookRepo,
                              pages_repo: PageRepo,
                              s3: S3Service
) -> dict:
    expected_hash = os.getenv("DELETE_BOOK_HASH") #MD5 hash
    if password != expected_hash:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    book_data = await books_repo.find_one({"id": book_id})
    if not book_data:
        raise HTTPException(status_code=404, detail="Book not found")    
    
    # Delete all pages associated with the book
    await pages_repo.delete_many({"book_id": book_id})
    
    # Delete the book itself
    await books_repo.delete_one({"id": book_id})

    # Delete all files associated with the book from S3
    try:
        await s3.delete_book_files(book_id=book_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not delete book files from S3: {e}")

    return {"message": "Book and associated pages deleted"}

async def get_books_service(books_repo: BookRepo, pages_repo: PageRepo) -> list[Book]:
    books_cursor = books_repo.find({})
    books_data = await books_cursor.to_list(None)
    
    books = [Book(**book) for book in books_data]
    for book in books:
        page_count = await pages_repo.count_documents({"book_id": book.id})
        book.pages_count = page_count
    
    return books

async def get_book_details_service(book_id: str,
                                   books_repo: BookRepo,
                                   pages_repo: PageRepo,
                                   s3: S3Service
) -> dict:
    book_data = await books_repo.find_one({"id": book_id})
    if not book_data:
        raise HTTPException(status_code=404, detail="Book not found")
    book = Book(**book_data)

    pages_cursor = pages_repo.find({"book_id": book_id}).sort("page_number", 1)
    pages_data = await pages_cursor.to_list(None)
    
    book.pages_count = len(pages_data)
    
    for p in pages_data:
        page = Page(**p)

        if not page.thumbnail and page.photo:
            try:
                page_thumbnail_width: int = 300
                page_thumbnail_data = await get_compressed_image_from_url(page.photo, page_thumbnail_width)
                page_thumbnail_url = await s3.upload_page_thumbnail(book_id=book_id,
                                                                    page_id=page.id,
                                                                    width=page_thumbnail_width,
                                                                    thumbnail_data=page_thumbnail_data
                                                                   )

                await pages_repo.update_one(
                    {"id": page.id},
                    {"$set": {"thumbnail": page_thumbnail_url, "updated_at": datetime.now(timezone.utc)}}
                )
                page.thumbnail = page_thumbnail_url                
            except Exception as e:                
                page.thumbnail = ""
    
    return {
        "book": book,
        "pages": [Page(**page) for page in pages_data]
    }

async def get_next_page_number_service(book_id: str,
                                       books_repo: BookRepo,
                                       pages_repo: PageRepo
) -> dict:
    
    book_data = await books_repo.find_one({"id": book_id})
    if not book_data:
        raise HTTPException(status_code=404, detail="Book not found")
    
    max_page_cursor = pages_repo.find({"book_id": book_id}).sort("page_number", -1).limit(1)
    max_page = await max_page_cursor.to_list(1)
    next_page_number = (max_page[0]["page_number"] + 1) if max_page else 1
    
    return {"next_page_number": next_page_number}

async def _translate_title_and_update_record(book_id: str,
                                             original_title: str,
                                             source_language: str,
                                             books_repo: BookRepo
                                            ) -> None:
    if "english" in source_language.lower():
        return
    
    # Check if the book record exists
    record_count = await books_repo.count_documents({"id": book_id}, limit=1)    
    if record_count <= 0:
        raise HTTPException(status_code=404, detail="Book not found for title translation")
    
    # Use AI to translate the title
    translated_title = await _get_translated_title(original_title, source_language)
    if not translated_title:
        return            
    
    # Update the book record with the translated title
    operation: dict = {"$set": {"display_title": translated_title, "updated_at": datetime.now(timezone.utc)}}
    await books_repo.update_one({"id": book_id}, operation)

async def _get_translated_title(title: str, source_language: str) -> Optional[str]:
    """ Uses AI to translate the book title to English if the source language is not English."""
    try:
        ai_client = ai_registry.get_ai_client("gemini")
        prompt: str = f"Translate the title from {source_language} to English. Return only the translated text.\nNative Title is: {title}"
        translated_title = await ai_client.process_translation_async(prompt=prompt)
        return translated_title
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI failed to translate book title!\n{str(e)})")    