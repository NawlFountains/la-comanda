from pydantic import BaseModel
from uuid import UUID
from app.schemas.price_history import PriceHistoryResponse
from app.schemas.recipe_item import RecipeItemResponse

class ProductCreate(BaseModel):
    name: str

class ProductUpdate(BaseModel):
    name: str | None = None

class ProductResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str

    model_config = {"from_attributes": True}

class ProductFullResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    latest_price: PriceHistoryResponse | None = None
    recipe_items: list[RecipeItemResponse] = []

    model_config = {"from_attributes": True}
