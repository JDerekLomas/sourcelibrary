from pydantic import BaseModel, Field, HttpUrl, ConfigDict, field_serializer
from typing import Optional, List, Dict
from bson import ObjectId
from datetime import datetime, timezone

from core.models.primitives_model import EntityStatus, PlanName, RoleName, ResourceType, ActionType
from cell.models.cell_registry import CellID

class TenantBranding(BaseModel):
    """ Settings specific to a tenant.
    
    Attributes:
        logo_url: URL to the tenant's logo image.
        header_video_url: URL to the tenant's header video.
        heading_text: Heading text for the tenant's branding.
        subheading_text: Subheading text for the tenant's branding.
        primary_hex_color: Primary color hex code for the tenant's branding.    
    """    
    logo_url: Optional[HttpUrl] = None
    header_video_url: Optional[HttpUrl] = None
    heading_text: Optional[str] = None
    subheading_text: Optional[str] = None
    primary_hex_color: Optional[str] = None  # Hex color code

    @field_serializer("logo_url")
    def serialize_url(self, logo_url: Optional[HttpUrl]) -> Optional[str]:
        return str(logo_url) if logo_url else None        

class TenantRolePermissions(BaseModel):
    """ Permissions associated with a tenant role.
    
    Attributes:
        role: The role name (e.g., admin, editor).
        resource: The type of resource the permissions apply to. (Tenant, User, Book, Page, etc.)
        allowed_actions: List of actions the role is permitted to perform on the resource. (CRUD, manage, etc.)
    """
    role: RoleName
    permissions: Dict[ResourceType, List[ActionType]]

class Tenant(BaseModel):
    """ Represents a tenant in a multi-tenant system.
    
    Attributes:
        id: Unique identifier for the tenant used as primary key.
        external_sys_id: Optional external identifiezr to link to an external system like Memorix.
        name: Name of the tenant.
        slug: URL-friendly identifier for the tenant.
        domains: List of domains associated with the tenant.
        cell_id: Identifier for the cell (infrastructure unit) the tenant belongs to.
        status: Current status of the tenant (e.g., active, inactive).
        plan: Subscription plan of the tenant (e.g., basic, premium).
        auth_config: Configuration for tenant authentication.
        branding_config: Settings specific to the tenant's branding.
    """
    model_config = ConfigDict(use_enum_values=True)

    id: str = Field(default_factory=lambda: str(ObjectId()))
    external_sys_id: Optional[str] = None # Eg, Memorix identifier
    name: str # Eg, "Ritman Library"
    slug: str # Eg, "rit"    
    cell_id: CellID = CellID.CELL_DEFAULT
    status: EntityStatus = EntityStatus.ACTIVE
    plan: PlanName = PlanName.BASIC
    branding_config: TenantBranding = Field(default_factory=TenantBranding)
    role_permissions: List[TenantRolePermissions] = Field(default_factory=lambda: Tenant.create_default_permissions())
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @classmethod
    def create_default_permissions(cls) -> List[TenantRolePermissions]:
        """ Create default role permissions for a new tenant. """
        return [
            TenantRolePermissions(
                role=RoleName.ADMIN,
                permissions={                    
                    ResourceType.BOOK: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
                    ResourceType.PAGE: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
                    ResourceType.USER: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
                    ResourceType.REQUEST: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],   
                    ResourceType.CATEGORY: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE]
                }
            ),
            TenantRolePermissions(
                role=RoleName.EDITOR,
                permissions={
                    ResourceType.BOOK: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
                    ResourceType.PAGE: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
                    ResourceType.REQUEST: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],   
                    ResourceType.CATEGORY: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE]
                }
            ),
            TenantRolePermissions(
                role=RoleName.USER,
                permissions={
                    ResourceType.BOOK: [ActionType.READ],
                    ResourceType.PAGE: [ActionType.READ, ActionType.UPDATE],
                    ResourceType.REQUEST: [ActionType.CREATE, ActionType.READ],   
                    ResourceType.CATEGORY: [ActionType.READ]
                }
            ),
            TenantRolePermissions(
                role=RoleName.GUEST,
                permissions={
                    ResourceType.BOOK: [ActionType.READ],
                    ResourceType.PAGE: [ActionType.READ],
                    ResourceType.CATEGORY: [ActionType.READ]
                }
            )
        ]