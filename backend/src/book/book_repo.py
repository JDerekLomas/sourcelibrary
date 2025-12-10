from core.base_repo import BaseRepo
from core.dependency import request_context_dependency
from core.models.req_context_model import RequestContext

class BookRepo(BaseRepo):
    def __init__(self, ctx: RequestContext):
        super().__init__("books", ctx)    
    # Add book-specific repository methods here if needed

def get_books_repo(request_ctx: request_context_dependency) -> BookRepo:
    return BookRepo(ctx=request_ctx)