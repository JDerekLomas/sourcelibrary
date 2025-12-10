import os
from fastapi import HTTPException
from typing import Optional, Tuple, List
import asyncio
from mistralai import Mistral, Document, ImageURLChunk
from mistralai.models import OCRResponse, UserMessage

from ai.services.ai_client_interface import AiClientInterface
from cell.services.s3_service import S3Service

class MistralClient(AiClientInterface):    
    __api_key = os.getenv("MISTRAL_API_KEY")
    __ocr_model = os.getenv("MISTRAL_OCR_MODEL", "mistral-ocr-latest")
    __chat_model = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
    __client = Mistral(api_key=__api_key)

    async def process_ocr_async(
            self,
            book_id: str,
            page_id: str,
            image_url: str,
            language: str,
            custom_prompt: Optional[str] = None,
            s3_service: S3Service | None = None
        ) -> Tuple[str, List[str]]:
        return await self._run_ocr(book_id=book_id,
                                   page_id=page_id,
                                   document=ImageURLChunk(image_url=image_url),
                                   s3=s3_service
                                )

    async def process_translation_async(self, prompt: str) -> str:
        """Process translation asynchronously"""        
        try:
            with self.__client:
                result = await self.__client.chat.complete_async(
                    model=self.__chat_model,
                    messages=[UserMessage(content=prompt)],                
                )
                translation_text = str(result.choices[0].message.content)            
                return translation_text
        
        except Exception as e:
            raise Exception(f"Translation processing failed: {str(e)}")


    async def _run_ocr(self, book_id: str, page_id: str, document: Document, s3: S3Service | None) -> Tuple[str, List[str]]:
        try:
            with self.__client:
                image_response = await self.__client.ocr.process_async(
                    model=self.__ocr_model,
                    document=document,
                    include_image_base64=True
                )
                if not image_response:
                    return "", []

                return await self._get_markdown_with_images(book_id=book_id,
                                                            page_id=page_id,
                                                            ocr_response=image_response,
                                                            s3=s3
                                                           )
        
        except Exception as e:
            raise Exception(f"OCR processing failed: {str(e)}")

    async def _get_markdown_with_images(self,
                                         book_id: str,
                                         page_id: str,
                                         ocr_response: OCRResponse,
                                         s3: S3Service | None
                                    ) -> Tuple[str, List[str]]:
        if s3 is None:
            raise Exception("S3 Service is required for uploading images.")
        
        markdowns: list[str] = []
        all_s3_urls: list[str] = []

        for page in ocr_response.pages:
            image_data = {}
            upload_tasks = []
            img_ids = []

            # Prepare upload tasks for all images in the page            
            for img in page.images:
                if not img.image_base64:
                    continue
                upload_tasks.append(s3.upload_ocr_image(book_id=book_id,
                                                        page_id=page_id,
                                                        base64_data_url=img.image_base64
                                                       ))
                img_ids.append(img.id)

            # Upload all images concurrently
            s3_urls = await asyncio.gather(*upload_tasks)
            all_s3_urls.extend(s3_urls)

            # Map image IDs to their S3 URLs
            for img_id, s3_url in zip(img_ids, s3_urls):
                image_data[img_id] = s3_url

            # Replace base64 in markdown with S3 URLs
            markdowns.append(self.__replace_base64_with_url_in_markdown(page.markdown, image_data))

        return "\n\n".join(markdowns), all_s3_urls

    def __replace_base64_with_url_in_markdown(self, markdown_string: str, images_dict: dict) -> str:
        for img_name, s3_url in images_dict.items():
            markdown_string = markdown_string.replace(f"![{img_name}]({img_name})", f"![{img_name}]({s3_url})")
        return markdown_string

    async def cleanup(self):
        return # No specific cleanup as using context manager (with)
    
try:
    mistral_client = MistralClient()
except Exception as e:
    mistral_client = None
    raise HTTPException(status_code=500, detail="Failed to initialize Mistral AI client!")