from pydantic import BaseModel
from typing import Optional

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str
    custom_prompt: Optional[str] = None
    ai_model: Optional[str] = None