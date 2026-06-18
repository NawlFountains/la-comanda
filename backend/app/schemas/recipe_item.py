from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID

class RecipeItemCreate(BaseModel):
    item_id: UUID
    quantity: Decimal 
    unit: str 

class RecipeItemUpdate(BaseModel):
    quantity: Decimal | None = None
    unit: str | None = None

class RecipeItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    item_id: UUID
    quantity: Decimal
    unit: str

    model_config = {"from_attributes": True}
