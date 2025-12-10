import asyncio
import base64
from io import BytesIO
import os
import re
from typing import List
from urllib.parse import urlparse
import uuid
import aioboto3
from botocore.config import Config as BotoConfig
from fastapi import HTTPException, UploadFile

from utils.helpers import MockUploadFile
from core.models.req_context_model import RequestContext

class S3Service:
    def __init__(self,
                 access_key: str | None,
                 secret_key: str | None,
                 region_name: str | None,
                 bucket_name: str | None,
                 ctx: RequestContext
                ):
        if not access_key:
            raise ValueError("S3 access key must be provided")
        if not secret_key:
            raise ValueError("S3 secret key must be provided")
        if not region_name:
            raise ValueError("S3 region name must be provided")
        if not bucket_name:
            raise ValueError("S3 bucket name must be provided")
        
        self.botoconfig = BotoConfig(retries={'max_attempts': 3, 'mode': 'standard'})
        self.session = aioboto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region_name,
        )
        self.tenant_id = ctx.tenant_id
        self.bucket_name = bucket_name
        self._public_base = f"https://{bucket_name}.s3.{region_name}.amazonaws.com"
    
    async def _upload_file_to_s3(self, object_name: str, file_or_data, content_type: str = 'image/jpeg') -> str:
        """
        Handles uploading a file-like object or UploadFile to S3 at the given object_name.
        """
        obj_key_with_tenant = f"tenants/{self.tenant_id}/{object_name}"
        try:
            if isinstance(file_or_data, UploadFile):
                file_obj = file_or_data.file
            else:
                file_obj = file_or_data  # e.g., BytesIO

            async with self.session.client('s3', config=self.botoconfig) as s3:
                await s3.upload_fileobj(
                    file_obj,
                    self.bucket_name,
                    obj_key_with_tenant,
                    ExtraArgs={'ACL': 'public-read', 'ContentType': content_type}
                )
            return f"{self._public_base}/{obj_key_with_tenant}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading thumbnail: {str(e)}")
            
    
    # --- Book Thumbnail Upload ---
    async def upload_book_thumbnail(self, book_id: str, width: int, file: MockUploadFile) -> str:
        """Uploads a book thumbnail to the path
        `../books/<book_id>/thumbnails/<width>w_<uuid>.jpg`
        """        
        filename = f"{width}w_{uuid.uuid4()}.jpg"
        obj_name = f"books/{book_id}/thumbnails/{filename}"
        return await self._upload_file_to_s3(obj_name, file.file, file.content_type or 'image/jpeg')

    # --- Page Image Upload ---
    async def upload_page_image(self, book_id: str, page_id: str, file: MockUploadFile) -> str:
        """Uploads a page image to path
        `../books/<book_id>/pages/<page_id>/page_<uuid>.<ext>`
        """
        file_extension = os.path.splitext(file.filename)[1] if file else '.png'
        new_filename = f"page_{uuid.uuid4()}{file_extension}"
        object_name = f"books/{book_id}/pages/{page_id}/{new_filename}"
        return await self._upload_file_to_s3(object_name, file.file, file.content_type or 'image/png')

    # --- Page Thumbnail Upload ---
    async def upload_page_thumbnail(self, book_id: str, page_id: str, width: int, thumbnail_data: BytesIO) -> str:
        """Uploads a page thumbnail to path
        `../books/<book_id>/pages/<page_id>/thumbnails/<width>w_<uuid>.jpg`
        """
        new_filename = f"{width}w_{uuid.uuid4()}.jpg"
        object_name = f"books/{book_id}/pages/{page_id}/thumbnails/{new_filename}"
        return await self._upload_file_to_s3(object_name, thumbnail_data, 'image/jpeg')

    # --- Compressed Page Image Upload ---
    async def upload_compressed_page_image(self, book_id: str, page_id: str, width: int, compressed_data: BytesIO) -> str:
        """Uploads a compressed page image to path,
        `../books/<book_id>/pages/<page_id>/compressed/<width>w_<uuid>.jpg`
        """
        new_filename = f"{width}w_{uuid.uuid4()}.jpg"
        object_name = f"books/{book_id}/pages/{page_id}/compressed/{new_filename}"
        return await self._upload_file_to_s3(object_name, compressed_data, 'image/jpeg')

    # --- Base64 Image of OCR Clippings Upload ---
    async def upload_ocr_image(self, book_id: str, page_id: str, base64_data_url: str) -> str:
        """
        Decodes a base64 data URL, uploads the image to S3, and returns the public URL.
        Stored at `../books/<book_id>/pages/<page_id>/content/ocr_<uuid>.<ext>`
        """
        try:
            header, encoded = base64_data_url.split(",", 1)
            match = re.search(r"data:image/(?P<ext>\w+);base64", header)
            
            ext = match.group("ext") if match else "jpg"
            content_type = f"image/{ext}"
            
            image_data = base64.b64decode(encoded)
            image_bytes_io = BytesIO(image_data)
            
            object_name = f"books/{book_id}/pages/{page_id}/content/ocr_{uuid.uuid4()}.{ext}"
            return await self._upload_file_to_s3(object_name, image_bytes_io, content_type)            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading to S3: {str(e)}")

    # --- Delete by URLs ---
    async def delete_files(self, file_urls: List[str]):
        """
        Asynchronously deletes one or more files from S3 given their full URLs.
        """
        if not file_urls:
            return

        keys_to_delete = []
        for url in file_urls:
            if not url:
                continue
            try:
                # Parse the URL to safely extract the path component
                parsed_url = urlparse(url)
                # The S3 object key is the path, stripped of the leading slash
                key = parsed_url.path.lstrip('/')
                if key:
                    keys_to_delete.append({'Key': key})
            except Exception:
                # Ignore malformed URLs and continue
                continue

        if not keys_to_delete:
            return

        delete_payload = {'Objects': keys_to_delete}
        try:
            async with self.session.client('s3', config=self.botoconfig) as s3:
                await s3.delete_objects(
                    Bucket=self.bucket_name,
                    Delete=delete_payload
                )
        except Exception as e:
            # Log the error instead of crashing the request for a failed cleanup
            print(f"Error batch deleting from S3: {str(e)}")
    
    # --- Delete by Prefix ---
    async def delete_tenant_files(self, tenant_id: str):
        """Deletes all files for a given tenant."""
        prefix = f"tenants/{tenant_id}/"
        await self._delete_prefix_from_s3(prefix)

    async def delete_book_files(self, book_id: str):
        """Deletes all files for a given book.
        Automatically picks tenant from context."""
        prefix = f"tenants/{self.tenant_id}/books/{book_id}/"
        await self._delete_prefix_from_s3(prefix)

    async def delete_page_files(self, book_id: str, page_id: str):
        """Deletes all files for a given page.
        Automatically picks tenant from context."""
        prefix = f"tenants/{self.tenant_id}/books/{book_id}/pages/{page_id}/"
        await self._delete_prefix_from_s3(prefix)

    async def _delete_prefix_from_s3(self, prefix: str):
        """
        Deletes all objects under a given prefix (e.g., 'tenants/<tenant_id>/' or 'books/<book_id>/').
        
        >Example Usage:\n
        >Delete all files for a tenant: `await delete_prefix_from_s3(f"tenants/{tenant_id}/")`\n
        >Delete all files for a book: `await delete_prefix_from_s3(f"tenants/{tenant_id}/books/{book_id}/")`\n
        >Delete all files for a page: `await delete_prefix_from_s3(f"tenants/{tenant_id}/books/{book_id}/pages/{page_id}/")`\n
        >Delete specific files (old way, e.g. for replacing a thumbnail): `await delete_files_from_s3([old_thumbnail_url])`
        """
        try:
            async with self.session.client('s3', config=self.botoconfig) as s3:
                paginator = s3.get_paginator('list_objects_v2')
                
                async def delete_batch(keys):
                    if keys:
                        await s3.delete_objects(
                            Bucket=self.bucket_name,
                            Delete={'Objects': [{'Key': k} for k in keys]}
                        )

                keys = []
                async for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
                    for obj in page.get('Contents', []):
                        keys.append(obj['Key'])
                        if len(keys) >= 1000:
                            await delete_batch(keys)
                            keys = []
                if keys:
                    await delete_batch(keys)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting prefix from S3: {str(e)}")