from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import Restock, RestockItem, Business, Item
from app.schemas.restock import RestockCreate, RestockResponse, RestockUpdate
from app.dependencies.auth import get_current_business
import uuid

router = APIRouter(prefix="/restocks", tags=["restocks"])

@router.get("", response_model=list[RestockResponse])
async def get_restocks(
        supplier: Optional[str] = Query(None, description="Filter by supplier name"),
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db),
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0)
):
    query = (
                select(Restock)
                    .where( Restock.business_id == business.id)
    )

    if supplier is not None:
        query = query.where(Restock.supplier == supplier)

    query = query.order_by(desc(Restock.restock_date)).options(selectinload(Restock.restock_items)).limit(limit).offset(offset)

    result = await db.execute(query)

    restocks = result.scalars().all()

    return restocks

@router.get("/{restock_id}", response_model=RestockResponse)
async def get_restock(
        restock_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Restock)
            .where(
                Restock.id == restock_id,
                Restock.business_id == business.id
            )
            .options( selectinload((Restock.restock_items)))
    )
    restock = result.scalar_one_or_none()

    if restock is None:
        raise HTTPException(status_code=404, detail="Restock not found")

    return restock

@router.post("", response_model=RestockResponse, status_code=201)
async def create_restock(
        data: RestockCreate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    item_ids = [item_data.item_id for item_data in data.restock_items]

    result = await db.execute(
        select(Item).where(
            Item.id.in_(item_ids),
            Item.business_id == business.id
        )
    )

    items_by_id = {item.id: item for item in result.scalars().all()}

    for item_data in data.restock_items:
        item = items_by_id.get(item_data.item_id)

        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_data.item_id} not found")

        item.current_stock += item_data.quantity

    restock = Restock(
            id=uuid.uuid4(),
            business_id=business.id,
            restock_date=data.restock_date,
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

@router.patch("/{restock_id}", response_model=RestockResponse)
async def update_restock(
        restock_id: uuid.UUID,
        data: RestockUpdate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Restock)
            .where(
                Restock.id == restock_id,
                Restock.business_id == business.id
            )
            .options( selectinload((Restock.restock_items)))
    )
    restock = result.scalar_one_or_none()

    if restock is None:
        raise HTTPException(status_code=404, detail="Restock not found")

    if data.restock_date is not None:
        restock.restock_date= data.restock_date

    if data.supplier is not None:
        restock.supplier = data.supplier

    if data.notes is not None:
        restock.notes= data.notes

    await db.commit()
    result = await db.execute(
            select(Restock)
            .where(Restock.id == restock.id)
            .options(selectinload(Restock.restock_items))
    )
    restock = result.scalar_one()
    return restock

@router.delete("/{restock_id}", status_code=204)
async def delete_restock(
        restock_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Restock)
            .where(
                Restock.id == restock_id,
                Restock.business_id == business.id
            )
            .options(selectinload(Restock.restock_items))
    )

    restock = result.scalar_one_or_none()

    if restock is None:
        raise HTTPException(status_code=404, detail="Restock not found")

    item_ids = [restock_item.item_id for restock_item in restock.restock_items]

    item_result = await db.execute(
        select(Item).where(Item.id.in_(item_ids))
    )

    items_by_id = {item.id: item for item in item_result.scalars().all()}

    for restock_item in restock.restock_items:
        item = items_by_id.get(restock_item.item_id)
        if item:
            item.current_stock -= restock_item.quantity    

    await db.delete(restock)
    await db.commit()
