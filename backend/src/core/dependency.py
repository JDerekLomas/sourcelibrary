from typing import Annotated
from fastapi import Depends, Request, HTTPException, status

from core.models.req_context_model import RequestContext
from cell.services.s3_service import S3Service

def get_request_context(request: Request) -> RequestContext:
    ctx = getattr(request.state, "ctx", None)
    if ctx is None:
        raise HTTPException(500, "Request context not initialized")
    return ctx

request_context_dependency = Annotated[RequestContext, Depends(get_request_context)]


def get_s3_service(ctx: request_context_dependency) -> S3Service:
    """Dependency provider for S3Service, creating a new instance per request."""
    cell_config = ctx.cell.config
    return S3Service(
        access_key=cell_config.s3_access_key,
        secret_key=cell_config.s3_secret_key,
        region_name=cell_config.s3_region,
        bucket_name=cell_config.s3_bucket,
        ctx=ctx
    )

s3_service_dependency = Annotated[S3Service, Depends(get_s3_service)]