from bson import ObjectId
from datetime import datetime, timezone
from enum import StrEnum
from pydantic import BaseModel, Field
from typing import List
from core.models.primitives_model import RoleName


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"

class RefreshToken(BaseModel):
    """ Represents the Refresh JWT claims.
    Attributes:
        jit: JWT ID.
        token_type: Type of the token (access or refresh).
        sub: Subject (user_id).
        tenant_id: ID of the tenant the user belongs to.
        iat: Issued at time (epoch time).
    """
    jit: str = Field(default_factory=lambda: str(ObjectId()))
    token_type: TokenType
    sub: str
    tenant_id: str
    iat: int = Field(default_factory=lambda: int(datetime.now(timezone.utc).timestamp()))  # Issued at time (epoch time)
    exp: datetime

class AccessToken(RefreshToken):
    username: str
    tenant_name: str

class RevokedRefreshToken(BaseModel):
    """ Represents a revoked refresh token record.
    Attributes:
        id: JWT ID.
        expires_at: datetime
    """
    id: str = Field(default_factory=lambda: str(ObjectId()))  
    expires_at: datetime    