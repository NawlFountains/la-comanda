from pydantic import BaseModel
from uuid import UUID

class BusinessCreate(BaseModel):
    name: str
    phone: str | None = None

class BusinessResponse(BaseModel):
    id: UUID
    name: str
    phone: str | None
    created_at: str 

    model_config = {"from_attributes": True}
