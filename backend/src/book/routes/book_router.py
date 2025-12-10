from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends, BackgroundTasks
from typing import Optional, List, Annotated

from book.models.book_model import Book, DeleteBookRequest

from book.book_repo import BookRepo, get_books_repo
from page.page_repo import PageRepo, get_pages_repo
from core.dependency import s3_service_dependency

from auth.services.rbac_service import need_permission, ResourceType, ActionType
from book.services.book_service import (
    create_book_service,
    get_book_service,
    update_book_service,
    delete_book_service,
    get_books_service,
    get_book_details_service,
    get_next_page_number_service
)

router = APIRouter()

book_repo_dep = Annotated[BookRepo, Depends(get_books_repo)]
page_repo_dep = Annotated[PageRepo, Depends(get_pages_repo)]

@router.post("/",
             response_model=Book,
             dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.CREATE))]
)
async def create_book(
    books_repo: book_repo_dep,
    background_tasks: BackgroundTasks,
    s3_service: s3_service_dependency,
    title: str = Form(...),
    author: str = Form(...),
    published: str = Form(...),
    language: str = Form(...),
    thumbnail: UploadFile = File(default=None),
    tenant_name: Optional[str] = Form(None),
    tenant_external_id: Optional[str] = Form(None),
) -> Book:
    try:
        return await create_book_service(title=title,
                                         author=author,
                                         published=published,
                                         language=language,
                                         thumbnail=thumbnail,
                                         tenant_name=tenant_name,
                                         tenant_external_id=tenant_external_id,
                                         bg_tasks=background_tasks,
                                         books_repo=books_repo,
                                         s3=s3_service
                                        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{book_id}", response_model=Book)
async def get_book(book_id: str,
                   books_repo: book_repo_dep,
                   pages_repo: page_repo_dep
) -> Book:
    return await get_book_service(book_id=book_id,
                                  books_repo=books_repo,
                                  pages_repo=pages_repo
                                )


@router.put("/{book_id}",
            response_model=Book,
            dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.UPDATE))]
)
async def update_book(
    books_repo: book_repo_dep,
    pages_repo: page_repo_dep,
    s3_service: s3_service_dependency,
    background_tasks: BackgroundTasks,
    book_id: str,
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    published: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    thumbnail: UploadFile = File(default=None),
) -> Book:
    return await update_book_service(book_id=book_id,
                                     title=title,
                                     author=author,
                                     published=published,
                                     language=language,
                                     thumbnail=thumbnail,
                                     bg_tasks=background_tasks,
                                     books_repo=books_repo,
                                     pages_repo=pages_repo,
                                     s3=s3_service
                                    )


@router.delete("/{book_id}",
               dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.DELETE))]
)
async def delete_book(book_id: str,
                      request: DeleteBookRequest,
                      books_repo: book_repo_dep,
                      page_repo: page_repo_dep,
                      s3_service: s3_service_dependency
) -> dict:
    return await delete_book_service(book_id=book_id,
                                     password=request.password,
                                     books_repo=books_repo,
                                     pages_repo=page_repo,
                                     s3=s3_service
                                    )


@router.get("/", response_model=List[Book])
async def get_books(books_repo: book_repo_dep, pages_repo: page_repo_dep) -> List[Book]:
    return await get_books_service(books_repo=books_repo, pages_repo=pages_repo)


@router.get("/details/{book_id}", description="Get book data along with pages data.")
async def get_book_details(book_id: str,
                           books_repo: book_repo_dep,
                           pages_repo: page_repo_dep,
                           s3_service: s3_service_dependency
) -> dict:
    return await get_book_details_service(book_id=book_id,
                                          books_repo=books_repo,
                                          pages_repo=pages_repo,
                                          s3=s3_service
                                        )

@router.get("/{book_id}/next-page-number")
async def get_next_page_number(book_id: str, 
                               books_repo: book_repo_dep,
                               pages_repo: page_repo_dep
) -> dict:
    return await get_next_page_number_service(book_id=book_id,
                                              books_repo=books_repo,
                                              pages_repo=pages_repo
                                            )