from typing import Dict, Set, List
from motor.motor_asyncio import AsyncIOMotorCollection

from user.user_repo import UserRepo

from auth.services.auth_services import get_current_active_user
from tenant.services.tenant_service import get_tenant_service

from core.models.primitives_model import RoleName, ResourceType, ActionType
from tenant.models.tenant_model import TenantRolePermissions
from user.models.user_model import User

async def get_current_user_permissions(tenant_id: str,
                                       token: str,
                                       user_repo: UserRepo,
                                       tenant_repo: AsyncIOMotorCollection
                                    ) -> Dict[ResourceType, List[ActionType]]:    
    roles = [RoleName.GUEST]
    
    # Get current_user if token present
    if token:
        user: User = await get_current_active_user(tenant_id, token, user_repo)
        if user:
            roles = user.roles        
    
    # Get tenant
    tenant = await get_tenant_service(tenant_id, tenant_repo)
    tenant_permissions: List[TenantRolePermissions] = tenant.role_permissions if tenant else []

    # Build lookup map: RoleName -> permission object (converted to enums)
    permissions_map: Dict[RoleName, Dict[ResourceType, Set[ActionType]]] = {}
    for rp in tenant_permissions:
        try:
            role_enum = RoleName(rp.role)
            permissions_map[role_enum] = {
                ResourceType(resource): {ActionType(action) for action in actions}
                for resource, actions in rp.permissions.items()
            }
        except ValueError:
            # Skip invalid roles or permissions
            continue

    # Effective permissions (using sets to avoid duplicates)
    effective: Dict[ResourceType, Set[ActionType]] = {}

    for role in roles:
        role_permissions = permissions_map.get(role)
        if not role_permissions:
            # Unknown roles are ignored
            continue

        for resource, actions in role_permissions.items():
            if resource not in effective:
                effective[resource] = set()
            effective[resource].update(actions)
        
    return {resource: sorted(actions, key=lambda x: x.value) for resource, actions in effective.items()}
