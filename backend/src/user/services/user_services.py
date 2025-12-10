from fastapi import HTTPException
from typing import List
from async_lru import alru_cache
from datetime import datetime, timezone

from user.user_repo import UserRepo

from user.models.user_model import User, UserSummary, UserUpdate
from core.models.primitives_model import RoleName

async def get_user_by_username(username: str, user_repo: UserRepo) -> User:
    query = {"username": username} # Finds by username (tenant scoped)
    user = await user_repo.find_one(query)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found!")
    return User(**user)


async def get_user_by_id(user_id: str, user_repo: UserRepo) -> User:
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    query: dict = {"id": user_id}
    user = await user_repo.find_one(query)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found!")
    return User(**user)


@alru_cache()
async def get_user_roles(user_id: str, user_repo: UserRepo) -> List[RoleName]:
    user_doc = await user_repo.find_one({"id": user_id}, projection={"roles": 1})
    if user_doc is None:
        raise HTTPException(status_code=404, detail="User not found!")
    return user_doc.get("roles", [])


async def get_users_summary(user_repo: UserRepo) -> List[UserSummary]:
    users: List[UserSummary] = []
    async for user_doc in user_repo.find({}):
        users.append(UserSummary(**user_doc))
    return users

async def update_user_info(user_id: str, updateData: UserUpdate, user_repo: UserRepo) -> UserUpdate:
    update_data = updateData.model_dump(exclude_none=True, exclude_unset=True, exclude={"tenant_id"})
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")

    # Add a check if user role is removing Admin role and ensure at least one admin remains
    if "roles" in update_data:
        user_doc = await user_repo.find_one({"id": user_id})
        if user_doc is None:
            raise HTTPException(status_code=404, detail="User not found!")
        
        user = User(**user_doc)
        if RoleName.ADMIN in user.roles and RoleName.ADMIN not in update_data["roles"]:
            tenant_id = user.tenant_id
            admin_count = await user_repo.count_documents({"tenant_id": tenant_id, "roles": RoleName.ADMIN})
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot remove the only admin user role in the tenant.")

    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await user_repo.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found!")
    
    updated_doc = await user_repo.find_one({"id": user_id})
    if updated_doc is None:
        raise HTTPException(status_code=404, detail="User not found after update!")
     
    return UserUpdate(**updated_doc)

async def delete_user_by_id(user_id: str, user_repo: UserRepo) -> None:    
    user_doc = await user_repo.find_one({"id": user_id})
    if user_doc is None:
        raise HTTPException(status_code=404, detail="User not found!")
    
    user = User(**user_doc)
    if set(user.roles) & {RoleName.ADMIN, RoleName.SUPERADMIN}:    
        tenant_id = user.tenant_id
        admin_count = await user_repo.count_documents({"tenant_id": tenant_id, "roles": RoleName.ADMIN})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the only admin user in the tenant.")
        
    await user_repo.delete_one({"id": user_id})