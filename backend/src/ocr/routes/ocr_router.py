from fastapi import APIRouter, Form, HTTPException, Request, Depends
from datetime import datetime, timezone
from typing import Optional

from page.models.page_model import OcrData
from page.models.page_model import Page

from auth.services.rbac_service import need_permission, ResourceType, ActionType
from ai.services.ai_registry import get_ai_client
from core.dependency import s3_service_dependency

from page.page_repo import get_pages_repo

router = APIRouter()

@router.post("/", dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.UPDATE))])
async def get_ocr(
    # Accept either JSON body or form data
    request: Request,
    s3: s3_service_dependency,
    page_id: Optional[str] = Form(None),
    photo_url: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    custom_prompt: Optional[str] = Form(None),
    auto_save: Optional[bool] = Form(False),
    ai_model: Optional[str] = Form(None),
    pages_repo = Depends(get_pages_repo),
):        
    # Parse request data
    content_type = request.headers.get("content-type", "")    
    
    if "application/json" in content_type:        
        try:
            body = await request.json()            
            photo_url_final = body.get("photo_url")
            language_final = body.get("language") 
            custom_prompt_final = body.get("custom_prompt")
            auto_save_final = body.get("auto_save", False)
            page_id_final = body.get("page_id")
            model_final = body.get("ai_model")
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    else:
        photo_url_final = photo_url
        language_final = language
        custom_prompt_final = custom_prompt
        auto_save_final = auto_save
        page_id_final = page_id
        model_final = ai_model
    
    page_data = await pages_repo.find_one({"id": page_id_final})
    if not page_data:
        raise HTTPException(status_code=404, detail=f"Page not found! Page ID: {page_id_final}")
    
    page = Page(**page_data)
    
    if not photo_url_final or not language_final:
        raise HTTPException(status_code=400, detail="photo_url and language are required")
    
    # Choose model (default to mistral)
    chosen_model = (model_final or "mistral").lower()
    try:
        client = get_ai_client(chosen_model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    try:
        if not client:        
            raise HTTPException(status_code=500, detail="AI service not available")
                
        # Process OCR using the client (unified interface returns (ocr_text, image_urls))
        ocr_text, image_urls = await client.process_ocr_async(
            book_id=page.book_id, 
            page_id=page.id,
            image_url=photo_url_final, 
            language=language_final, 
            custom_prompt=custom_prompt_final,
            s3_service=s3
        )
                
        # Auto-save to database if requested
        # if auto_save_final and page_id_final:
        if page_id_final: # TODO: Remove when approval/disapproval workflow is robust
            try:
                    ocr_result = OcrData(
                        language=language_final,
                        model=chosen_model,
                        data=ocr_text,
                        image_urls=image_urls,
                        updated_at=datetime.now(timezone.utc)
                    )

                    # Delete previously stored OCR images from S3
                    if page.ocr and page.ocr.image_urls:                        
                        await s3.delete_files(page.ocr.image_urls)

                    await pages_repo.update_one(
                        {"id": page_id_final},
                        {"$set": {"ocr": ocr_result.model_dump()}}
                    )

            except Exception as db_error:
                    raise HTTPException(status_code=500, detail=f"Failed to update OCR data in database: {db_error}")
                            
                
        return {"ocr": ocr_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))