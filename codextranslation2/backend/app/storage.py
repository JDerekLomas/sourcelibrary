from __future__ import annotations

import random
import textwrap
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from .models import (
    Book,
    Comment,
    ContextResponse,
    EditRequest,
    InfraStatus,
    Page,
    PageVersion,
    PromptTemplates,
    RoleName,
    Tenant,
    User,
)

TENANTS: Dict[str, Tenant] = {}
BOOKS: Dict[str, Book] = {}
PAGES: Dict[str, Page] = {}
REQUESTS: Dict[str, EditRequest] = {}
USERS: Dict[str, User] = {}
COMMENTS: Dict[str, Comment] = {}

PROMPTS = PromptTemplates(
    ocr_prompt="OCR the page in {language} and return the extracted text as markdown.",
    translation_prompt=textwrap.dedent(
        """
        You are a careful translator. Translate from {source_lang} to {target_lang}.
        Keep markdown formatting exactly as provided and do not add commentary.
        Text:
        {text}
        """
    ).strip(),
)


def _id() -> str:
    return uuid.uuid4().hex


def bootstrap() -> None:
    if TENANTS:
        return

    tenant_id = _id()
    TENANTS[tenant_id] = Tenant(
        id=tenant_id,
        name="Codex Translation Cooperative",
        slug="codex",
        branding={"accent": "#7c3aed"},
        permissions={
            RoleName.ADMIN.value: {"books": ["create", "update", "delete", "publish"]},
            RoleName.CURATOR.value: {"books": ["feature", "assign_doi"]},
            RoleName.TRANSLATOR.value: {"pages": ["ocr", "translate"]},
            RoleName.READER.value: {"books": ["read"]},
        },
    )

    book_id = _id()
    BOOKS[book_id] = Book(
        id=book_id,
        tenant_id=tenant_id,
        title="Corpus Hermeticum",
        author="Hermes Trismegistus",
        language="latin",
        published_year=1650,
        keywords=["hermetic", "latin", "philosophy"],
        description="A foundational Hermetic text for translators to practice on.",
        featured=True,
    )

    passages = [
        "Omne quod est, mente est...",
        "Hoc est mysterium magnum, quod translator quaerit...",
    ]

    for number, snippet in enumerate(passages, start=1):
        page_id = _id()
        page = Page(
            id=page_id,
            book_id=book_id,
            page_number=number,
            image_url=f"https://placehold.co/800x1200?text=Page+{number}",
            thumbnail_url=f"https://placehold.co/200x300?text={number}",
            ocr_language="latin",
            translation_language="english",
            ocr_text=None,
            translation_text=None,
        )
        page.versions.append(
            PageVersion(
                version_id=_id(),
                created_at=datetime.utcnow(),
                note="Initial scan",
                ocr_text=None,
                translation_text=None,
            )
        )
        PAGES[page_id] = page

    translator_id = _id()
    USERS[translator_id] = User(
        id=translator_id,
        name="Aurelia",
        role=RoleName.TRANSLATOR,
        tenant_id=tenant_id,
    )


def list_books(tenant_id: Optional[str] = None) -> List[Book]:
    data = [book for book in BOOKS.values() if not tenant_id or book.tenant_id == tenant_id]
    return sorted(data, key=lambda b: b.title.lower())


def list_pages(book_id: str) -> List[Page]:
    return sorted(
        [page for page in PAGES.values() if page.book_id == book_id],
        key=lambda p: p.page_number,
    )


def get_page(page_id: str) -> Page:
    page = PAGES.get(page_id)
    if not page:
        raise KeyError("Page not found")
    return page


def save_page(page: Page) -> None:
    PAGES[page.id] = page


def append_version(page: Page, ocr_text: Optional[str], translation_text: Optional[str], note: str) -> None:
    page.versions.append(
        PageVersion(
            version_id=_id(),
            created_at=datetime.utcnow(),
            ocr_text=ocr_text,
            translation_text=translation_text,
            note=note,
        )
    )


def generate_ocr(language: str, page: Page, prompt: Optional[str]) -> str:
    snippet = f"Simulated OCR ({language}) for page {page.page_number}."
    if prompt:
        snippet += f" Prompt hash: {abs(hash(prompt)) % 9999}."
    snippet += "\n\n" + random.choice(
        [
            "Linea prima: lumen occultum revelatur.",
            "Figura secunda: sphaerae concentus.",
            "Nota bene: textus uetustissimus.",
        ]
    )
    return snippet


def generate_translation(page: Page, prompt: Optional[str]) -> str:
    base_text = page.ocr_text or ""
    translated = base_text.replace("", "")
    translated = (
        translated
        or "This placeholder translation mirrors the OCR text and preserves markdown structure."
    )
    if prompt:
        translated += f"\n\nPrompt fingerprint: {abs(hash(prompt)) % 7777}."
    return translated


def record_request(page: Page, request_type: str, new_text: Optional[str], actor: str) -> EditRequest:
    request_id = _id()
    edit = EditRequest(
        id=request_id,
        page_id=page.id,
        book_id=page.book_id,
        request_type=request_type,
        old_text=page.ocr_text if request_type == "ocr" else page.translation_text,
        new_text=new_text,
        created_by=actor,
    )
    REQUESTS[request_id] = edit
    return edit


def get_context(page_id: str) -> ContextResponse:
    page = get_page(page_id)
    pages = list_pages(page.book_id)
    idx = pages.index(next(p for p in pages if p.id == page_id))
    prev_page = pages[idx - 1] if idx > 0 else None
    next_page = pages[idx + 1] if idx < len(pages) - 1 else None
    return ContextResponse(current_page=page, previous_page=prev_page, next_page=next_page)


def list_requests() -> List[EditRequest]:
    return sorted(REQUESTS.values(), key=lambda r: r.created_at, reverse=True)


def infra_status() -> InfraStatus:
    return InfraStatus(
        version_store="healthy",
        doi_pipeline="idle",
        search_index="syncing",
        automation_queues="running",
    )


def add_comment(page_id: str, author: str, body: str) -> Comment:
    comment_id = _id()
    comment = Comment(id=comment_id, page_id=page_id, author=author, body=body)
    COMMENTS[comment_id] = comment
    return comment


def list_comments(page_id: Optional[str] = None) -> List[Comment]:
    data = list(COMMENTS.values())
    if page_id:
        data = [c for c in data if c.page_id == page_id]
    return sorted(data, key=lambda c: c.created_at)
