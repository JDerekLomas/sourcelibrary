from fastapi import Request, HTTPException
from async_lru import alru_cache
from datetime import timezone

from tenant.models.tenant_model import Tenant
from core.models.primitives_model import EntityStatus
from cell.services.mongo_service import MongoService

_tenant_not_found_exception = HTTPException(status_code=404, detail={"error": "TENANT_NOT_FOUND"})

async def resolve_tenant(request: Request, tenant_id_from_token: str | None) -> Tenant:
    """Resolve tenant based on request information and verify with token if present."""
        
    slug = request.headers.get("x-tenant-slug")
    if not slug:        
        raise HTTPException(400, "Tenant header not found")    

    tenant = await _get_tenant_from_db(slug)
    if tenant_id_from_token and tenant.id != tenant_id_from_token:
        raise HTTPException(401, "Inconsistent Tenant ID in token and resolved tenant.")
    
    return tenant

@alru_cache()
async def _get_tenant_from_db(slug: str) -> Tenant:    
    try:
        query = {"slug": slug}
        doc = await _get_tenants_collection().find_one(query)
        if not doc:
            raise _tenant_not_found_exception        
        
        tenant = Tenant(**doc)
        if tenant.status != EntityStatus.ACTIVE:
            raise _tenant_not_found_exception
        
        return tenant
    except Exception as e:        
        raise e        

# Tenants DB connection should be separate from platform/cell DB
def _get_tenants_collection():
    import os
    
    MONGODB_URL = os.getenv('MONGO_URI_CELL_DEFAULT')
    MONGODB_DB_NAME = os.getenv('MONGO_DB_CELL_DEFAULT')

    mongoService = MongoService(mongo_uri=MONGODB_URL, mongo_db_name=MONGODB_DB_NAME)    
    return mongoService.get_db()["tenants"]