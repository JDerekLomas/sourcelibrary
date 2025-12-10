from core.base_repo import BaseRepo
from core.dependency import request_context_dependency
from core.models.req_context_model import RequestContext

class PageRepo(BaseRepo):
    def __init__(self, ctx: RequestContext):
        super().__init__("pages", ctx)    
    # Add page-specific repository methods here if needed

def get_pages_repo(request_ctx: request_context_dependency) -> PageRepo:
    return PageRepo(ctx=request_ctx)