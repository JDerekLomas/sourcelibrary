import os
from fastapi import HTTPException, status

from auth.services.hasher import verify_password
from auth.services.token_services import decode_access_token

from user.user_repo import UserRepo
from user.services.user_services import get_user_by_id, get_user_by_username
from user.models.user_model import User, IdentityProvider, EntityStatus

_credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def authenticate_user(username: str, password: str, user_repo: UserRepo) -> User:
    
    user = await get_user_by_username(username=username, user_repo=user_repo)

    if user.status != EntityStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Inactive user!")
    
    # TODO: Robust system to handle multiple identity providers
    # For now, only supported password-based username authentication    
    has_username_identity = any(
        (iden.provider == IdentityProvider.USERNAME) for iden in (user.identities or [])
    )

    if not (has_username_identity and user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    return user

async def get_current_user(tenant_id: str, token: str, user_repo: UserRepo) -> User:
    decoded_token = await decode_access_token(token)
    if not decoded_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
    if not decoded_token.sub:        
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing user ID")

    if not decoded_token.tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing tenant ID")
    
    if decoded_token.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tenant mismatch")

    try:
        user = await get_user_by_id(user_id=decoded_token.sub, user_repo=user_repo)
    except HTTPException:
        raise _credentials_exception
    
    return user

async def get_current_active_user(tenant_id: str, token: str, user_repo: UserRepo) -> User:
    current_user = await get_current_user(tenant_id=tenant_id, token=token, user_repo=user_repo)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found!")
    
    if current_user.status != EntityStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Inactive user!")
    
    return current_user    