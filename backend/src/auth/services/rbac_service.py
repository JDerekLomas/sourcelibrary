from fastapi import Depends, HTTPException, status

from core.dependency import get_request_context, RequestContext
from core.models.primitives_model import ResourceType, ActionType
from core.security import oauth2_scheme

def need_permission(resource_type: ResourceType, action_type: ActionType):
    def dependency( token: str = Depends(oauth2_scheme),
                   ctx: RequestContext = Depends(get_request_context)
    ):
        if not ctx:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request context not initialized."
            )
        
        tenant_role_permissions = ctx.tenant_permissions
        if not tenant_role_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant has not set permissions for each role."
            )
        
        if not ctx.user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no roles assigned."
            )
        
        allowed = any(
            action_type in ctx.tenant_permissions.get(role, {}).get(resource_type, set())
            for role in ctx.user_roles
        )        

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )
        
    return dependency