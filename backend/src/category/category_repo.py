from fastapi import Depends
from typing import Annotated

from core.base_repo import BaseRepo
from core.dependency import request_context_dependency
from core.models.req_context_model import RequestContext

class CategoryRepo(BaseRepo):
    def __init__(self, ctx: RequestContext):
        super().__init__("categories", ctx)
    # Add category-specific DB methods here

def get_category_repo(ctx: request_context_dependency) -> CategoryRepo:
    return CategoryRepo(ctx)