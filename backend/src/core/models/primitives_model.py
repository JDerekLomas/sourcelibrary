from enum import StrEnum

class PlanName(StrEnum):    
    ROOT = "root"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

class EntityStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"

class RoleName(StrEnum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    EDITOR = "editor"
    USER = "user"
    GUEST = "guest"

class ResourceType(StrEnum):
    TENANT = "tenant"
    USER = "user"
    BOOK = "book"
    PAGE = "page"
    REQUEST = "request"
    CATEGORY = "category"

class ActionType(StrEnum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"

class IdentityProvider(StrEnum):
    USERNAME = "username"
    GOOGLE = "google"
    SAML = "saml"
    AZUREAD = "azuread"
    FACEBOOK = "facebook"
    GITHUB = "github"