from fastapi import HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timezone

from page.page_repo import PageRepo
from book.book_repo import BookRepo
from cell.services.s3_service import S3Service

from tenant.models.tenant_model import Tenant, PlanName
from tenant.models.tenant_crud_models import (
    TenantCreate,
    TenantUpdate,
    TenantSettings,
    TenantBranding,
    TenantSummary
)

async def get_tenant_service(tenant_id: str, tenant_repo: AsyncIOMotorCollection) -> Tenant:
    tenant = await tenant_repo.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return Tenant(**tenant)

async def get_all_tenants_service(tenant_repo: AsyncIOMotorCollection) -> List[TenantSummary]:
    cursor = tenant_repo.find({"slug": {"$ne": "root"}}) # Exclude root tenant (ne = not equal)    
    tenants_data = await cursor.to_list(length=None)
    return [TenantSummary(**tenant) for tenant in tenants_data]

async def get_tenant_branding_service(tenant_id: str, tenant_repo: AsyncIOMotorCollection) -> TenantBranding:
    try:
        tenant = await tenant_repo.find_one({"id": tenant_id}) # Could be optimized with projection
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tenant branding.")
        
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    return Tenant(**tenant).branding_config

async def create_tenant_service(creation_data: TenantCreate, tenant_repo: AsyncIOMotorCollection) -> Tenant:
    slug = await tenant_repo.find_one({"slug": creation_data.slug})
    if slug:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Tenant with this slug already exists!")
    
    tenant_model = Tenant(**creation_data.model_dump())
    await tenant_repo.insert_one(tenant_model.model_dump())
    return tenant_model

async def delete_tenant_and_collection_service(tenant_id: str,
                                               expected_tenant_name: str,
                                               tenant_repo: AsyncIOMotorCollection,
                                               book_repo: BookRepo,
                                               page_repo: PageRepo,
                                               s3: S3Service
                                            ) -> None:
    """Deletes a tenant by its ID after verifying the expected tenant name.
    Also deletes all associated collections of books within the tenant's scope.
    """
    doc = await tenant_repo.find_one({"id": tenant_id}, projection={"name": 1, "plan": 1})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    
    # Verify tenant name matches
    if expected_tenant_name != doc.get("name"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Tenant name does not match the expected name")
    
    # Prevent deletion of root tenant
    if doc.get("plan") == PlanName.ROOT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Can't delete the root tenant using API.")
    
    await book_repo.delete_many({"tenant_id": tenant_id})
    await page_repo.delete_many({"tenant_id": tenant_id})
    await s3.delete_tenant_files(tenant_id=tenant_id)
    await tenant_repo.delete_one({"id": tenant_id})

async def update_tenant_service(data: TenantUpdate, 
                                tenant_repo: AsyncIOMotorCollection
                            ) -> Tenant:
    update_data = data.model_dump(exclude_none=True, exclude_unset=True, exclude={"tenant_id"})
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No valid fields provided for update")

    return await _update_tenant_service(data.tenant_id, update_data, tenant_repo)

async def update_tenant_settings_service(tenant_id_from_req: str,
                                         data: TenantSettings,
                                         tenant_repo: AsyncIOMotorCollection
                                        ) -> TenantSettings:
    if data.tenant_id != tenant_id_from_req:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Cannot customise settings for a different tenant")
    
    update_data = data.model_dump(exclude_none=True, exclude_unset=True, exclude={"tenant_id"})
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No valid fields provided for update")
    
    tenant = await _update_tenant_service(data.tenant_id, update_data, tenant_repo)
    
    return TenantSettings(
        tenant_id=tenant.id,
        branding_config=tenant.branding_config,
        role_permissions=tenant.role_permissions
    )

async def get_tenant_settings_service(tenant_id: str,
                                      tenant_repo: AsyncIOMotorCollection
                                    ) -> TenantSettings:
    branding_key: str = "branding_config"
    role_permissions_key: str = "role_permissions"

    tenant = await tenant_repo.find_one({"id": tenant_id},
                                        projection={branding_key: 1, role_permissions_key: 1}
                                    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    settings = TenantSettings(
        tenant_id=tenant_id,
        branding_config=tenant.get(branding_key),
        role_permissions=tenant.get(role_permissions_key)
    )
    return settings

async def _update_tenant_service(tenant_id: str,
                                 update_data: dict,
                                 tenant_repo: AsyncIOMotorCollection
                                 ) -> Tenant:
    # Updating the updated_at timestamp before saving
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await tenant_repo.update_one({"id": tenant_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    updated_tenant = await tenant_repo.find_one({"id": tenant_id})
    if not updated_tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    
    return Tenant(**updated_tenant)