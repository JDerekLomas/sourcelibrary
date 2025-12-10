from abc import ABC, abstractmethod
from typing import Optional, Tuple, List
from cell.services.s3_service import S3Service

class AiClientInterface(ABC):
    """Abstract Base Class for AI clients."""

    name: str

    @abstractmethod
    async def process_ocr_async(
        self,
        book_id: str,
        page_id: str,
        image_url: str,
        language: str,
        custom_prompt: Optional[str] = None,
        s3_service: Optional[S3Service] = None
    ) -> Tuple[str, List[str]]:
        """
        Process an image URL to extract text (OCR).
        Should return the extracted text and a list of any
        generated image URLs (e.g., from S3 uploaded by Mistral OCR).
        """
        pass

    @abstractmethod
    async def process_translation_async(self, prompt: str) -> str:
        """
        Process a prompt to generate a translation.
        """
        pass

    @abstractmethod
    async def cleanup(self):
        """
        Clean up any resources, such as closing network sessions.
        """
        pass
