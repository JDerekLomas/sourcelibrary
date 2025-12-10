from fastapi import APIRouter, File, UploadFile, Form, Depends
from typing import Optional, Annotated

from page.models.page_model import Page

from book.book_repo import get_books_repo
from page.page_repo import PageRepo, get_pages_repo

from core.dependency import s3_service_dependency
from auth.services.rbac_service import need_permission, ResourceType, ActionType
from page.services.page_service import (
    create_page_service,
    get_page_service,
    update_page_service,
    delete_page_service,
    update_page_by_request_service,
    PageRequestUpdate
)

router = APIRouter()

page_repo_dep = Annotated[PageRepo, Depends(get_pages_repo)]

@router.post("/",
             response_model=Page,
             dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.CREATE))]
)
async def create_page(
    s3: s3_service_dependency,
    pages_repo: page_repo_dep,
    books_repo = Depends(get_books_repo),
    book_id: str = Form(...),
    page_number: int = Form(...),
    photo: UploadFile = File(...),
    ocr_language: str = Form(""),
    ocr_model: str = Form(""),
    ocr_data: str = Form(""),
    translation_language: str = Form(""),
    translation_model: str = Form(""),
    translation_data: str = Form(""),
    tenant_name: Optional[str] = Form(None),
    tenant_external_id: Optional[str] = Form(None)
):
    return await create_page_service(
        books_repo=books_repo,
        pages_repo=pages_repo,
        s3=s3,
        book_id=book_id,
        page_number=page_number,
        photo=photo,
        ocr_language=ocr_language,
        ocr_model=ocr_model,
        ocr_data=ocr_data,
        translation_language=translation_language,
        translation_model=translation_model,
        translation_data=translation_data,
        tenant_name=tenant_name,
        tenant_external_id=tenant_external_id
    )


@router.get("/{page_id}", response_model=Page)
async def get_page(page_id: str, pages_repo: page_repo_dep, s3: s3_service_dependency) -> Page:    
    return await get_page_service(page_id=page_id, pages_repo=pages_repo, s3=s3)


@router.put("/{page_id}",
            response_model=Page,
            dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.UPDATE))]
)
async def update_page(
    pages_repo: page_repo_dep,
    s3: s3_service_dependency,
    page_id: str,
    page_number: Optional[int] = Form(None),
    photo: Optional[UploadFile] = File(None),
    ocr_language: Optional[str] = Form(None),
    ocr_model: Optional[str] = Form(None),
    ocr_data: Optional[str] = Form(None),
    translation_language: Optional[str] = Form(None),
    translation_model: Optional[str] = Form(None),
    translation_data: Optional[str] = Form(None)
) -> Page:
    return await update_page_service(
        pages_repo=pages_repo,
        s3=s3,
        page_id=page_id,
        page_number=page_number,
        photo=photo,
        ocr_language=ocr_language,
        ocr_model=ocr_model,
        ocr_data=ocr_data,
        translation_language=translation_language,
        translation_model=translation_model,
        translation_data=translation_data
    )


@router.delete("/{page_id}",
               dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.DELETE))]
)
async def delete_page(page_id: str, pages_repo: page_repo_dep, s3: s3_service_dependency) -> dict:
    return await delete_page_service(page_id=page_id, pages_repo=pages_repo, s3=s3)


@router.put("/request/{page_id}",
            response_model=Page,
            dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.UPDATE))]
)
async def update_page_by_request(page_id: str,
                                 data: PageRequestUpdate,
                                 pages_repo: page_repo_dep
) -> Page:
    return await update_page_by_request_service(page_id=page_id,
                                                data=data,
                                                pages_repo=pages_repo
                                            )