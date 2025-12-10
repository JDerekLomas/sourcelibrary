from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from core.models.models import Tenant

class BookBase(BaseModel):
    tenant: Optional[Tenant] = None
    title: str
    display_title: Optional[str] = None
    author: str
    published: str
    language: str

class Book(BookBase):    
    id: str = Field(default_factory=lambda: str(ObjectId()))
    thumbnail: str
    pages_count: Optional[int] = 0  # Calculated dynamically
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    categories: Optional[List[str]] = []  # List of category IDs


class DeleteBookRequest(BaseModel):
    password: str