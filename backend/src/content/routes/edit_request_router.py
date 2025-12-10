from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Annotated
from datetime import datetime, timezone
import uuid

from book.book_repo import BookRepo, get_books_repo
from page.page_repo import PageRepo, get_pages_repo
from content.content_request_repo import EditRequestRepo, get_edit_request_repo

from content.models.edit_request_model import EditRequest, RequestUpdate
from auth.services.rbac_service import need_permission, ResourceType, ActionType

router = APIRouter()

book_repo_dep = Annotated[BookRepo, Depends(get_books_repo)]
page_repo_dep = Annotated[PageRepo, Depends(get_pages_repo)]
edit_request_repo_dep = Annotated[EditRequestRepo, Depends(get_edit_request_repo)]

@router.post("/",
             response_model=EditRequest,
             dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.UPDATE))]
)
async def create_request(request: EditRequest,
                         book_repo: book_repo_dep,
                         page_repo: page_repo_dep,
                         edit_request_repo: edit_request_repo_dep
) -> EditRequest:
    # Check if book exists
    book = await book_repo.find_one({"id": request.book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if page exists
    page = await page_repo.find_one({"id": request.page_id, "book_id": request.book_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found for this book")
    
    # (Other checks can be added here)
    request.id = str(uuid.uuid4())
    request.created_at = datetime.now(timezone.utc)
    request.updated_at = datetime.now(timezone.utc)
    await edit_request_repo.insert_one(request.model_dump())
    
    return request


@router.get("/",
            response_model=List[EditRequest],
            dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.CREATE))]
)
async def get_all_requests(edit_request_repo: edit_request_repo_dep) -> List[EditRequest]:
    pipeline = [
        {
            "$lookup": {
                "from": "books",
                "localField": "book_id",
                "foreignField": "id",
                "as": "book_info"
            }
        },
        {
            "$lookup": {
                "from": "pages",
                "localField": "page_id",
                "foreignField": "id",
                "as": "page_info"
            }
        },
        {
            "$addFields": {
                "book_title": { "$arrayElemAt": ["$book_info.title", 0] },
                "page_number": { "$arrayElemAt": ["$page_info.page_number", 0] }
            }
        },
        {
            "$project": {
                "book_info": 0,
                "page_info": 0
            }
        }
    ]
    cursor = await edit_request_repo.aggregate(pipeline)
    requests = await cursor.to_list(None)
    return [EditRequest(**req) for req in requests]


@router.put("/{request_id}",
            response_model=EditRequest,
            dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.UPDATE))]
)
async def update_request(request_id: str,
                         update: RequestUpdate,
                         edit_request_repo: edit_request_repo_dep
) -> EditRequest:
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update fields provided")
    result = await edit_request_repo.update_one({"id": request_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    updated = await edit_request_repo.find_one({"id": request_id})
    if not updated:
        raise HTTPException(status_code=404, detail="Request not found after update")
    return EditRequest(**updated)


@router.delete("/{request_id}",
               status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(need_permission(ResourceType.PAGE, ActionType.DELETE))]
)
async def delete_request(request_id: str, edit_request_repo: edit_request_repo_dep) -> None:
    result = await edit_request_repo.delete_one({"id": request_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return None 