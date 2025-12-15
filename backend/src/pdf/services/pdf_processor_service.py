import asyncio
from io import BytesIO
from typing import List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timezone
from PIL import Image

from pdf2image import convert_from_bytes

from ai.services.gemini_ai import GeminiClient
from cell.services.s3_service import S3Service
from book.book_repo import BookRepo
from page.page_repo import PageRepo
from page.models.page_model import Page, OcrData
from core.models.models import Tenant
from utils.helpers import compress_image, MockUploadFile

from pdf.services.image_splitter_service import (
    BoundingBox,
    crop_by_percentage,
    image_to_bytes,
)

_DEFAULT_PAGE_THUMBNAIL_WIDTH: int = 300
_DEFAULT_COMPRESSED_PAGE_WIDTH: int = 1080
_PDF_DPI: int = 150  # Balance between quality and memory


@dataclass
class ProcessedPageInfo:
    page_id: str
    page_number: int
    source_pdf_page: int
    position: str  # "single", "left", "right"
    is_from_spread: bool


@dataclass
class PdfProcessingResult:
    success: bool
    total_pdf_pages: int
    processed_pdf_pages: int
    created_pages: int
    page_ids: List[str]
    remaining_pdf_pages: int
    errors: List[str] = field(default_factory=list)
    details: List[ProcessedPageInfo] = field(default_factory=list)


class PdfProcessorService:
    def __init__(
        self,
        gemini_client: GeminiClient,
        s3_service: S3Service,
        books_repo: BookRepo,
        pages_repo: PageRepo,
    ):
        self.gemini = gemini_client
        self.s3 = s3_service
        self.books_repo = books_repo
        self.pages_repo = pages_repo

    async def process_pdf(
        self,
        pdf_bytes: bytes,
        book_id: str,
        start_page_number: Optional[int] = None,
        enable_spread_detection: bool = True,
        split_confidence_threshold: float = 0.7,
        preview_count: int = 10,
        process_all: bool = False,
        ocr_language: str = "",
        translation_language: str = "English",
        tenant_name: str = "",
        tenant_external_id: str = "",
    ) -> PdfProcessingResult:
        """
        Process PDF file, detect spreads, split pages, and create page records.

        Args:
            pdf_bytes: Raw PDF file bytes
            book_id: Target book ID
            start_page_number: Starting page number (auto-calculated if None)
            enable_spread_detection: Whether to detect and split two-page spreads
            split_confidence_threshold: Minimum confidence to split (0.0-1.0)
            preview_count: Number of PDF pages to process initially (with auto OCR)
            process_all: If True, process entire PDF (no auto OCR for non-preview)
            ocr_language: Language for OCR
            translation_language: Target translation language
            tenant_name: Tenant name
            tenant_external_id: Tenant external ID

        Returns:
            PdfProcessingResult with created page info
        """
        errors = []
        created_pages = []
        details = []

        # Verify book exists
        book = await self.books_repo.find_one({"id": book_id})
        if not book:
            return PdfProcessingResult(
                success=False,
                total_pdf_pages=0,
                processed_pdf_pages=0,
                created_pages=0,
                page_ids=[],
                remaining_pdf_pages=0,
                errors=["Book not found"],
            )

        # Use book's language if not specified
        if not ocr_language:
            ocr_language = book.get("language", "")

        # Calculate starting page number
        if start_page_number is None:
            max_page = await self.pages_repo.find({"book_id": book_id}).sort(
                "page_number", -1
            ).limit(1).to_list(1)
            start_page_number = (max_page[0]["page_number"] + 1) if max_page else 1

        current_page_number = start_page_number

        # Convert PDF to images
        try:
            images = await asyncio.to_thread(
                convert_from_bytes,
                pdf_bytes,
                dpi=_PDF_DPI,
                fmt="jpeg",
            )
        except Exception as e:
            return PdfProcessingResult(
                success=False,
                total_pdf_pages=0,
                processed_pdf_pages=0,
                created_pages=0,
                page_ids=[],
                remaining_pdf_pages=0,
                errors=[f"Failed to convert PDF: {str(e)}"],
            )

        total_pdf_pages = len(images)

        # Determine how many pages to process
        pages_to_process = total_pdf_pages if process_all else min(preview_count, total_pdf_pages)
        remaining_pdf_pages = total_pdf_pages - pages_to_process

        # Process each PDF page
        for pdf_page_idx in range(pages_to_process):
            image = images[pdf_page_idx]
            is_preview = pdf_page_idx < preview_count

            try:
                # Detect spread if enabled
                spread_result = None
                if enable_spread_detection:
                    try:
                        img_bytes = image_to_bytes(image, format="JPEG", quality=85)
                        spread_result = await self.gemini.detect_spread_async(
                            img_bytes.getvalue(),
                            mime_type="image/jpeg"
                        )
                    except Exception as e:
                        errors.append(f"PDF page {pdf_page_idx + 1}: Spread detection failed - {str(e)}")
                        spread_result = None

                # Determine if we should split
                should_split = (
                    spread_result
                    and spread_result.get("is_spread", False)
                    and spread_result.get("confidence", 0) >= split_confidence_threshold
                    and spread_result.get("left_page")
                    and spread_result.get("right_page")
                )

                if should_split:
                    # Split into left and right pages
                    left_bbox = BoundingBox(**spread_result["left_page"])
                    right_bbox = BoundingBox(**spread_result["right_page"])

                    left_image = crop_by_percentage(image, left_bbox)
                    right_image = crop_by_percentage(image, right_bbox)

                    # Create left page
                    left_page_info = await self._create_page_from_image(
                        image=left_image,
                        book_id=book_id,
                        page_number=current_page_number,
                        pdf_page_idx=pdf_page_idx,
                        position="left",
                        is_from_spread=True,
                        ocr_language=ocr_language,
                        translation_language=translation_language,
                        tenant_name=tenant_name,
                        tenant_external_id=tenant_external_id,
                        trigger_ocr=is_preview,
                    )
                    if left_page_info:
                        created_pages.append(left_page_info.page_id)
                        details.append(left_page_info)
                        current_page_number += 1

                    # Create right page
                    right_page_info = await self._create_page_from_image(
                        image=right_image,
                        book_id=book_id,
                        page_number=current_page_number,
                        pdf_page_idx=pdf_page_idx,
                        position="right",
                        is_from_spread=True,
                        ocr_language=ocr_language,
                        translation_language=translation_language,
                        tenant_name=tenant_name,
                        tenant_external_id=tenant_external_id,
                        trigger_ocr=is_preview,
                    )
                    if right_page_info:
                        created_pages.append(right_page_info.page_id)
                        details.append(right_page_info)
                        current_page_number += 1

                else:
                    # Create single page (no split)
                    page_info = await self._create_page_from_image(
                        image=image,
                        book_id=book_id,
                        page_number=current_page_number,
                        pdf_page_idx=pdf_page_idx,
                        position="single",
                        is_from_spread=False,
                        ocr_language=ocr_language,
                        translation_language=translation_language,
                        tenant_name=tenant_name,
                        tenant_external_id=tenant_external_id,
                        trigger_ocr=is_preview,
                    )
                    if page_info:
                        created_pages.append(page_info.page_id)
                        details.append(page_info)
                        current_page_number += 1

            except Exception as e:
                errors.append(f"PDF page {pdf_page_idx + 1}: Failed to process - {str(e)}")

        return PdfProcessingResult(
            success=len(errors) == 0,
            total_pdf_pages=total_pdf_pages,
            processed_pdf_pages=pages_to_process,
            created_pages=len(created_pages),
            page_ids=created_pages,
            remaining_pdf_pages=remaining_pdf_pages,
            errors=errors,
            details=details,
        )

    async def _create_page_from_image(
        self,
        image: Image.Image,
        book_id: str,
        page_number: int,
        pdf_page_idx: int,
        position: str,
        is_from_spread: bool,
        ocr_language: str,
        translation_language: str,
        tenant_name: str,
        tenant_external_id: str,
        trigger_ocr: bool = False,
    ) -> Optional[ProcessedPageInfo]:
        """Create a page record from a PIL Image."""
        try:
            # Create page object
            page = Page(
                tenant=Tenant(
                    name=tenant_name,
                    external_id=tenant_external_id,
                ) if tenant_name else None,
                book_id=book_id,
                page_number=page_number,
                photo="",
                thumbnail="",
                ocr=OcrData(
                    language=ocr_language,
                    model="gemini",
                    data="",
                    image_urls=[],
                ),
                translation={
                    "language": translation_language,
                    "model": "gemini",
                    "data": "",
                },
            )

            # Convert image to bytes
            img_bytes = image_to_bytes(image, format="JPEG", quality=90)
            img_bytes_copy1 = BytesIO(img_bytes.getvalue())
            img_bytes_copy2 = BytesIO(img_bytes.getvalue())
            img_bytes_copy3 = BytesIO(img_bytes.getvalue())

            # Upload original image
            mock_photo = MockUploadFile(img_bytes_copy1, f"page_{page_number}.jpg", "image/jpeg")
            page.photo = await self.s3.upload_page_image(
                book_id=book_id, page_id=page.id, file=mock_photo
            )

            # Generate and upload thumbnail
            thumbnail_data = await compress_image(img_bytes_copy2, max_width=_DEFAULT_PAGE_THUMBNAIL_WIDTH)
            page.thumbnail = await self.s3.upload_page_thumbnail(
                book_id=book_id,
                page_id=page.id,
                width=_DEFAULT_PAGE_THUMBNAIL_WIDTH,
                thumbnail_data=thumbnail_data,
            )

            # Generate and upload compressed image
            compressed_data = await compress_image(img_bytes_copy3, max_width=_DEFAULT_COMPRESSED_PAGE_WIDTH)
            page.compressed_photo = await self.s3.upload_compressed_page_image(
                book_id=book_id,
                page_id=page.id,
                width=_DEFAULT_COMPRESSED_PAGE_WIDTH,
                compressed_data=compressed_data,
            )

            # Save to database
            await self.pages_repo.insert_one(page.model_dump())

            # Trigger OCR if requested (for preview pages)
            if trigger_ocr and page.compressed_photo and ocr_language:
                asyncio.create_task(
                    self._process_ocr_and_translation(
                        page_id=page.id,
                        book_id=book_id,
                        image_url=page.compressed_photo,
                        ocr_language=ocr_language,
                        translation_language=translation_language,
                    )
                )

            return ProcessedPageInfo(
                page_id=page.id,
                page_number=page_number,
                source_pdf_page=pdf_page_idx + 1,
                position=position,
                is_from_spread=is_from_spread,
            )

        except Exception as e:
            raise Exception(f"Failed to create page: {str(e)}")

    async def _process_ocr_and_translation(
        self,
        page_id: str,
        book_id: str,
        image_url: str,
        ocr_language: str,
        translation_language: str,
    ):
        """Background task to process OCR and translation for a page."""
        try:
            # Process OCR
            ocr_text, image_urls = await self.gemini.process_ocr_async(
                book_id=book_id,
                page_id=page_id,
                image_url=image_url,
                language=ocr_language,
                custom_prompt=None,
                s3_service=self.s3,
            )

            # Update OCR in database
            ocr_result = OcrData(
                language=ocr_language,
                model="gemini",
                data=ocr_text,
                image_urls=image_urls,
                updated_at=datetime.now(timezone.utc),
            )
            await self.pages_repo.update_one(
                {"id": page_id},
                {"$set": {"ocr": ocr_result.model_dump()}},
            )

            # Process translation if OCR was successful
            if ocr_text and translation_language:
                prompt = f"""
                    You are a professional translator. Translate the following text from {ocr_language} to {translation_language}.
                    **Strictly follow these rules:**
                    1. Preserve ALL markdown formatting (headers, lists, bold, italics, etc.).
                    2. Do NOT modify or remove any image tags (e.g., `![alt text](image_url)`). Leave them exactly as they are.
                    3. Do NOT add new formatting, comments, quoting original text, or explanations.
                    4. Translate ONLY the text content. Ignore code blocks, links, or any non-text elements.
                    5. Maintain the original structure and line breaks.

                    ---
                    {ocr_text}
                    ---
                """
                translation_text = await self.gemini.process_translation_async(prompt)

                # Update translation in database
                await self.pages_repo.update_one(
                    {"id": page_id},
                    {
                        "$set": {
                            "translation.language": translation_language,
                            "translation.model": "gemini",
                            "translation.data": translation_text,
                            "updated_at": datetime.now(timezone.utc),
                        }
                    },
                )

        except Exception as e:
            # Log error but don't raise - this is a background task
            print(f"OCR/Translation failed for page {page_id}: {str(e)}")


async def process_remaining_pdf_pages(
    gemini_client: GeminiClient,
    s3_service: S3Service,
    books_repo: BookRepo,
    pages_repo: PageRepo,
    pdf_bytes: bytes,
    book_id: str,
    start_pdf_page: int,
    start_page_number: int,
    enable_spread_detection: bool = True,
    split_confidence_threshold: float = 0.7,
    ocr_language: str = "",
    translation_language: str = "English",
    tenant_name: str = "",
    tenant_external_id: str = "",
) -> PdfProcessingResult:
    """
    Process remaining PDF pages after preview.
    This processes pages without auto OCR/translation.
    """
    service = PdfProcessorService(
        gemini_client=gemini_client,
        s3_service=s3_service,
        books_repo=books_repo,
        pages_repo=pages_repo,
    )

    # Convert PDF to get total pages
    images = await asyncio.to_thread(
        convert_from_bytes,
        pdf_bytes,
        dpi=_PDF_DPI,
        fmt="jpeg",
        first_page=start_pdf_page + 1,  # pdf2image is 1-indexed
    )

    total_remaining = len(images)
    errors = []
    created_pages = []
    details = []
    current_page_number = start_page_number

    for idx, image in enumerate(images):
        pdf_page_idx = start_pdf_page + idx

        try:
            # Detect spread if enabled
            spread_result = None
            if enable_spread_detection:
                try:
                    img_bytes = image_to_bytes(image, format="JPEG", quality=85)
                    spread_result = await gemini_client.detect_spread_async(
                        img_bytes.getvalue(),
                        mime_type="image/jpeg"
                    )
                except Exception:
                    spread_result = None

            should_split = (
                spread_result
                and spread_result.get("is_spread", False)
                and spread_result.get("confidence", 0) >= split_confidence_threshold
                and spread_result.get("left_page")
                and spread_result.get("right_page")
            )

            if should_split:
                left_bbox = BoundingBox(**spread_result["left_page"])
                right_bbox = BoundingBox(**spread_result["right_page"])

                left_image = crop_by_percentage(image, left_bbox)
                right_image = crop_by_percentage(image, right_bbox)

                # Create pages without OCR trigger
                left_info = await service._create_page_from_image(
                    image=left_image,
                    book_id=book_id,
                    page_number=current_page_number,
                    pdf_page_idx=pdf_page_idx,
                    position="left",
                    is_from_spread=True,
                    ocr_language=ocr_language,
                    translation_language=translation_language,
                    tenant_name=tenant_name,
                    tenant_external_id=tenant_external_id,
                    trigger_ocr=False,
                )
                if left_info:
                    created_pages.append(left_info.page_id)
                    details.append(left_info)
                    current_page_number += 1

                right_info = await service._create_page_from_image(
                    image=right_image,
                    book_id=book_id,
                    page_number=current_page_number,
                    pdf_page_idx=pdf_page_idx,
                    position="right",
                    is_from_spread=True,
                    ocr_language=ocr_language,
                    translation_language=translation_language,
                    tenant_name=tenant_name,
                    tenant_external_id=tenant_external_id,
                    trigger_ocr=False,
                )
                if right_info:
                    created_pages.append(right_info.page_id)
                    details.append(right_info)
                    current_page_number += 1

            else:
                page_info = await service._create_page_from_image(
                    image=image,
                    book_id=book_id,
                    page_number=current_page_number,
                    pdf_page_idx=pdf_page_idx,
                    position="single",
                    is_from_spread=False,
                    ocr_language=ocr_language,
                    translation_language=translation_language,
                    tenant_name=tenant_name,
                    tenant_external_id=tenant_external_id,
                    trigger_ocr=False,
                )
                if page_info:
                    created_pages.append(page_info.page_id)
                    details.append(page_info)
                    current_page_number += 1

        except Exception as e:
            errors.append(f"PDF page {pdf_page_idx + 1}: {str(e)}")

    return PdfProcessingResult(
        success=len(errors) == 0,
        total_pdf_pages=total_remaining,
        processed_pdf_pages=total_remaining,
        created_pages=len(created_pages),
        page_ids=created_pages,
        remaining_pdf_pages=0,
        errors=errors,
        details=details,
    )
