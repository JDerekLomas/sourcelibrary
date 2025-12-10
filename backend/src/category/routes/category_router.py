from fastapi import APIRouter, HTTPException, Depends
from typing import List, Annotated

from auth.services.rbac_service import need_permission, ResourceType, ActionType
from category.models.category_model import Category, CategoryCreate

from book.book_repo import BookRepo, get_books_repo
from category.category_repo import CategoryRepo, get_category_repo

router = APIRouter()

category_repo_dep = Annotated[CategoryRepo, Depends(get_category_repo)]
book_repo_dep = Annotated[BookRepo, Depends(get_books_repo)]

@router.get("/", response_model=List[Category])
async def get_categories(category_repo: category_repo_dep) -> List[Category]:
    categories = await category_repo.find({}).to_list(None)
    return [Category(**cat) for cat in categories if cat]


@router.get("/{category_id}", response_model=Category)
async def get_category(category_id: str, category_repo: category_repo_dep) -> Category:
    category = await category_repo.find_one({"id": category_id})
    if not category or not category.get("name"):
        raise HTTPException(status_code=404, detail="Category not found")
    return Category(**category)


@router.post("/",
             response_model=Category,
             dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.CREATE))]
)
async def create_category(category: CategoryCreate, category_repo: category_repo_dep) -> Category:
    cat = Category(
        name=category.name,
        description=category.description
    )
    await category_repo.insert_one(cat.model_dump())
    return cat


@router.put("/{category_id}",
            response_model=Category,
            dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.UPDATE))]
)
async def update_category(category_id: str,
                          category: CategoryCreate,
                          category_repo: category_repo_dep
) -> Category:
    update_data = category.model_dump()
    result = await category_repo.update_one({"id": category_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    updated = await category_repo.find_one({"id": category_id})
    if not updated or not updated.get("name"):
        raise HTTPException(status_code=404, detail="Category not found")
    return Category(**updated)


@router.delete("/{category_id}",
               dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.DELETE))]
)
async def delete_category(category_id: str,
                          category_repo: category_repo_dep,
                          books_repo: book_repo_dep
):
    result = await category_repo.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await books_repo.update_many({}, {"$pull": {"categories": category_id}})
    return {"message": "Category deleted"}


@router.post("/assign/{book_id}/{category_id}",
             dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.UPDATE))]
)
async def assign_category_to_book(book_id: str,
                                  category_id: str,
                                  books_repo: book_repo_dep,
                                  category_repo: category_repo_dep
):
    book = await books_repo.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    await books_repo.update_one({"id": book_id}, {"$addToSet": {"categories": category_id}})
    return {"message": "Category assigned to book"}


@router.post("/unassign/{book_id}/{category_id}",
             dependencies=[Depends(need_permission(ResourceType.BOOK, ActionType.UPDATE))]
)
async def unassign_category_from_book(book_id: str,
                                      category_id: str,
                                      books_repo: book_repo_dep
):
    book = await books_repo.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    await books_repo.update_one({"id": book_id}, {"$pull": {"categories": category_id}})
    return {"message": "Category unassigned from book"} 