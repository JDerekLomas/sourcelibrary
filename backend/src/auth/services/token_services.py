import os
from fastapi import HTTPException, Request, status
from typing import Any, Dict
from datetime import datetime, timedelta, timezone
import jwt

from auth.models.auth_model import Token
from auth.models.jwt_model import AccessToken, RefreshToken, RevokedRefreshToken, TokenType
from auth.revoked_token_repo import RevokedTokenRepo

from user.user_repo import UserRepo
from user.services.user_services import get_user_by_id
from user.models.user_model import EntityStatus, User

JWT_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

async def _get_refresh_token_from_request(request: Request) -> RefreshToken:
    cookie = request.cookies
    if not cookie:
        raise HTTPException(status_code=401, detail="No cookies found in request")

    raw_token = cookie.get('refresh_token')
    if not raw_token:
        raise HTTPException(status_code=401, detail="No refresh token found.")

    decoded_token = await decode_refresh_token(raw_token)
    if not decoded_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if decoded_token.token_type != TokenType.REFRESH:
        raise HTTPException(status_code=401, detail="Invalid token type")

    return decoded_token


async def revoke_refresh_token(refresh_request: Request,
                               revoked_token_repo: RevokedTokenRepo,
                               expire_delta: timedelta) -> None:
    """ Revokes the refresh token present in the request cookies and adds to blocklist(DB).
    """
    refresh_token = await _get_refresh_token_from_request(refresh_request)

    revoked_token = RevokedRefreshToken(
        id=refresh_token.jit,
        expires_at=refresh_token.exp if refresh_token.exp else datetime.now(timezone.utc) + expire_delta
    )

    await revoked_token_repo.insert_one(revoked_token.model_dump())


def generate_token(token_type: TokenType,
                   tenant_name: str,
                   user: User,
                   expires_delta: timedelta) -> Token:
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user for token generation")

    claims = RefreshToken(
            token_type=TokenType.REFRESH,
            sub=user.id,
            tenant_id=user.tenant_id,
            exp=datetime.now(timezone.utc) + expires_delta
        )

    if token_type == TokenType.ACCESS:
        claims = AccessToken(
            **claims.model_dump(),            
            username=user.username,    
            tenant_name=tenant_name        
        )

    token = jwt.encode(claims.model_dump(), JWT_KEY, algorithm=JWT_ALGORITHM)

    return Token(access_token=token, token_type="bearer")


async def _decode_token(token: str) -> Dict[str, Any]:
    if not JWT_KEY or not JWT_ALGORITHM:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT configuration error")

    try:
        return jwt.decode(token, JWT_KEY, algorithms=[JWT_ALGORITHM])        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def decode_access_token(token: str) -> AccessToken | None:
    decoded_token = await _decode_token(token)
    return AccessToken(**decoded_token)


async def decode_refresh_token(token: str) -> RefreshToken | None:
    decoded_token = await _decode_token(token)
    return RefreshToken(**decoded_token)


async def refresh_access_token(refresh_request: Request,
                               tenant_name: str,
                               expires_delta: timedelta,
                               refresh_token_repo: RevokedTokenRepo,
                               user_repo: UserRepo
                               ) -> Token:

    refresh_token = await _get_refresh_token_from_request(refresh_request)

    # Validating if the refresh token is revoked (present in the blocklist collection)
    db_record = await refresh_token_repo.find_one({"id": refresh_token.jit})
    if db_record:
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")

    user = await get_user_by_id(user_id=refresh_token.sub, user_repo=user_repo)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.status != EntityStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Inactive user")

    new_access_token = generate_token(token_type=TokenType.ACCESS,
                                      tenant_name=tenant_name,
                                      user=user,
                                      expires_delta=expires_delta
                                    )
    return new_access_token