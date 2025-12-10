from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from datetime import timedelta

from user.models.user_model import User, UserCreate, UserSummary
from auth.models.auth_model import Token
from core.models.primitives_model import ResourceType, ActionType

from user.user_repo import UserRepo, get_user_repo
from auth.revoked_token_repo import RevokedTokenRepo, get_revoked_token_repo

from core.dependency import request_context_dependency
from auth.services.rbac_service import need_permission
from auth.services.registration_service import register_user
from auth.services.auth_services import authenticate_user
from auth.services.token_services import (
    generate_token,
    refresh_access_token,
    revoke_refresh_token,
    TokenType
)

router=APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES:int = 15
REFRESH_TOKEN_EXPIRE_DAYS:int = 15
REFRESH_TOKEN_COOKIE_KEY:str = "refresh_token"

user_repo_dep = Annotated[UserRepo, Depends(get_user_repo)]
refresh_token_repo_dep = Annotated[RevokedTokenRepo, Depends(get_revoked_token_repo)]

@router.post("/register", dependencies=[Depends(need_permission(ResourceType.USER, ActionType.CREATE))])
async def user_registration(registerationRequest: UserCreate,
                            req_ctx: request_context_dependency,
                            user_repo: user_repo_dep
                           ) -> UserSummary:
    user: User = await register_user(registerRequest=registerationRequest,
                                     tenant_id=req_ctx.tenant_id,
                                     user_repo=user_repo
                                    )
    if not user:
        raise HTTPException(status_code=500, detail="User registration failed!")
    return UserSummary(**user.model_dump())


@router.post("/login")
async def user_login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],                     
                     user_repo: user_repo_dep,
                     req_ctx: request_context_dependency
                    ) -> JSONResponse:
    
    user_model = await authenticate_user(username=form_data.username,
                                         password=form_data.password,
                                         user_repo=user_repo)
    if not user_model:
        raise HTTPException(status_code=401, detail="Invalid username or password!")    
    
    tenant_name = req_ctx.tenant_name
    access_token = generate_token(TokenType.ACCESS, tenant_name, user_model, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = generate_token(TokenType.REFRESH, tenant_name, user_model, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    
    response = JSONResponse(content=access_token.model_dump())
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_KEY,
        value=refresh_token.access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # days into seconds
    )

    return response


@router.post("/logout")
async def user_logout(request: Request,
                      revoked_token_repo: refresh_token_repo_dep
                      ) -> JSONResponse:
    
    await revoke_refresh_token(refresh_request=request,
                               revoked_token_repo=revoked_token_repo,
                               expire_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key=REFRESH_TOKEN_COOKIE_KEY)
    
    return response


@router.post("/refresh")
async def refresh_token(request: Request,
                        user_repo: user_repo_dep,
                        refresh_token_repo: refresh_token_repo_dep,
                        req_ctx: request_context_dependency
                       ) -> JSONResponse:
    new_access_token: Token = await refresh_access_token(refresh_request=request,
                                                         tenant_name=req_ctx.tenant_name,
                                                         expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
                                                         refresh_token_repo=refresh_token_repo,
                                                         user_repo=user_repo
                                                        )
    return JSONResponse(content=new_access_token.model_dump())