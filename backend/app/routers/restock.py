from sqlalchemy.orm import selectinload

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Restock, RestockItem, Business
from app.schemas.restock import RestockCreate, RestockResponse, RestockUpdate, RestockItemCreate, RestockItemResponse
from app.dependencies.auth import get_current_business
import uuid

router = APIRouter(prefix="/restocks", tags=["restocks"])

@router.post("", response_model=RestockResponse, status_code=201)
async def create_restock(
        data: RestockCreate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    restock = Restock(
            id=uuid.uuid4(),
            business_id=business.id,
            created_at=data.created_at,
            supplier=data.supplier,
            notes=data.notes
    )
    db.add(restock)
    await db.flush()

    for item_data in data.restock_items:
        restock_item = RestockItem(
                id=uuid.uuid4(),
                restock_id=restock.id,
                item_id=item_data.item_id,
                quantity=item_data.quantity
        )
        db.add(restock_item)

    await db.commit()
    result = await db.execute(
            select(Restock)
            .where(Restock.id == restock.id)
            .options(selectinload(Restock.restock_items))
    )
    restock = result.scalar_one()
    return restock

@router.get("", response_model=list[RestockResponse])
async def get_restocks(
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Restock)
                .where( Restock.business_id == business.id)
                .options(selectinload(Restock.restock_items))
    )

    restocks = result.scalars().all()

    return restocks

