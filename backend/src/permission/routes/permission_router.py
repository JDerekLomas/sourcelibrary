from fastapi import APIRouter, Depends
from typing import Dict, List

from core.models.primitives_model import ResourceType, ActionType

from core.security import oauth2_scheme
from core.dependency import request_context_dependency
from user.user_repo import get_user_repo
from tenant.tenant_repo import get_tenant_repo

from permission.services.permission_service import get_current_user_permissions

router = APIRouter()

@router.get("/me")
async def get_my_permissions(req_ctx: request_context_dependency,
                             token: str = Depends(oauth2_scheme),
                             user_repo = Depends(get_user_repo),
                             tenant_repo = Depends(get_tenant_repo)
                            ) -> Dict[ResourceType, List[ActionType]]:
    return await get_current_user_permissions(tenant_id=req_ctx.tenant_id,
                                              token=token,
                                              user_repo=user_repo,
                                              tenant_repo=tenant_repo
                                            )