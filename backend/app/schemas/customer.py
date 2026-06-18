from pydantic import BaseModel
from uuid import UUID

class CustomerCreate(BaseModel):
    name: str
    phone: str 

class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None

class CustomerResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    phone: str

    model_config = {"from_attributes": True}
