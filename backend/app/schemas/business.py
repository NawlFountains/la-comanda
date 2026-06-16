from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class BusinessCreate(BaseModel):
    name: str
    phone: str | None = None

class BusinessResponse(BaseModel):
    id: UUID
    name: str
    phone: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
