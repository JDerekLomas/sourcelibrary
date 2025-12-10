from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId
from enum import Enum
from core.models.primitives_model import ResourceType, ActionType
from datetime import datetime, timezone

class PolicyEffect(str, Enum):
    """ Represents the effect of a policy rule.    
    """
    ALLOW = "allow"
    DENY = "deny"

class PolicyTarget(BaseModel):
    """ Represents the target of a policy rule.
    Attributes:
        resource: List of resources the policy applies to.
        action: List of actions that the policy applies to.
    """
    resource: List[ResourceType]
    action: List[ActionType]

class PolicyCondition(BaseModel):
    # Example CEL-like: "subject.roles.contains('admin') or resource.visibility == 'public'"
    expr: str

class Policy(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    tenant_id: str
    name: str
    description: Optional[str] = None
    priority: int = 100     # lower runs first
    effect: PolicyEffect = PolicyEffect.ALLOW
    target: PolicyTarget
    condition: PolicyCondition
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))