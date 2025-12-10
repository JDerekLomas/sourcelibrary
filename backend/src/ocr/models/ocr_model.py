from pydantic import BaseModel
from typing import Optional

class OCRRequest(BaseModel):
    photo_url: str
    language: str
    custom_prompt: Optional[str] = None
    ai_model: Optional[str] = None