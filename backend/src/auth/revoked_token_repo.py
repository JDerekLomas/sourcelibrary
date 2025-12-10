from core.base_repo import BaseRepo
from core.dependency import request_context_dependency
from core.models.req_context_model import RequestContext

class RevokedTokenRepo(BaseRepo):
    def __init__(self, ctx: RequestContext):
        super().__init__("revoked_tokens", ctx)    
    # Add revoked token repository methods here if needed

def get_revoked_token_repo(request_ctx: request_context_dependency) -> RevokedTokenRepo:
    return RevokedTokenRepo(ctx=request_ctx)