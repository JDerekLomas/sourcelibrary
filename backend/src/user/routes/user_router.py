from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

from core.dependency import request_context_dependency

from core.security import oauth2_scheme
from auth.services.auth_services import get_current_active_user
from auth.services.rbac_service import need_permission, ResourceType, ActionType

from user.models.user_model import UserBase, UserUpdate, UserSummary
from user.user_repo import get_user_repo, UserRepo
from user.services.user_services import get_users_summary, delete_user_by_id, update_user_info

router = APIRouter()

user_repo_dep = Annotated[UserRepo, Depends(get_user_repo)]

@router.get("/me", response_model=UserBase)
async def get_current_user(req_ctx: request_context_dependency, token: str = Depends(oauth2_scheme)) -> UserBase:
    user = await get_current_active_user(tenant_id=req_ctx.tenant_id, token=token, user_repo=req_ctx.db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required!")
    return user

@router.get("/all", dependencies=[Depends(need_permission(ResourceType.USER, ActionType.READ))])
async def get_all_users(user_repo: user_repo_dep) -> list[UserSummary]:
    return await get_users_summary(user_repo)

@router.patch("/{user_id}", dependencies=[Depends(need_permission(ResourceType.USER, ActionType.UPDATE))])
async def update_user(user_id: str, updateData: UserUpdate, user_repo: user_repo_dep)-> UserUpdate:
    return await update_user_info(user_id, updateData, user_repo)

@router.delete("/{user_id}", dependencies=[Depends(need_permission(ResourceType.USER, ActionType.DELETE))])
async def delete_user(user_id: str, user_repo: user_repo_dep) -> str:
    await delete_user_by_id(user_id, user_repo)    
    return "User deleted successfully."