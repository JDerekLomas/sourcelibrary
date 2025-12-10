from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError, PyMongoError

from user.user_repo import UserRepo
from user.models.user_model import User, UserCreate, EntityStatus, Identity, IdentityProvider

from auth.services.hasher import hash_password

async def register_user(
        registerRequest: UserCreate,
        tenant_id: str,
        user_repo: UserRepo) -> User:
    
    if user_repo is None:
        raise HTTPException(status_code=500, detail="Database connection error")    

    query = {"username": registerRequest.username}
    users_count = await user_repo.count_documents(query)
    if users_count > 0:        
        raise HTTPException(status_code=400, detail="Username taken!")
        
    hashed_pw = hash_password(registerRequest.password)

    user = User(
        tenant_id=tenant_id,
        email=registerRequest.email,
        username = registerRequest.username,
        password_hash = hashed_pw,
        display_name = registerRequest.display_name,
        status = EntityStatus.ACTIVE,
        roles = registerRequest.roles,
    )
    user.identities=[Identity(provider=IdentityProvider.USERNAME, subject=user.id)]

    try:
        await user_repo.insert_one(user.model_dump())
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Duplicate entry found!")
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail="Database error: " + str(e))
    
    return user