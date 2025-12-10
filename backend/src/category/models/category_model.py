from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    description: Optional[str] = ""


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""