from fastapi import HTTPException, UploadFile
from typing import Optional
from datetime import datetime, timezone
from copy import deepcopy
from io import BytesIO
import aiohttp

from page.models.page_model import OcrData, Page, PageRequestUpdate
from core.models.models import Tenant

from book.book_repo import BookRepo
from page.page_repo import PageRepo

from cell.services.s3_service import S3Service

from utils.helpers import (
    compress_image,
    MockUploadFile
)

_DEFAULT_PAGE_THUMBNAIL_WIDTH: int = 300
_DEFAULT_COMPRESSED_PAGE_WIDTH: int = 1080

async def create_page_service(
    books_repo: BookRepo,
    pages_repo: PageRepo,
    s3: S3Service,
    book_id: str,
    page_number: int,
    photo: UploadFile,
    ocr_language: str,
    ocr_model: str,
    ocr_data: str,
    translation_language: str,
    translation_model: str,
    translation_data: str,
    tenant_name: Optional[str] = "",
    tenant_external_id: Optional[str] = ""
) -> Page:
    book = await books_repo.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    existing_page = await pages_repo.find_one({"book_id": book_id, "page_number": page_number})
    if existing_page:
        max_page = await pages_repo.find({"book_id": book_id}).sort("page_number", -1).limit(1).to_list(1)
        next_available = (max_page[0]["page_number"] + 1) if max_page else 1
        raise HTTPException(
            status_code=400,
            detail=f"Page number {page_number} already exists for this book. Next available: {next_available}"
        )

    try:        
        # Creating Page object with empty photo and thumbnail initially to get page_id        
        page = Page(
            tenant=Tenant(
                name=tenant_name,
                external_id=tenant_external_id
                ) if tenant_name else None,
            book_id=book_id,
            page_number=page_number,
            photo="",
            thumbnail="",
            ocr=OcrData(
                language=ocr_language or book.get("language", ""),
                model=ocr_model,
                data=ocr_data,
                image_urls=[]
            ),
            translation={
                "language": translation_language or "English",
                "model": translation_model,
                "data": translation_data
            }
        )

        file_content = await photo.read()
        bytes_for_original = BytesIO(file_content)
        bytes_for_thumbnail = BytesIO(file_content)
        bytes_for_compressed = BytesIO(file_content)

        # Uploading Original Size Page Image        
        bytes_for_original.seek(0)
        mock_photo = MockUploadFile(bytes_for_original, photo.filename, photo.content_type)
        page.photo = await s3.upload_page_image(book_id=book_id, page_id=page.id, file=mock_photo)

        # Generating and Uploading Thumbnail
        mock_photo_thumbnail = MockUploadFile(bytes_for_thumbnail, photo.filename, photo.content_type)
        thumbnail_data = await compress_image(mock_photo_thumbnail, max_width=_DEFAULT_PAGE_THUMBNAIL_WIDTH)
        page.thumbnail = await s3.upload_page_thumbnail(book_id=book_id,
                                                        page_id=page.id,
                                                        width=_DEFAULT_PAGE_THUMBNAIL_WIDTH,
                                                        thumbnail_data=thumbnail_data
                                                       )
        
        # Generating and Uploading Compressed Image        
        compressed_img_data = await compress_image(bytes_for_compressed, max_width=_DEFAULT_COMPRESSED_PAGE_WIDTH)
        page.compressed_photo = await s3.upload_compressed_page_image(book_id=book_id,
                                                                      page_id=page.id,
                                                                      width=_DEFAULT_COMPRESSED_PAGE_WIDTH,
                                                                      compressed_data=compressed_img_data
                                                                     )
        existing_page_check = await pages_repo.find_one({"book_id": book_id, "page_number": page_number})
        if existing_page_check:
            try:
                await s3.delete_files([page.photo, page.thumbnail, page.compressed_photo])
            except:
                pass
            raise HTTPException(status_code=400, detail=f"Page number {page_number} was created by another request.")

        await pages_repo.insert_one(page.model_dump())
        return page
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create page: {str(e)}")


async def get_page_service(page_id: str, pages_repo: PageRepo, s3: S3Service) -> Page:
    page_data = await pages_repo.find_one({"id": page_id})
    if not page_data:
        raise HTTPException(status_code=404, detail="Page not found")
    
    page = Page(**page_data)
    
    # If there's a source photo and either thumbnail or compressed_photo is missing,
    # fetch the original once and produce both sizes, then update DB in one call.
    if page.photo and (not page.thumbnail or not page.compressed_photo):
        updates_partial = {}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(page.photo) as resp:
                    resp.raise_for_status()
                    content = await resp.read()

            # Create BytesIO copies for each compress call so PIL can read independently
            bytes_for_thumbnail = BytesIO(content)
            bytes_for_compressed = BytesIO(content)

            # Generate both images only if missing
            if not page.thumbnail:
                try:
                    thumb_data = await compress_image(bytes_for_thumbnail, max_width=_DEFAULT_PAGE_THUMBNAIL_WIDTH)
                    thumb_url = await s3.upload_page_thumbnail(book_id=page.book_id,
                                                               page_id=page_id,
                                                               width=_DEFAULT_PAGE_THUMBNAIL_WIDTH,
                                                               thumbnail_data=thumb_data
                                                              )
                    updates_partial["thumbnail"] = thumb_url
                    page.thumbnail = thumb_url
                except Exception:
                    # best-effort: leave thumbnail empty
                    page.thumbnail = ""
        
            if not page.compressed_photo:                
                try:
                    compressed_data = await compress_image(bytes_for_compressed, max_width=_DEFAULT_COMPRESSED_PAGE_WIDTH)
                    compressed_url = await s3.upload_compressed_page_image(book_id=page.book_id,
                                                                           page_id=page_id,
                                                                           width=_DEFAULT_COMPRESSED_PAGE_WIDTH,
                                                                           compressed_data=compressed_data
                                                                          )
                    updates_partial["compressed_photo"] = compressed_url
                    page.compressed_photo = compressed_url
                except Exception:
                    page.compressed_photo = ""

            if updates_partial:
                updates_partial["updated_at"] = datetime.now(timezone.utc)

                # Use Page model to produce canonical keys and avoid typos:
                # create a model copy with the new fields, then take only the fields we set
                model_copy = page.model_copy(update=updates_partial)
                canonical = model_copy.model_dump()
                allowed = set(updates_partial.keys())
                db_set = {k: canonical[k] for k in allowed if k in canonical}

                # Single DB write
                await pages_repo.update_one({"id": page_id}, {"$set": db_set})

        except Exception:
            # swallow — best-effort thumbnail/compressed generation
            pass

    return page


async def update_page_service(
    pages_repo: PageRepo,
    s3: S3Service,
    page_id: str,
    page_number: Optional[int],
    photo: Optional[UploadFile],
    ocr_language: Optional[str],
    ocr_model: Optional[str],
    ocr_data: Optional[str],
    translation_language: Optional[str],
    translation_model: Optional[str],
    translation_data: Optional[str]
) -> Page:
    page_data = await pages_repo.find_one({"id": page_id})
    if not page_data:
        raise HTTPException(status_code=404, detail="Page not found")

    page = Page(**page_data)
    update_data = {}

    if page_number is not None:
        existing_page = await pages_repo.find_one({
            "book_id": page.book_id,
            "page_number": page_number,
            "id": {"$ne": page_id}
        })
        if existing_page:
            raise HTTPException(status_code=400, detail="Page number already exists for this book")
        update_data["page_number"] = page_number

    if photo and photo.size and photo.size > 0:
        to_delete = []
        if page.thumbnail:
            to_delete.append(page.thumbnail)
        if page.compressed_photo:
            to_delete.append(page.compressed_photo)
        try:                
            await s3.delete_files(to_delete)
        except:
            pass
        
        # Original Photo
        mock_file = MockUploadFile(photo.file, photo.filename, photo.content_type)
        photo_url = await s3.upload_page_image(page.book_id, page.id, mock_file)
        update_data["photo"] = photo_url

        # Thumbnail
        thumbnail_data = await compress_image(mock_file, max_width=_DEFAULT_PAGE_THUMBNAIL_WIDTH)
        thumbnail_url = await s3.upload_page_thumbnail(book_id=page.book_id,
                                                       page_id=page.id,
                                                       width=_DEFAULT_PAGE_THUMBNAIL_WIDTH,
                                                       thumbnail_data=thumbnail_data
                                                      )
        update_data["thumbnail"] = thumbnail_url
        
        # Compressed Image        
        compressed_img_data = await compress_image(mock_file, max_width=_DEFAULT_COMPRESSED_PAGE_WIDTH)
        compressed_url = await s3.upload_compressed_page_image(book_id=page.book_id,
                                                               page_id=page.id,
                                                               width=_DEFAULT_COMPRESSED_PAGE_WIDTH,
                                                               compressed_data=compressed_img_data
                                                              )
        update_data["compressed_photo"] = compressed_url

    if ocr_language is not None or ocr_model is not None or ocr_data is not None:
        current_ocr = deepcopy(page.ocr.model_dump() if hasattr(page.ocr, "model_dump") else dict(page.ocr))
        ocr_updates = {}
        if ocr_language is not None:
            ocr_updates["language"] = ocr_language
        if ocr_model is not None:
            ocr_updates["model"] = ocr_model
        if ocr_data is not None:
            ocr_updates["data"] = ocr_data
        ocr_updates["updated_at"] = datetime.now(timezone.utc)
        merged_ocr = {**current_ocr, **ocr_updates}
        ocr_obj = OcrData(**merged_ocr)
        update_data["ocr"] = ocr_obj.model_dump()

    if translation_language is not None or translation_model is not None or translation_data is not None:
        current_translation = page.translation
        update_data["translation"] = {
            "language": translation_language if translation_language is not None else current_translation.get("language", ""),
            "model": translation_model if translation_model is not None else current_translation.get("model", ""),
            "data": translation_data if translation_data is not None else current_translation.get("data", "")
        }

    update_data["updated_at"] = datetime.now(timezone.utc)

    await pages_repo.update_one({"id": page_id}, {"$set": update_data})
    updated_page = await pages_repo.find_one({"id": page_id})
    if not updated_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return Page(**updated_page)


async def delete_page_service(page_id: str, pages_repo: PageRepo, s3: S3Service) -> dict:
    page_data = await pages_repo.find_one({"id": page_id})
    if not page_data:
        raise HTTPException(status_code=404, detail="Page not found")

    page = Page(**page_data)

    await s3.delete_page_files(book_id=page.book_id, page_id=page.id)
    
    await pages_repo.delete_one({"id": page_id})
    
    return {"message": "Page deleted!"}


async def update_page_by_request_service(page_id: str,
                                         data: PageRequestUpdate,
                                         pages_repo: PageRepo
) -> Page:
    
    request_type = data.requestType
    new_text = data.newText
    if request_type not in ("ocr", "translation"):
        raise HTTPException(status_code=400, detail="Invalid requestType")
    if not new_text:
        raise HTTPException(status_code=400, detail="newText is required")

    if request_type == "ocr":
        result = await pages_repo.update_one({"id": page_id}, {"$set": {"ocr.data": new_text}})
    else:
        result = await pages_repo.update_one({"id": page_id}, {"$set": {"translation.data": new_text}})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")

    updated_page = await pages_repo.find_one({"id": page_id})
    if not updated_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return Page(**updated_page)    
