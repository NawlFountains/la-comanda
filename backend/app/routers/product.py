from fastapi import APIRouter, Depends, HTTPException 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, select, func
from app.database import get_db
from app.models import Product, Business, PriceHistory, RecipeItem, Item
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductFullResponse
from app.schemas.price_history import PriceHistoryCreate, PriceHistoryResponse
from app.schemas.recipe_item import RecipeItemCreate, RecipeItemUpdate, RecipeItemResponse
from app.dependencies.auth import get_current_business
import uuid


router = APIRouter(prefix="/products", tags=["products"])


# --- Product endpoints ---

@router.get("/full", response_model=list[ProductFullResponse])
async def get_products_full(
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .where(Product.business_id == business.id)
        .options(selectinload(Product.recipe_items))
    )
    products = result.scalars().all()

    # get latest price for each product in one query
    product_ids = [p.id for p in products]
    latest_price_sub = (
        select(PriceHistory.product_id, func.max(PriceHistory.valid_from).label("max_date"))
        .where(PriceHistory.product_id.in_(product_ids))
        .group_by(PriceHistory.product_id)
        .subquery()
    )
    price_result = await db.execute(
        select(PriceHistory).join(
            latest_price_sub,
            (PriceHistory.product_id == latest_price_sub.c.product_id) &
            (PriceHistory.valid_from == latest_price_sub.c.max_date)
        )
    )
    prices_by_product = {p.product_id: p for p in price_result.scalars().all()}

    return [
        ProductFullResponse(
            id=p.id,
            business_id=p.business_id,
            name=p.name,
            latest_price=PriceHistoryResponse.model_validate(prices_by_product.get(p.id)) if prices_by_product.get(p.id) else None,
            recipe_items=p.recipe_items
        )
        for p in products
    ]

@router.get("/{product_id}/full", response_model=ProductFullResponse)
async def get_product_full(
    product_id: uuid.UUID,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.business_id == business.id)
        .options(selectinload(Product.recipe_items))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    price_result = await db.execute(
        select(PriceHistory)
        .where(PriceHistory.product_id == product_id)
        .order_by(desc(PriceHistory.valid_from))
        .limit(1)
    )
    latest_price = price_result.scalar_one_or_none()

    return ProductFullResponse(
        id=product.id,
        business_id=business.id,
        name=product.name,
        latest_price=PriceHistoryResponse.model_validate(latest_price) if latest_price else None,
        recipe_items=[RecipeItemResponse.model_validate(ri) for ri in product.recipe_items]
    )

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
        select(Product)
                .where(Product.business_id == business.id)

    )
    products = result.scalars().all()

    return products

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

# --- Price endpoints ---

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
                ).order_by(desc(PriceHistory.valid_from))
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

# --- Recipe endpoints ---

@router.get("/{product_id}/recipe", response_model=list[RecipeItemResponse])
async def get_recipe_items(
        product_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Product)
            .where(
                Product.id == product_id,
                Product.business_id == business.id
            )
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.execute(
            select(RecipeItem)
            .where( RecipeItem.product_id == product.id)
    )

    recipe_items = result.scalars().all()

    return recipe_items

@router.post("/{product_id}/recipe", response_model=RecipeItemResponse, status_code=201)
async def add_recipe_item(
        product_id: uuid.UUID,
        data: RecipeItemCreate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Product)
            .where(
                Product.id == product_id,
                Product.business_id == business.id
            )
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.execute(
            select(Item)
            .where(
                Item.id == data.item_id,
                Item.business_id == business.id 
            )
    )

    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    recipe_item = RecipeItem(
            id=uuid.uuid4(),
            product_id=product.id,
            **data.model_dump()
    )

    db.add(recipe_item)
    await db.commit()
    await db.refresh(recipe_item)
    return recipe_item

@router.patch("/{product_id}/recipe/{recipe_item_id}", response_model=RecipeItemResponse)
async def update_recipe_item(
        product_id: uuid.UUID,
        recipe_item_id: uuid.UUID,
        data: RecipeItemUpdate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Product)
            .where(
                Product.id == product_id,
                Product.business_id == business.id
            )
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.execute(
            select(RecipeItem)
            .where(
                RecipeItem.id == recipe_item_id,
                RecipeItem.product_id == product_id
            )
    )

    recipe_item = result.scalar_one_or_none()

    if recipe_item is None:
        raise HTTPException(status_code=404, detail="Recipe item not found")

    if data.quantity is not None:
        recipe_item.quantity = data.quantity

    if data.unit is not None:
        recipe_item.unit= data.unit

    await db.commit()
    await db.refresh(recipe_item)
    return recipe_item

@router.delete("/{product_id}/recipe/{recipe_item_id}", status_code=204)
async def delete_recipe_item(
        product_id: uuid.UUID,
        recipe_item_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Product)
            .where(
                Product.id == product_id,
                Product.business_id == business.id
            )
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.execute(
            select(RecipeItem)
            .where(
                RecipeItem.id == recipe_item_id,
                RecipeItem.product_id == product_id
            )
    )

    recipe_item = result.scalar_one_or_none()

    if recipe_item is None:
        raise HTTPException(status_code=404, detail="Recipe item not found")

    await db.delete(recipe_item)
    await db.commit()


