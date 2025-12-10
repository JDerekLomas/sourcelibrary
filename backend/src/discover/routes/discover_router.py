from fastapi import APIRouter, Query, Depends
from discover.services.discover_pages_service import get_random_pages

from book.book_repo import BookRepo, get_books_repo
from page.page_repo import PageRepo, get_pages_repo

router = APIRouter()

@router.get("/random-pages")
async def random_pages(count: int = Query(4, ge=1, le=50),
                       books_repo: BookRepo = Depends(get_books_repo),
                       pages_repo: PageRepo = Depends(get_pages_repo)):
    return await get_random_pages(count=count,
                                  books_repo=books_repo,
                                  pages_repo=pages_repo)