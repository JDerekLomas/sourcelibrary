from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

class EditRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    book_id: str  # Reference to Book
    page_id: str  # Reference to Page
    username: str
    oldText: str
    newText: str
    requestType: str = Field(default="translation", description="Type of the request: ocr, translation")
    status: str = Field(default="pending", description="Status of the request: pending, accepted, rejected")
    description: Optional[str] = ""
    review: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    book_title: Optional[str] = None
    page_number: Optional[int] = None


class RequestUpdate(BaseModel):
    status: Optional[str] = None
    review: Optional[str] = None
    newText: Optional[str] = None