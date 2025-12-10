from fastapi import APIRouter, Form, HTTPException, Request, Depends
from datetime import datetime, timezone
from typing import Optional
import asyncio


from page.page_repo import get_pages_repo

from ai.services.ai_registry import get_ai_client
from auth.services.rbac_service import need_permission, ResourceType, ActionType

router = APIRouter()

@router.post("/", dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.UPDATE))])
async def translate_text(
    request: Request,
    text: Optional[str] = Form(None),
    source_lang: Optional[str] = Form(None),
    target_lang: Optional[str] = Form(None),
    custom_prompt: Optional[str] = Form(None),
    auto_save: Optional[bool] = Form(False),
    page_id: Optional[str] = Form(None),
    ai_model: Optional[str] = Form(None),
    pages_repo = Depends(get_pages_repo),
):
    # Parse request data
    content_type = request.headers.get("content-type", "") if request else ""    
    
    if "application/json" in content_type:        
        try:
            body = await request.json()            
            text_final = body.get("text")
            source_lang_final = body.get("source_lang")
            target_lang_final = body.get("target_lang")
            custom_prompt_final = body.get("custom_prompt")
            auto_save_final = body.get("auto_save", False)
            page_id_final = body.get("page_id")
            model_final = body.get("ai_model")
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    else:
        text_final = text
        source_lang_final = source_lang
        target_lang_final = target_lang
        custom_prompt_final = custom_prompt
        auto_save_final = auto_save
        page_id_final = page_id
        model_final = ai_model
    
    if not text_final or not source_lang_final or not target_lang_final:        
        raise HTTPException(status_code=400, detail="text, source_lang, and target_lang are required")
    
    # Choose model (default to gemini)
    chosen_model = (model_final or "gemini").lower()
    try:
        client = get_ai_client(chosen_model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    try:
        if not client:
            raise HTTPException(status_code=500, detail="AI service not available")
            
        prompt = ""
        if custom_prompt_final:
            prompt = custom_prompt_final
        else:
            prompt = f"""
                    You are a professional translator. Translate the following text from {source_lang_final} to {target_lang_final}.
                    **Strictly follow these rules:**
                    1. Preserve ALL markdown formatting (headers, lists, bold, italics, etc.).
                    2. Do NOT modify or remove any image tags (e.g., `![alt text](image_url)`). Leave them exactly as they are.
                    3. Do NOT add new formatting, comments, quoting original text, or explanations.
                    4. Translate ONLY the text content. Ignore code blocks, links, or any non-text elements.
                    5. Maintain the original structure and line breaks.

                    ---
                    {text_final}
                    ---
                """
        
        # Process translation using the async client
        try:
            translation_text = await client.process_translation_async(prompt)                 
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Translation processing failed: {str(e)}")
        
        # Auto-save to database if requested
        if auto_save_final and page_id_final:            
            # Create an async function for database update
            async def update_database():
                try:
                    result = await pages_repo.update_one(
                        {"id": page_id_final},
                        {"$set": {
                            "translation.language": target_lang_final,
                            "translation.model": chosen_model, 
                            "translation.data": translation_text,
                            "updated_at": datetime.now(timezone.utc)
                        }}
                    )                    
                except Exception as db_error:
                    # Don't raise HTTPException inside background task; log or re-raise as Exception
                    raise Exception(f"Failed to update translation data in database.\n{db_error}")                    
            
            # Schedule the database update as a background task
            asyncio.create_task(update_database())
                
        return {"translation": translation_text}
        
    except Exception as e:        
        raise HTTPException(status_code=500, detail=str(e))