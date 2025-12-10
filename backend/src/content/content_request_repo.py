from core.base_repo import BaseRepo
from core.dependency import request_context_dependency
from core.models.req_context_model import RequestContext

class EditRequestRepo(BaseRepo):
    def __init__(self, ctx: RequestContext):
        super().__init__("requests", ctx)    
    # Add content request-specific repository methods here if needed

def get_edit_request_repo(request_ctx: request_context_dependency) -> EditRequestRepo:
    return EditRequestRepo(ctx=request_ctx)