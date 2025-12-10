from pydantic import BaseModel
from typing import List, Optional

from cell.models.cell_registry import CellID
from core.models.primitives_model import EntityStatus
from tenant.models.tenant_model import TenantBranding, PlanName, TenantRolePermissions

class TenantSummary(BaseModel):
    """ Summary model for tenant listing.
    
    Attributes:
        id: Unique identifier for the tenant used as primary key.
        name: Name of the tenant.
        slug: URL-friendly identifier for the tenant.
        status: Current status of the tenant (e.g., active, inactive).
        plan: Subscription plan of the tenant (e.g., basic, premium).
    """
    id: str
    name: str
    slug: str
    status: EntityStatus
    plan: PlanName

class TenantCreate(BaseModel):
    """ Model for creating a new tenant.
    
    Attributes:
        name: Name of the tenant.
        slug: URL-friendly identifier for the tenant.
        external_sys_id: Optional external identifier to link to an external system like Memorix.
        auth_config: Optional authentication configuration for the tenant.
        branding_config: Optional branding settings for the tenant.
        roles_permissions: Optional list of role permissions for the tenant.
    """
    name: str
    slug: str
    cell_id: CellID
    plan: PlanName
    branding_config: Optional[TenantBranding] = None

class TenantUpdate(BaseModel):
    """ Model for updating an existing tenant by SUPERADMIN users.
    
    Attributes:
        name: Optional new name for the tenant.
        slug: Optional new URL-friendly identifier for the tenant.
        auth_config: Optional new authentication configuration for the tenant.
        branding: Optional new branding settings for the tenant.
        roles_permissions: Optional new list of role permissions for the tenant.
    """
    tenant_id: str
    name: Optional[str] = None
    slug: Optional[str] = None
    cell_id: Optional[CellID] = None
    status: Optional[EntityStatus] = None
    plan: Optional[PlanName] = None

class TenantSettings(BaseModel):
    """ Model for updating an existing tenant with admin rights.
    
    Attributes:
        All attributes from TenantUpdate.
        role_permissions: Optional new list of role permissions for the tenant.
    """
    tenant_id: str
    branding_config: Optional[TenantBranding] = None
    role_permissions: Optional[List[TenantRolePermissions]] = None
