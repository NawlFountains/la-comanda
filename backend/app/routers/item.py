from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Business, Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.dependencies.auth import get_current_business
import uuid

router = APIRouter(prefix="/items", tags=["items"])

@router.post("", response_model=ItemResponse, status_code=201)
async def create_item(
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

@router.get("", response_model=list[ItemResponse])
async def get_items(
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Item).where(
                    Item.business_id == business.id
                ).order_by(func.lower(Item.name))
    )
    items = result.scalars().all()
    return items 

@router.get("/low-stock", response_model= list[ItemResponse])
async def get_low_stock_items(
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Item).where(
                    Item.business_id == business.id,
                    Item.current_stock <= Item.low_stock_threshold
                ).order_by(func.lower(Item.name))
    )

    items = result.scalars().all()
    return items

@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
        item_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Item).where(
                Item.id == item_id,
                Item.business_id == business.id
                )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(
        item_id: uuid.UUID,
        data: ItemUpdate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Item).where(
                    Item.id == item_id,
                    Item.business_id == business.id
                )
    )

    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if data.name is not None:
        item.name = data.name

    if data.unit is not None:
        item.unit = data.unit

    if data.current_stock is not None:
        item.current_stock= data.current_stock

    if data.low_stock_threshold is not None:
        item.low_stock_threshold= data.low_stock_threshold

    if data.notes is not None:
        item.notes = data.notes

    await db.commit()
    await db.refresh(item)
    return item 

@router.delete("/{item_id}", status_code=204)
async def delete_item(
        item_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Item).where(
                    Item.id == item_id,
                    Item.business_id == business.id
                )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()
