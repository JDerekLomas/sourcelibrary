from core.base_repo import BaseRepo
from core.dependency import request_context_dependency
from core.models.req_context_model import RequestContext

class UserRepo(BaseRepo):
    def __init__(self, ctx: RequestContext):
        super().__init__("users", ctx)    
    # Add user-specific repository methods here if needed

def get_user_repo(request_ctx: request_context_dependency) -> UserRepo:
    return UserRepo(ctx=request_ctx)