from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

from core.models.primitives_model import RoleName, EntityStatus, IdentityProvider

class Identity(BaseModel):
    """ Represents an identity provider configuration.

    Attributes:
        provider: The identity provider type (e.g., "password", "google", "saml", "azuread").
        subject: The stable ID from that provider (for "password": user_id or username).
        issuer: Useful for OIDC/SAML multi-tenant IdPs.
        linked_at: Timestamp when the identity was linked.
        last_login_at: Timestamp of the last login using this identity.
    """
    provider: IdentityProvider # "username" | "google" | "saml" | "azuread" | ...
    subject: str # stable ID from that provider (for "username": username)
    issuer: Optional[str] = None # useful for OIDC/SAML multi-tenant IdPs
    linked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = None

class UserAttributes(BaseModel):
    """ Attributes for Attribute-Based Access Control (ABAC)."""
    department: Optional[str] = None    
    clearance_level: Optional[int] = None

class UserBase(BaseModel):
    """ Represents a user in the system.

    Attributes:
        id: Unique identifier for the user.
        tenant_id: ID of the tenant the user belongs to.
        email: Email address of the user.
        username: Username of the user.
        display_name: Optional display name for the user.
        status: Current status of the user (e.g., active, inactive, ...).
        roles: List of roles assigned to the user (RBAC).
        attributes: Attributes for Attribute-Based Access Control (ABAC).
        identities: Identity provider configurations linked to the user.
        created_at: Timestamp when the user was created.
        updated_at: Timestamp when the user was last updated.
    """
    model_config = ConfigDict(use_enum_values=True)

    id: str = Field(default_factory=lambda: str(ObjectId()))
    tenant_id: str
    email: str
    username: str
    display_name: Optional[str] = None
    status: EntityStatus = EntityStatus.ACTIVE
    roles: List[RoleName] = Field(default_factory=lambda: [RoleName.GUEST]) # For RBAC (Role Based Access Control)
    attributes: Optional[UserAttributes] = Field(default_factory=UserAttributes) # For ABAC (Attribute Based Access Control)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(UserBase):    
    identities: Optional[List[Identity]] = None
    password_hash: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    username: str
    display_name: Optional[str] = None
    password: str
    roles: List[RoleName]

class UserUpdate(BaseModel):    
    status: Optional[EntityStatus] = None
    roles: Optional[List[RoleName]] = None

class UserSummary(BaseModel):
    """ Summary information about a user. """
    id: str
    username: str
    display_name: Optional[str] = None
    status: EntityStatus
    roles: List[RoleName]