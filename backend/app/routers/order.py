from typing import Optional
from app.models.price_history import PriceHistory
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from app.database import get_db
from app.models import Business, Item, Customer, Product, Order, OrderItem, RecipeItem
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse 
from app.dependencies.auth import get_current_business
import uuid

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
        data: OrderCreate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    raw_product_ids = [item_data.product_id for item_data in data.order_items]

    if not raw_product_ids:
        raise HTTPException(status_code=400, detail="No items in order")
    if len(raw_product_ids) != len(set(raw_product_ids)):
        raise HTTPException(status_code=400, detail="Duplicate products in order - combine quantities instead")

    product_ids = list(set(raw_product_ids))

    # Check customer existance
    customer_result = await db.execute(
        select(Customer).where(
            Customer.id == data.customer_id,
            Customer.business_id == business.id
        )
    )
    customer = customer_result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Get recipe and ingredients of a product
    product_result = await db.execute(
        select(Product)
        .options(
            joinedload(Product.recipe_items)
            .joinedload(RecipeItem.item)
        )
        .where(
            Product.id.in_(product_ids),
            Product.business_id == business.id
        )
    )
    products_by_id = {p.id: p for p in product_result.unique().scalars().all()}

    # Load latest price defined
    latest_price_sub = (
        select(PriceHistory.product_id, func.max(PriceHistory.valid_from).label("max_date"))
        .where(PriceHistory.product_id.in_(product_ids))
        .group_by(PriceHistory.product_id)
        .subquery()
    )
    price_result = await db.execute(
        select(PriceHistory)
        .join(
            latest_price_sub,
            (PriceHistory.product_id == latest_price_sub.c.product_id) & 
            (PriceHistory.valid_from == latest_price_sub.c.max_date)
        )
    )
    prices_by_product_id = {price.product_id: price for price in price_result.scalars().all()}

    total_ingredient_demands = {} 
    validated_items = []

    # Validate all the inputs are correct
    for item_data in data.order_items:
        product = products_by_id.get(item_data.product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")

        price = prices_by_product_id.get(item_data.product_id)
        if not price:
            raise HTTPException(status_code=404, detail="Price for product not found")

        # Compile ingredient deductions and validate structure
        for recipe_item in product.recipe_items:
            ingredient = recipe_item.item
            if not ingredient:
                raise HTTPException(status_code=404, detail="Ingredient not found")

            required = recipe_item.quantity * item_data.quantity
            total_ingredient_demands[ingredient.id] = total_ingredient_demands.get(ingredient.id, 0) + required

        validated_items.append((item_data, product, price))

    # Verify stock suffies demands
    for item_data, product, price in validated_items:
        for recipe_item in product.recipe_items:
            ingredient = recipe_item.item
            total_required = total_ingredient_demands[ingredient.id]
            
            if ingredient.current_stock < total_required:
                raise HTTPException(
                    status_code=409,
                    detail=f"Insufficient stock for {ingredient.name}: need {total_required}, have {ingredient.current_stock}"
                )

    order = Order(
        id=uuid.uuid4(),
        business_id=business.id,
        customer_id=data.customer_id,
        status=OrderStatus.pending
    )
    db.add(order)
    await db.flush()  

    for item_data, product, price in validated_items:
        order_item = OrderItem(
            id=uuid.uuid4(),
            order_id=order.id,
            product_id=product.id,
            quantity=item_data.quantity,
            unit_price=price.price
        )
        db.add(order_item)

        # Decrement the stock directly 
        for recipe_item in product.recipe_items:
            recipe_item.item.current_stock -= recipe_item.quantity * item_data.quantity

    await db.commit()

    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.order_items))
    )
    return result.scalar_one()

@router.get("", response_model=list[OrderResponse])
async def get_orders(
        status: Optional[OrderStatus] = Query(None, description="Filter orders by status"),
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db),
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0)
):
    query = (
            select(Order)
            .where(Order.business_id == business.id)
            .options(selectinload(Order.order_items))
            .limit(limit)
            .offset(offset)
    )

    if status is not None:
        query = query.where(Order.status == status)

    result = await db.execute(query)
    orders = result.scalars().all()

    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
        order_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Order)
            .where(
                Order.business_id == business.id,
                Order.id == order_id
            )
            .options(selectinload(Order.order_items))
    )
    order= result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order 

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
        order_id: uuid.UUID,
        data: OrderUpdate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Order)
            .where(
                Order.business_id == business.id,
                Order.id == order_id
            )
            .options(selectinload(Order.order_items))
    )
    order= result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == OrderStatus.cancelled:
        raise HTTPException(status_code=400, detail="Can't change the status of a cancelled order")

    if data.status == OrderStatus.cancelled and order.status != OrderStatus.cancelled:
        # Restock all reservered items from OrderItem
        await restock_order_inventory(order, db)

    if data.status is not None:
        order.status = data.status 

    await db.commit()
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.order_items))
    )
    return result.scalar_one()

async def restock_order_inventory(order: Order, db: AsyncSession):
    """
    Reverts the inventory decrements made by an order's items and their recipes.
    Expects order.order_items to be loaded, or fetches them if missing.
    """
    if "order_items" not in order.__dict__:
        result = await db.execute(
            select(Order)
            .where(Order.id == order.id)
            .options(selectinload(Order.order_items))
        )
        order = result.scalar_one()

    if not order.order_items:
        return

    # Store quantities to only do one query

    product_quantities = {}
    for order_item in order.order_items:
        product_quantities[order_item.product_id] = (
            product_quantities.get(order_item.product_id, 0) + order_item.quantity
        )
    
    recipe_result = await db.execute(
        select(RecipeItem).where(RecipeItem.product_id.in_(product_quantities.keys()))
    )
    recipe_items = recipe_result.scalars().all()

    if not recipe_items:
        return

    ingredients_to_restock = {}
    for recipe_item in recipe_items:
        ordered_qty = product_quantities[recipe_item.product_id]
        total_return_qty = recipe_item.quantity * ordered_qty
        
        ingredients_to_restock[recipe_item.item_id] = (
            ingredients_to_restock.get(recipe_item.item_id, 0) + total_return_qty
        )

    ingredient_ids = list(ingredients_to_restock.keys())
    items_result = await db.execute(
        select(Item).where(Item.id.in_(ingredient_ids))
    )
    db_ingredients = items_result.scalars().all()

    for ingredient in db_ingredients:
        qty_to_restore = ingredients_to_restock[ingredient.id]
        ingredient.current_stock += qty_to_restore
