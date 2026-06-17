from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Product, Business, PriceHistory 
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.price_history import PriceHistoryCreate, PriceHistoryResponse
from app.dependencies.auth import get_current_business
import uuid


router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
        data: ProductCreate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    product = Product(
            id = uuid.uuid4(),
            business_id = business.id,
            **data.model_dump()
    )

    db.add(product)

    await db.commit()
    await db.refresh(product)
    return product

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db)
):
    result= await db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.business_id == business.id
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("", response_model=list[ProductResponse])
async def get_products(
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(
                Product.business_id == business.id
            )
    )
    products = result.scalars().all()

    return products

@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
        product_id: uuid.UUID,
        data: ProductUpdate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result= await db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.business_id == business.id
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if data.name is not None:
        product.name = data.name

    await db.commit()
    await db.refresh(product)
    return product




@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db)
):
    result= await db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.business_id == business.id
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()

@router.get("/{product_id}/prices", response_model=list[PriceHistoryResponse])
async def get_prices(
    product_id: uuid.UUID,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Product).where(
                    Product.id == product_id,
                    Product.business_id == business.id
                )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    result = await db.execute(
            select(PriceHistory).where(
                    PriceHistory.product_id == product.id
                )
    )
    prices = result.scalars().all()
    return prices

@router.post("/{product_id}/prices", response_model=PriceHistoryResponse, status_code=201)
async def add_price(
    product_id: uuid.UUID,
    data: PriceHistoryCreate,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Product).where(
                    Product.id == product_id,
                    Product.business_id == business.id
                )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    price = PriceHistory(
        id = uuid.uuid4(),
        product_id = product_id,
        **data.model_dump()
    )
    db.add(price)

    await db.commit()
    await db.refresh(price)
    return price

