from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated, List
from motor.motor_asyncio import AsyncIOMotorCollection

from tenant.tenant_repo import get_tenant_repo
from book.book_repo import BookRepo, get_books_repo
from page.page_repo import PageRepo, get_pages_repo
from core.dependency import s3_service_dependency, request_context_dependency

from tenant.models.tenant_model import Tenant, TenantBranding
from core.models.primitives_model import RoleName
from tenant.models.tenant_crud_models import TenantCreate, TenantUpdate, TenantSettings, TenantSummary

from auth.services.rbac_service import need_permission, ResourceType, ActionType
from tenant.services.tenant_service import (
    get_tenant_service,
    get_all_tenants_service,
    create_tenant_service,
    update_tenant_service,
    delete_tenant_and_collection_service,
    get_tenant_branding_service,
    update_tenant_settings_service,
    get_tenant_settings_service
)

router = APIRouter()

tenant_repo_dep = Annotated[AsyncIOMotorCollection, Depends(get_tenant_repo)]

@router.get("/validate")
async def validate_tenant(tenant_repo: tenant_repo_dep,
                          req_ctx: request_context_dependency
                        ) -> TenantBranding:
    """Endpoint to validate tenant existence.
    Simply calling this means middleware automtically checks for tenant validity.
    """    
    # Middleware already validates the tenant; if we reach here, it's valid
    return await get_tenant_branding_service(req_ctx.tenant_id, tenant_repo)    


@router.get("/settings", dependencies=[Depends(need_permission(ResourceType.USER, ActionType.DELETE))])
async def get_tenant_settings(req_ctx: request_context_dependency,
                              tenant_repo: tenant_repo_dep
                            ) -> TenantSettings:
    return await get_tenant_settings_service(tenant_id=req_ctx.tenant_id,
                                             tenant_repo=tenant_repo
                                            )


@router.patch("/settings", dependencies=[Depends(need_permission(ResourceType.USER, ActionType.DELETE))])
async def update_tenant_settings(data: TenantSettings,
                                 req_ctx: request_context_dependency,
                                 repo: tenant_repo_dep
                            ) -> TenantSettings:
    
    return await update_tenant_settings_service(tenant_id_from_req=req_ctx.tenant_id,
                                                data=data,
                                                tenant_repo=repo
                                            )

# CRUD operations
@router.get("/", dependencies=[Depends(need_permission(ResourceType.TENANT, ActionType.READ))])
async def get_all_tenants(repo: tenant_repo_dep) -> List[TenantSummary]:    
    return await get_all_tenants_service(repo)


@router.post("/", dependencies=[Depends(need_permission(ResourceType.TENANT, ActionType.CREATE))])
async def create_tenant(data: TenantCreate, repo: tenant_repo_dep) -> Tenant:
    return await create_tenant_service(data, repo)


@router.get("/{tenant_id}", dependencies=[Depends(need_permission(ResourceType.TENANT, ActionType.READ))])
async def get_tenant(tenant_id: str, repo: tenant_repo_dep) -> Tenant:
    return await get_tenant_service(tenant_id, repo)


@router.patch("/{tenant_id}", dependencies=[Depends(need_permission(ResourceType.TENANT, ActionType.UPDATE))])
async def update_tenant(data: TenantUpdate,
                        tenant_repo: tenant_repo_dep,
                        req_ctx: request_context_dependency
                    ) -> Tenant:
    if RoleName.SUPERADMIN not in req_ctx.user_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions to update tenant")
    
    return await update_tenant_service(data, tenant_repo)


@router.delete("/{tenant_id}", dependencies=[Depends(need_permission(ResourceType.TENANT, ActionType.DELETE))])
async def delete_tenant(tenant_id: str,
                        expected_tenant_name: str,
                        tenant_repo: tenant_repo_dep,
                        s3: s3_service_dependency,
                        book_repo: BookRepo = Depends(get_books_repo),
                        page_repo: PageRepo = Depends(get_pages_repo),
                       ) -> str:
    await delete_tenant_and_collection_service(
        tenant_id=tenant_id,
        expected_tenant_name=expected_tenant_name,
        tenant_repo=tenant_repo,
        book_repo=book_repo,
        page_repo=page_repo,
        s3=s3
    )

    return f"Tenant {tenant_id} and its collections have been deleted successfully."