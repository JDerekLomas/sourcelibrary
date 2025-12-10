from motor.motor_asyncio import AsyncIOMotorCollection

from core.models.req_context_model import RequestContext
from core.dependency import request_context_dependency

class TenantRepo():
    def __init__(self, collection_name: str, ctx: RequestContext):    
        self._ctx = ctx
        self._tenant_id = ctx.tenant_id
        self.collection: AsyncIOMotorCollection = ctx.db[collection_name]

def get_tenant_repo(req_ctx: request_context_dependency) -> AsyncIOMotorCollection:
    return TenantRepo(collection_name="tenants", ctx=req_ctx).collection