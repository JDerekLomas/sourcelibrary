from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from book.book_repo import get_books_repo
from page.page_repo import get_pages_repo

from core.dependency import s3_service_dependency
from auth.services.rbac_service import need_permission, ResourceType, ActionType
from ai.services.gemini_ai import gemini_client

from pdf.services.pdf_processor_service import (
    PdfProcessorService,
    PdfProcessingResult,
    ProcessedPageInfo,
)

router = APIRouter()

MAX_PDF_SIZE_MB = 100
MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024


class PdfProcessResponse(BaseModel):
    success: bool
    total_pdf_pages: int
    processed_pdf_pages: int
    created_pages: int
    page_ids: List[str]
    remaining_pdf_pages: int
    errors: List[str]


@router.post(
    "/process",
    response_model=PdfProcessResponse,
    dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.CREATE))],
)
async def process_pdf_upload(
    s3: s3_service_dependency,
    pages_repo=Depends(get_pages_repo),
    books_repo=Depends(get_books_repo),
    book_id: str = Form(...),
    pdf_file: UploadFile = File(...),
    enable_spread_detection: bool = Form(True),
    split_confidence_threshold: float = Form(0.7),
    preview_count: int = Form(10),
    process_all: bool = Form(False),
    ocr_language: Optional[str] = Form(None),
    translation_language: str = Form("English"),
    tenant_name: Optional[str] = Form(None),
    tenant_external_id: Optional[str] = Form(None),
):
    """
    Upload and process a PDF file with automatic spread detection and splitting.

    - **book_id**: Target book ID for the pages
    - **pdf_file**: PDF file to process (max 100MB)
    - **enable_spread_detection**: Whether to detect and split two-page spreads (default: true)
    - **split_confidence_threshold**: Minimum confidence to split spreads (0.0-1.0, default: 0.7)
    - **preview_count**: Number of PDF pages to process with auto OCR/translation (default: 10)
    - **process_all**: If true, process entire PDF without auto OCR for non-preview pages
    - **ocr_language**: Language for OCR (uses book's language if not specified)
    - **translation_language**: Target translation language (default: English)

    Returns processed page information including created page IDs.
    """
    # Validate file type
    if not pdf_file.filename or not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if pdf_file.content_type and pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    # Check Gemini client availability
    if not gemini_client:
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please check GEMINI_API_KEY configuration.",
        )

    # Read PDF content
    try:
        pdf_bytes = await pdf_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")

    # Validate file size
    if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF file too large. Maximum size is {MAX_PDF_SIZE_MB}MB",
        )

    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="PDF file is empty")

    # Validate confidence threshold
    if not 0.0 <= split_confidence_threshold <= 1.0:
        raise HTTPException(
            status_code=400,
            detail="split_confidence_threshold must be between 0.0 and 1.0",
        )

    # Validate preview count
    if preview_count < 1:
        raise HTTPException(status_code=400, detail="preview_count must be at least 1")

    # Create processor service
    processor = PdfProcessorService(
        gemini_client=gemini_client,
        s3_service=s3,
        books_repo=books_repo,
        pages_repo=pages_repo,
    )

    # Process PDF
    try:
        result: PdfProcessingResult = await processor.process_pdf(
            pdf_bytes=pdf_bytes,
            book_id=book_id,
            enable_spread_detection=enable_spread_detection,
            split_confidence_threshold=split_confidence_threshold,
            preview_count=preview_count,
            process_all=process_all,
            ocr_language=ocr_language or "",
            translation_language=translation_language,
            tenant_name=tenant_name or "",
            tenant_external_id=tenant_external_id or "",
        )

        return PdfProcessResponse(
            success=result.success,
            total_pdf_pages=result.total_pdf_pages,
            processed_pdf_pages=result.processed_pdf_pages,
            created_pages=result.created_pages,
            page_ids=result.page_ids,
            remaining_pdf_pages=result.remaining_pdf_pages,
            errors=result.errors,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")


@router.post(
    "/process-remaining",
    response_model=PdfProcessResponse,
    dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.CREATE))],
)
async def process_remaining_pdf(
    s3: s3_service_dependency,
    pages_repo=Depends(get_pages_repo),
    books_repo=Depends(get_books_repo),
    book_id: str = Form(...),
    pdf_file: UploadFile = File(...),
    start_pdf_page: int = Form(...),
    start_page_number: int = Form(...),
    enable_spread_detection: bool = Form(True),
    split_confidence_threshold: float = Form(0.7),
    ocr_language: Optional[str] = Form(None),
    translation_language: str = Form("English"),
    tenant_name: Optional[str] = Form(None),
    tenant_external_id: Optional[str] = Form(None),
):
    """
    Process remaining PDF pages after preview.
    This endpoint processes pages without auto OCR/translation.

    - **book_id**: Target book ID
    - **pdf_file**: Same PDF file used in preview
    - **start_pdf_page**: PDF page index to start from (0-indexed)
    - **start_page_number**: Book page number to start from
    - **enable_spread_detection**: Whether to detect spreads
    - **split_confidence_threshold**: Confidence threshold for splitting
    """
    # Validate file type
    if not pdf_file.filename or not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not gemini_client:
        raise HTTPException(status_code=503, detail="AI service not available")

    try:
        pdf_bytes = await pdf_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")

    if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF file too large. Maximum size is {MAX_PDF_SIZE_MB}MB",
        )

    from pdf.services.pdf_processor_service import process_remaining_pdf_pages

    try:
        result = await process_remaining_pdf_pages(
            gemini_client=gemini_client,
            s3_service=s3,
            books_repo=books_repo,
            pages_repo=pages_repo,
            pdf_bytes=pdf_bytes,
            book_id=book_id,
            start_pdf_page=start_pdf_page,
            start_page_number=start_page_number,
            enable_spread_detection=enable_spread_detection,
            split_confidence_threshold=split_confidence_threshold,
            ocr_language=ocr_language or "",
            translation_language=translation_language,
            tenant_name=tenant_name or "",
            tenant_external_id=tenant_external_id or "",
        )

        return PdfProcessResponse(
            success=result.success,
            total_pdf_pages=result.total_pdf_pages,
            processed_pdf_pages=result.processed_pdf_pages,
            created_pages=result.created_pages,
            page_ids=result.page_ids,
            remaining_pdf_pages=result.remaining_pdf_pages,
            errors=result.errors,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")
