from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID
from datetime import date

class RestockItemCreate(BaseModel):
    item_id: UUID
    quantity: Decimal

class RestockItemResponse(BaseModel):
    id: UUID
    restock_id: UUID
    item_id: UUID
    quantity: Decimal

    model_config = {"from_attributes": True}

class RestockCreate(BaseModel):
    restock_date: date
    supplier: str | None = None
    notes: str | None = None
    items: list[RestockItemCreate]

class RestockUpdate(BaseModel):
    restock_date: date | None = None
    supplier: str | None = None
    notes: str | None = None

class RestockResponse(BaseModel):
    id: UUID
    business_id: UUID
    restock_date: date
    supplier: str | None
    notes: str | None
    items: list[RestockItemResponse] = []

    model_config = {"from_attributes": True}
