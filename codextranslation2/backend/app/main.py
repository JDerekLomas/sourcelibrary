from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .models import (
    Book,
    Comment,
    ContextResponse,
    EditRequest,
    InfraStatus,
    OCRRequest,
    Page,
    PageVersion,
    PromptTemplates,
    PublishRequest,
    RoleName,
    Tenant,
    TranslationRequest,
    User,
)
from . import storage

storage.bootstrap()

app = FastAPI(title="CodexTranslation2", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BookCreate(BaseModel):
    title: str
    author: str
    language: str
    keywords: List[str] = Field(default_factory=list)
    published_year: Optional[int] = None
    description: Optional[str] = None
    tenant_id: Optional[str] = None


class PageCreate(BaseModel):
    book_id: str
    page_number: int
    image_url: str
    thumbnail_url: Optional[str] = None
    ocr_language: str = "latin"
    translation_language: str = "english"


class CommentCreate(BaseModel):
    author: str
    body: str


class RequestStatusUpdate(BaseModel):
    status: str
    review: Optional[str] = None


@app.get("/tenants", response_model=List[Tenant])
def list_tenants():
    return list(storage.TENANTS.values())


@app.get("/prompts", response_model=PromptTemplates)
def get_prompts():
    return storage.PROMPTS


@app.get("/books", response_model=List[Book])
def get_books(tenant_id: Optional[str] = None):
    return storage.list_books(tenant_id)


@app.post("/books", response_model=Book)
def create_book(payload: BookCreate):
    tenant_id = payload.tenant_id or next(iter(storage.TENANTS.keys()))
    book_id = storage._id()  # type: ignore[attr-defined]
    book = Book(
        id=book_id,
        tenant_id=tenant_id,
        title=payload.title,
        author=payload.author,
        language=payload.language,
        keywords=payload.keywords,
        description=payload.description,
        published_year=payload.published_year,
    )
    storage.BOOKS[book_id] = book
    return book


@app.get("/books/{book_id}", response_model=Book)
def get_book(book_id: str):
    book = storage.BOOKS.get(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@app.get("/books/{book_id}/pages", response_model=List[Page])
def pages_for_book(book_id: str):
    return storage.list_pages(book_id)


@app.post("/books/{book_id}/pages", response_model=Page)
def create_page(book_id: str, payload: PageCreate):
    if book_id not in storage.BOOKS:
        raise HTTPException(status_code=404, detail="Book not found")
    page_id = storage._id()  # type: ignore[attr-defined]
    page = Page(
        id=page_id,
        book_id=book_id,
        page_number=payload.page_number,
        image_url=payload.image_url,
        thumbnail_url=payload.thumbnail_url,
        ocr_language=payload.ocr_language,
        translation_language=payload.translation_language,
    )
    storage.save_page(page)
    return page


@app.get("/pages/{page_id}", response_model=Page)
def get_page(page_id: str):
    try:
        return storage.get_page(page_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Page not found")


@app.get("/pages/{page_id}/history", response_model=List[PageVersion])
def get_page_history(page_id: str):
    page = get_page(page_id)
    return page.versions


@app.post("/ocr/run", response_model=Page)
def run_ocr(request: OCRRequest, actor: str = "translator" ):
    page = get_page(request.page_id)
    text = storage.generate_ocr(request.language, page, request.prompt)
    page.ocr_text = text
    page.ocr_language = request.language
    storage.append_version(page, text, page.translation_text, note=f"OCR by {actor}")
    storage.save_page(page)
    storage.record_request(page, "ocr", text, actor)
    return page


@app.post("/translate/run", response_model=Page)
def run_translation(request: TranslationRequest, actor: str = "translator"):
    page = get_page(request.page_id)
    if not page.ocr_text:
        raise HTTPException(status_code=400, detail="Run OCR first")
    text = storage.generate_translation(page, request.prompt)
    page.translation_text = text
    page.translation_language = request.target_language
    storage.append_version(page, page.ocr_text, text, note=f"Translation by {actor}")
    storage.save_page(page)
    storage.record_request(page, "translation", text, actor)
    return page


@app.get("/context/{page_id}", response_model=ContextResponse)
def get_context(page_id: str):
    return storage.get_context(page_id)


@app.get("/requests", response_model=List[EditRequest])
def get_requests():
    return storage.list_requests()


@app.patch("/requests/{request_id}", response_model=EditRequest)
def update_request(request_id: str, payload: RequestStatusUpdate):
    request = storage.REQUESTS.get(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    request.status = payload.status
    if payload.review:
        request.review = payload.review  # type: ignore[attr-defined]
    return request


@app.post("/books/{book_id}/publish", response_model=Book)
def publish_book(book_id: str, payload: PublishRequest):
    book = storage.BOOKS.get(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if payload.doi is not None:
        book.doi = payload.doi
    if payload.featured is not None:
        book.featured = payload.featured
    if payload.published_version_id is not None:
        book.published_version_id = payload.published_version_id
    book.last_updated = datetime.utcnow()
    storage.BOOKS[book_id] = book
    return book


@app.get("/reader/search", response_model=List[Book])
def search_books(query: str = ""):
    terms = query.lower().split()
    if not terms:
        return list(storage.BOOKS.values())
    results = []
    for book in storage.BOOKS.values():
        haystack = " ".join(
            [book.title, book.author, book.language, " ".join(book.keywords)]
        ).lower()
        if all(term in haystack for term in terms):
            results.append(book)
    return results


@app.get("/infra/status", response_model=InfraStatus)
def get_infra_status():
    return storage.infra_status()


@app.get("/users", response_model=List[User])
def list_users():
    return list(storage.USERS.values())


@app.post("/pages/{page_id}/comments", response_model=Comment)
def create_comment(page_id: str, payload: CommentCreate):
    get_page(page_id)  # ensure exists
    return storage.add_comment(page_id, payload.author, payload.body)


@app.get("/pages/{page_id}/comments", response_model=List[Comment])
def comments_for_page(page_id: str):
    return storage.list_comments(page_id)
