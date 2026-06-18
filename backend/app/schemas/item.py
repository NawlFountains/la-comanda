from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID

class ItemCreate(BaseModel):
    name: str
    unit: str
    current_stock: Decimal
    low_stock_threshold: Decimal
    notes: str | None = None

class ItemUpdate(BaseModel):
    name: str | None = None
    unit: str | None = None
    current_stock: Decimal | None = None
    low_stock_threshold: Decimal | None = None
    notes: str | None = None

class ItemResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    unit: str
    current_stock: Decimal
    low_stock_threshold: Decimal
    notes: str | None

    model_config = {"from_attributes": True}
