from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID

class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int

class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    model_config = {"from_attributes": True}

class OrderCreate(BaseModel):
    customer_id: UUID
    items: list[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: str | None = None

class OrderResponse(BaseModel):
    id: UUID
    business_id: UUID
    customer_id: UUID
    created_at: str 
    status: str
    items: list[OrderItemResponse] = []
    model_config = {"from_attributes": True}
