from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class RoleName(str, Enum):
    ADMIN = "admin"
    CURATOR = "curator"
    TRANSLATOR = "translator"
    READER = "reader"


class Tenant(BaseModel):
    id: str
    name: str
    slug: str
    branding: dict = Field(default_factory=dict)
    permissions: dict = Field(default_factory=dict)


class Book(BaseModel):
    id: str
    tenant_id: str
    title: str
    author: str
    language: str
    published_year: Optional[int] = None
    keywords: List[str] = Field(default_factory=list)
    featured: bool = False
    doi: Optional[str] = None
    published_version_id: Optional[str] = None
    description: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class PageVersion(BaseModel):
    version_id: str
    created_at: datetime
    ocr_text: Optional[str] = None
    translation_text: Optional[str] = None
    note: Optional[str] = None


class Page(BaseModel):
    id: str
    book_id: str
    page_number: int
    image_url: str
    thumbnail_url: Optional[str] = None
    ocr_text: Optional[str] = None
    translation_text: Optional[str] = None
    ocr_language: str = "latin"
    translation_language: str = "english"
    versions: List[PageVersion] = Field(default_factory=list)


class PromptTemplates(BaseModel):
    ocr_prompt: str
    translation_prompt: str


class OCRRequest(BaseModel):
    page_id: str
    language: str
    prompt: Optional[str] = None


class TranslationRequest(BaseModel):
    page_id: str
    source_language: str
    target_language: str
    prompt: Optional[str] = None


class EditRequest(BaseModel):
    id: str
    page_id: str
    book_id: str
    request_type: str
    old_text: Optional[str]
    new_text: Optional[str]
    status: str = "pending"
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    review: Optional[str] = None


class ContextResponse(BaseModel):
    current_page: Page
    previous_page: Optional[Page] = None
    next_page: Optional[Page] = None


class InfraStatus(BaseModel):
    version_store: str
    doi_pipeline: str
    search_index: str
    automation_queues: str


class PublishRequest(BaseModel):
    doi: Optional[str] = None
    featured: Optional[bool] = None
    published_version_id: Optional[str] = None


class User(BaseModel):
    id: str
    name: str
    role: RoleName
    tenant_id: str


class RoleGrant(BaseModel):
    user_id: str
    role: RoleName


class Comment(BaseModel):
    id: str
    page_id: str
    author: str
    body: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
