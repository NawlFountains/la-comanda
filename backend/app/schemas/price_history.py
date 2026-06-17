from decimal import Decimal
from datetime import date

from pydantic import BaseModel
from uuid import UUID

class PriceHistoryCreate(BaseModel):
    price: Decimal
    valid_from: date

class PriceHistoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    price: Decimal 
    valid_from: date
    
    model_config = {"from_attributes": True}
