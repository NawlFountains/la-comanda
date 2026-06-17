from pydantic import BaseModel
from uuid import UUID

class ProductCreate(BaseModel):
    name: str

class ProductUpdate(BaseModel):
    name: str | None = None

class ProductResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str

    model_config = {"from_attributes": True}
