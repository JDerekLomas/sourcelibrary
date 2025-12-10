import os
import asyncio
import aiohttp
import ssl
import certifi
from google import genai
from google.genai.types import UploadFileConfig
from typing import Optional, Any, Tuple, List
import random
from contextlib import asynccontextmanager

from ai.services.ai_client_interface import AiClientInterface
from cell.services.s3_service import S3Service

MAX_PARALLEL_REQUESTS = 100  # Max concurrent requests
API_REQUESTS_PER_SECOND = 100  # Max requests per second

class GeminiClient(AiClientInterface):
    def __init__(self):
        try:
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:                
                raise Exception("GEMINI_API_KEY not found")
            
            # Set SSL_CERT_FILE to use certifi's CA bundle for all SSL connections
            os.environ['SSL_CERT_FILE'] = certifi.where()
                        
            self.client = genai.Client(api_key=api_key)
            self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
            
            # Concurrency control
            self.semaphore = asyncio.Semaphore(MAX_PARALLEL_REQUESTS)
            self.rate_limiter = asyncio.Semaphore(API_REQUESTS_PER_SECOND)
            
            # HTTP session for file uploads
            self._session: Optional[aiohttp.ClientSession] = None
            
        except Exception as e:            
            raise Exception(f"Failed to initialize GeminiClient: {str(e)}")
        
    async def get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session with connection pooling"""        
        try:
            if self._session is None or self._session.closed:
                connector = aiohttp.TCPConnector(
                    limit=100,  # Total connection pool size
                    limit_per_host=20,  # Max connections per host
                    ttl_dns_cache=300,  # DNS cache TTL
                    use_dns_cache=True,
                    keepalive_timeout=30,
                    enable_cleanup_closed=True,
                    ssl = ssl.create_default_context(cafile=certifi.where())
                )
                
                timeout = aiohttp.ClientTimeout(
                    total=300,  # 5 minutes total timeout
                    connect=30,  # 30 seconds connect timeout
                    sock_read=60   # 60 seconds read timeout
                )
                
                self._session = aiohttp.ClientSession(
                    connector=connector,
                    timeout=timeout,
                    headers={'User-Agent': 'BookTranslation/1.0'}
                )            
            
            return self._session
        
        except Exception as e:            
            raise Exception(f"Failed to get aiohttp session: {str(e)}")
    
    async def cleanup(self):
        """Close the HTTP session"""
        try:
            if self._session and not self._session.closed:
                await self._session.close()

        except Exception as e:
            raise Exception(f"Failed to close aiohttp session: {str(e)}")            

    @asynccontextmanager
    async def _rate_limit(self):
        """Rate limiting context manager"""
        async with self.rate_limiter:            
            yield
            # Small delay to prevent hitting rate limits
            await asyncio.sleep(1/API_REQUESTS_PER_SECOND)

    async def _download_image_async(self, image_url: str) -> bytes:
        """Download image asynchronously with proper error handling"""
        session = await self.get_session()
        
        max_retries = 3
        for attempt in range(max_retries):
            try:                
                async with session.get(image_url) as response:                    
                    if response.status == 200:
                        image_data = await response.read()                        
                        return image_data
                    else:
                        raise aiohttp.ClientResponseError(
                            request_info=response.request_info,
                            history=response.history,
                            status=response.status,
                            message=f"HTTP {response.status}"
                        )
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to download image after {max_retries} attempts: {str(e)}")
                
                # Exponential backoff
                delay = (2 ** attempt) + random.uniform(0, 1)
                await asyncio.sleep(delay)
            
        raise Exception(f"Failed to download image after {max_retries} attempts.")

    async def _get_mime_type_async(self, image_url: str) -> str:
        """Get MIME type asynchronously"""
        session = await self.get_session()
        
        try:
            async with session.head(image_url) as response:
                mime_type = response.headers.get("Content-Type", "image/jpeg")                
                return mime_type
        except Exception as e:            
            # Fallback to image/jpeg if HEAD request fails
            return "image/jpeg"

    async def _generate_content_async(self, prompt: str, image_file: Optional[Any] = None) -> Any:
        """Generate content with concurrency control and retries"""        
        
        async with self.semaphore:  # Limit concurrent requests            
            async with self._rate_limit():  # Rate limiting
                max_retries = 3
                base_delay = 1.0
                                
                for attempt in range(max_retries):
                    try:                        
                        if image_file:
                            content = [prompt, image_file]  # For OCR with image                                                        
                        else:
                            content = prompt  # For translation without image                            
                        
                        result = await self.client.aio.models.generate_content(
                            model=self.model_name,
                            contents=content,
                        )

                        return result
                        
                    except Exception as e:                        
                        error_message = str(e).lower()
                        
                        # Handle rate limiting
                        if "quota exceeded" in error_message or "rate limit" in error_message:                            
                            if attempt == max_retries - 1:                                
                                raise Exception("Gemini API rate limit exceeded. Please try again later.")
                            
                            # Exponential backoff with jitter for rate limits
                            delay = base_delay * (2 ** attempt) + random.uniform(0, 2)                            
                            await asyncio.sleep(delay)
                            continue
                        
                        # Handle temporary errors
                        elif any(term in error_message for term in ["timeout", "connection", "network", "503", "502", "500"]):                            
                            if attempt == max_retries - 1:
                                raise Exception(f"Gemini API temporary error: {str(e)}")
                            
                            # Shorter delay for temporary errors
                            delay = base_delay + random.uniform(0, 1)
                            await asyncio.sleep(delay)
                            continue
                        
                        # For other errors, fail immediately
                        else:
                            raise Exception(f"Gemini API Error: {str(e)}")

    async def process_ocr_async(self,
                                book_id: str,
                                page_id: str,
                                image_url: str,
                                language: str,
                                custom_prompt: Optional[str] = None,
                                s3_service: Optional[S3Service] = None
                                ) -> Tuple[str, List[str]]:
        """Process OCR asynchronously. Returns OCR text and an empty list for image_urls."""        
        try:
            # Download image and get MIME type concurrently            
            image_task = self._download_image_async(image_url)
            mime_task = self._get_mime_type_async(image_url)
            
            image_data, mime_type = await asyncio.gather(image_task, mime_task)
            
            # Upload file to Gemini            
            from io import BytesIO
            image_buffer = BytesIO(image_data)
            
            # Use asyncio.to_thread for file upload (blocking operation)            
            sample_file = await asyncio.to_thread(
                self.client.files.upload, 
                file=image_buffer,
                config=UploadFileConfig(                    
                    mime_type=mime_type,                    
                )
            )
            
            try:
                # Get file reference
                file = None
                if sample_file and sample_file.name:
                    file = await asyncio.to_thread(self.client.files.get, name=sample_file.name)                            
                
                # Prepare prompt
                if custom_prompt:
                    prompt = custom_prompt
                else:
                    prompt = f"OCR the page in {language} only return ocr. If two pages, ocr the left page first and then the right page."                    
                
                # Generate content                
                result = await self._generate_content_async(prompt, file)                
                ocr_text = str(result.text)

                return ocr_text, []
                
            finally:
                # Clean up uploaded file
                try:
                    if sample_file and sample_file.name:
                        await asyncio.to_thread(self.client.files.delete, name=sample_file.name)                    
                except Exception as cleanup_error:
                    raise Exception(f"Failed to cleanup Gemini file {sample_file.name}: {cleanup_error}")
                    
        except Exception as e:            
            import traceback
            raise Exception(f"OCR processing failed: {str(e)}\nFull Traceback: {traceback.format_exc()}")

    async def process_translation_async(self, prompt: str) -> str:
        """Process translation asynchronously"""
        try:            
            result = await self._generate_content_async(prompt)            
            translation_text = str(result.text)            
            
            return translation_text
            
        except Exception as e:            
            raise Exception(f"Translation processing failed: {str(e)}")

# Global client instance
try:
    gemini_client = GeminiClient()
except Exception as e:
    gemini_client = None
