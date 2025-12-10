from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from core.models.models import Tenant

class OcrData(BaseModel):
    language: Optional[str] = None
    model: Optional[str] = None
    data: Optional[str] = None
    image_urls: Optional[List[str]] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PageBase(BaseModel):
    tenant: Optional[Tenant] = None
    book_id: str
    page_number: int
    ocr: OcrData
    translation: dict

class Page(PageBase):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    photo: str
    thumbnail: str = ""
    compressed_photo: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PageRequestUpdate(BaseModel):
    requestType: str
    newText: str