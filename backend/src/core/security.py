from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login", # login route
    refreshUrl="/auth/refresh", # refresh route
    auto_error=False, # does not raise 401 automatically, NEED TO HANDLE MANUALLY 
)