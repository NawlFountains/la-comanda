from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Restock, RestockItem
from app.schemas.restock import RestockCreate, RestockResponse, RestockUpdate 
from app.dependencies.auth import get_current_business
import uuid

router = APIRouter(prefix="/restocks", tags=["restocks"])

@router.post("", response_model=ItemResponse, status_code=201)
async def create_restock(
        data: ItemCreate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    item = Item(
            id = uuid.uuid4(),
            business_id = business.id,
            **data.model_dump()
    )

    db.add(item)

    await db.commit()
    await db.refresh(item)
    return item

