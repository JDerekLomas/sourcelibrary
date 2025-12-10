import os
from fastapi import APIRouter, HTTPException, Depends

from core.dependency import request_context_dependency
from auth.services.rbac_service import need_permission, ResourceType, ActionType

from core.dependency import s3_service_dependency

router = APIRouter()

@router.delete("/clear/{password}", dependencies=[Depends(need_permission(ResourceType.TENANT, ActionType.DELETE))])
async def clear_collection(password: str, req_ctx: request_context_dependency, s3: s3_service_dependency):    
    expected_hash = os.getenv("NUKE_PROJECT")  # SHA256
    
    from hashlib import sha256
    password_hash = sha256(password.encode()).hexdigest()
    
    if password_hash != expected_hash:
        raise HTTPException(status_code=401, detail="Unauthorized")

    query = {"tenant_id": req_ctx.tenant_id}
    await req_ctx.db.books.delete_many(query)
    await req_ctx.db.pages.delete_many(query)
    await s3.delete_tenant_files(req_ctx.tenant_id)
        
    return {"message": "All data cleared"}