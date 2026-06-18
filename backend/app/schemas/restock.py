from pydantic import BaseModel
from uuid import UUID
from datetime import date

class RestockCreate(BaseModel):
    restock_date: date
    supplier: str | None = None
    notes: str | None = None

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

    model_config = {"from_attributes": True}
