from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import List

from core.security import oauth2_scheme
from core.models.req_context_model import RequestContext
from tenant.models.tenant_model import TenantRolePermissions

from cell.services.cell_manager import get_cell
from tenant.services.tenant_resolver import resolve_tenant
from auth.services.token_services import decode_access_token

from user.user_repo import get_user_repo
from user.services.user_services import get_user_roles

DOCUMENTATION_PATHS = {
    "/docs",
    "/redoc",
    "/openapi.json"
}

async def context_middleware(request: Request, call_next):
    ctx: RequestContext | None = None

    # Skip middleware for documentation paths
    if request.url.path in DOCUMENTATION_PATHS:
        return await call_next(request)

    try:
        raw_token = await oauth2_scheme(request)        
        
        decoded_token = await decode_access_token(raw_token) if raw_token else None        
        
        # 1) resolve tenant
        tenant_id_from_token = decoded_token.tenant_id if decoded_token else None        
        tenant = await resolve_tenant(request, tenant_id_from_token)

        # 2) resolve user using JWT
        user_id = decoded_token.sub if decoded_token else None        
        
        ctx = RequestContext(
            tenant_id=tenant.id,
            tenant_slug=tenant.slug,
            tenant_name=tenant.name,
            tenant_permissions=_permissions_dict_from_list(tenant.role_permissions),            
            cell=get_cell(tenant.cell_id),
            user_id=user_id,
            user_roles=[]
        )
        
        # 3) if user is present, get user roles
        if user_id:
            ctx.user_roles = await get_user_roles(user_id, get_user_repo(ctx))

        request.state.ctx = ctx

    except HTTPException as e:
        # no tenant, bad token, etc.
        return JSONResponse(content=e.detail, status_code=e.status_code)

    # 3) proceed with the request
    response = await call_next(request)
    return response

def _permissions_dict_from_list(permissions_list: List[TenantRolePermissions]):
    permissions_dict = {}
    for perm in permissions_list:
        permissions_dict[perm.role] = perm.permissions
    return permissions_dict