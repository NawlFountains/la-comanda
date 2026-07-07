import uuid
import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Item, Order
from app.models.order import OrderStatus
from datetime import date
from decimal import Decimal
from conftest import mock_auth_failure

# --- POST Tests ---

@pytest.mark.asyncio
async def test_create_order(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory,
        assert_json_match_order
):
    i1= await item_factory(business_id=setup_business.id, name="Papas")
    i2= await item_factory(business_id=setup_business.id, name="Manteca")
    i3= await item_factory(business_id=setup_business.id, name="Leche")
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    _, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    ph2, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    _, _, _ = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product)
    _, _, _ = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product)
    _, _, _ = await recipe_item_factory(business_id=setup_business.id, item=i3, product=product)

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 1
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201
    data = response.json()

    assert "id" in data
    assert "created_at" in data

    assert data["business_id"] == str(setup_business.id)
    assert data["customer_id"] == str(customer.id)
    assert data["status"] == "pending"

    assert len(data["order_items"]) == 1
    assert data["order_items"][0]["order_id"] == data["id"]
    assert data["order_items"][0]["product_id"] == str(product.id)
    assert data["order_items"][0]["quantity"] == 1
    assert Decimal(data["order_items"][0]["unit_price"]) == Decimal(ph2.price) # The most recent price

    order_uuid = uuid.UUID(data["id"])

    # Check if created on db

    result = await db_session.execute(
            select(Order)
            .where(
                Order.id == order_uuid,
                Order.business_id == setup_business.id
            )
            .options(selectinload(Order.order_items))
    )

    db_order = result.scalar_one_or_none()

    assert db_order is not None
    assert_json_match_order(db_order, data)

@pytest.mark.asyncio
async def test_create_order_decrement_stock(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should decrement stock of items when an order is placed """
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("10"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    _, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    ph2, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2.1"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3.2"))
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, item=i3, product=product, quantity=Decimal("1"))

    old_stock = [i1.current_stock, i2.current_stock, i3.current_stock]

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 2
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201

    result = await db_session.execute(
            select(Item)
            .where(
                Item.id.in_([i1.id, i2.id, i3.id])
            )
    )
    db_items = result.scalars().all()

    db_items_by_id = {item.id: item for item in db_items}

    assert db_items_by_id[i1.id].current_stock == old_stock[0] - (ri1.quantity * 2)
    assert db_items_by_id[i2.id].current_stock == old_stock[1] - (ri2.quantity * 2)
    assert db_items_by_id[i3.id].current_stock == old_stock[2] - (ri3.quantity * 2)

@pytest.mark.asyncio
async def test_create_order_duplicate_product(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should return 400 when a product is requested more than once, aggregation fails on the requester """
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("10"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2.1"))
    await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3.2"))
    await recipe_item_factory(business_id=setup_business.id, item=i3, product=product, quantity=Decimal("1"))

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 2
                    },
                    {
                        "product_id": str(product.id),
                        "quantity": 2
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Duplicate products in order - combine quantities instead"

    result = await db_session.execute(
            select(Order)
            .where(
                Order.business_id == setup_business.id
            )
    )

    db_order = result.scalar_one_or_none()

    assert db_order is None # Check no order was created 

@pytest.mark.asyncio
async def test_create_order_empty_order_items(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should return 400 when a product is requested more than once, aggregation fails on the requester """
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("10"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2.1"))
    await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3.2"))
    await recipe_item_factory(business_id=setup_business.id, item=i3, product=product, quantity=Decimal("1"))

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[]
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "No items in order"

    result = await db_session.execute(
            select(Order)
            .where(
                Order.business_id == setup_business.id
            )
    )

    db_order = result.scalar_one_or_none()

    assert db_order is None # Check no order was created 

@pytest.mark.asyncio
async def test_create_order_missing_input(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should return 422 if a mandatory input is missing"""
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("10"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    _, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    ph2, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2.1"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3.2"))
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, item=i3, product=product, quantity=Decimal("1"))
    # Missing customer_id 
    response = await client.post(
            "/orders",
            json={
                # "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 2
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    # Missing product_id from order_items 
    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        # "product_id": str(product.id),
                        "quantity": 2
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    # Missing quantity from order_items
    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        # "quantity": 2
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    # Missing order_items
    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                # "order_items":[
                #     {
                #         "product_id": str(product.id),
                #         "quantity": 2
                #     }
                # ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    result = await db_session.execute(
            select(Order)
            .where(
                Order.business_id == setup_business.id
            )
    )

    db_order = result.scalar_one_or_none()

    assert db_order is None # Check no order was created 

@pytest.mark.asyncio
async def test_create_order_missing_product_price(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        recipe_item_factory
):
    """ should return 404 when trying to place an order and price for product doesnt exist """
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("10"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2.1"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3.2"))
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, item=i3, product=product, quantity=Decimal("1"))

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 1
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Price for product not found"

    result = await db_session.execute(
            select(Order)
            .where(
                Order.business_id == setup_business.id
            )
    )

    db_order = result.scalar_one_or_none()

    assert db_order is None # Check no order was created 

@pytest.mark.asyncio
async def test_create_order_missing_customer(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should return 404 when trying to place an order and customer doesnt exist """
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("10"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    _, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    ph2, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2.1"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3.2"))
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, item=i3, product=product, quantity=Decimal("1"))

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(uuid.uuid4()),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 1
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found"

    result = await db_session.execute(
            select(Order)
            .where(
                Order.business_id == setup_business.id
            )
    )

    db_order = result.scalar_one_or_none()

    assert db_order is None # Check no order was created 

@pytest.mark.asyncio
async def test_create_order_missing_product(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        item_factory,
        customer_factory
):
    """ should return 404 when trying to place an order and product doesnt exist """
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("10"))
    customer = await customer_factory(business_id=setup_business.id, name="Jose")

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(uuid.uuid4()),
                        "quantity": 1
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"

    result = await db_session.execute(
            select(Order)
            .where(
                Order.business_id == setup_business.id
            )
    )

    db_order = result.scalar_one_or_none()

    assert db_order is None # Check no order was created 


@pytest.mark.asyncio
async def test_create_order_insufficient_stock(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should return 409 when trying to place an order but stock for items is insufficient """
    i1= await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("2"))
    i2= await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("3.1"))
    i3= await item_factory(business_id=setup_business.id, name="Leche", current_stock=Decimal("5"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    _, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    ph2, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2.1"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3.2"))
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, item=i3, product=product, quantity=Decimal("1"))

    original_stock = [i1.current_stock, i2.current_stock, i3.current_stock]
    order_quantity = 2
    required_stock = [
            ri1.quantity * order_quantity,
            ri2.quantity * order_quantity,
            ri3.quantity * order_quantity
    ]

    # Insufficent stock for i1
    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": order_quantity
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 409
    assert response.json()["detail"] == f"Insufficient stock for {i1.name}: need {required_stock[0]}, have {i1.current_stock}"

    result = await db_session.execute(
            select(Item)
            .where(
                Item.id.in_([i1.id, i2.id, i3.id])
            )
    )
    db_items = result.scalars().all()

    db_items_by_id = {item.id: item for item in db_items}

    assert db_items_by_id[i1.id].current_stock == original_stock[0]
    assert db_items_by_id[i2.id].current_stock == original_stock[1] 
    assert db_items_by_id[i3.id].current_stock == original_stock[2]

@pytest.mark.asyncio
async def test_create_order_another_business(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should return 404 when trying to place an order for another business  (shouldn't find items, product or customer)"""
    another_business_uuid = uuid.uuid4()

    i1= await item_factory(business_id=another_business_uuid, name="Papas", current_stock=Decimal("2"))
    i2= await item_factory(business_id=another_business_uuid, name="Manteca", current_stock=Decimal("3.1"))
    i3= await item_factory(business_id=another_business_uuid, name="Leche", current_stock=Decimal("5"))
    product = await product_factory(business_id=another_business_uuid, name="Pure")
    customer = await customer_factory(business_id=another_business_uuid, name="Jose")
    _, _ = await price_history_factory(business_id=another_business_uuid, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    ph2, _ = await price_history_factory(business_id=another_business_uuid, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    _, _, ri1 = await recipe_item_factory(business_id=another_business_uuid, item=i1, product=product, quantity=Decimal("2.1"))
    _, _, ri2 = await recipe_item_factory(business_id=another_business_uuid, item=i2, product=product, quantity=Decimal("3.2"))
    _, _, ri3 = await recipe_item_factory(business_id=another_business_uuid, item=i3, product=product, quantity=Decimal("1"))

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 1
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found" 

    result = await db_session.execute(
            select(Order)
            .where(
                Order.id.in_([setup_business.id, another_business_uuid])
            )
    )
    db_items = result.scalars().all()

    # Neither business should have succefully created an order
    assert db_items == [] 

@pytest.mark.asyncio
async def test_create_order_unauthorized(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        product_factory,
        item_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory,
        assert_json_match_order
):
    """ should return 401 when an unauthorized clien tries to place an order """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    i1= await item_factory(business_id=setup_business.id, name="Papas")
    i2= await item_factory(business_id=setup_business.id, name="Manteca")
    i3= await item_factory(business_id=setup_business.id, name="Leche")
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    _, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("32"), valid_from=date(2022,2,3))
    ph2, _ = await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025,2,3))
    _, _, _ = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product)
    _, _, _ = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product)
    _, _, _ = await recipe_item_factory(business_id=setup_business.id, item=i3, product=product)

    original_stock = [i1.current_stock, i2.current_stock, i3.current_stock]

    response = await client.post(
            "/orders",
            json={
                "customer_id": str(customer.id),
                "order_items":[
                    {
                        "product_id": str(product.id),
                        "quantity": 1
                    }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(Order)
            .where( Order.business_id == setup_business.id)
    )
    db_order = result.scalar_one_or_none()

    assert db_order is None

    result = await db_session.execute(
            select(Item)
            .where(
                Item.id.in_([i1.id, i2.id, i3.id])
            )
    )
    db_items = result.scalars().all()

    db_items_by_id = {item.id: item for item in db_items}

    assert db_items_by_id[i1.id].current_stock == original_stock[0]
    assert db_items_by_id[i2.id].current_stock == original_stock[1] 
    assert db_items_by_id[i3.id].current_stock == original_stock[2] 

# --- GET Tests ---

@pytest.mark.asyncio
async def test_get_orders(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory,
        assert_json_match_order
):
    """ should return all order from a business (not checking order) """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    response = await client.get(
            "/orders",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    response_map = {uuid.UUID(item["id"]): item for item in data}

    assert_json_match_order(o1, response_map[o1.id])
    assert_json_match_order(o2, response_map[o2.id])
    assert_json_match_order(o3, response_map[o3.id])

@pytest.mark.asyncio
async def test_get_orders_with_limit(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory,
):
    """ should return order by limit from a business """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    response = await client.get(
            "/orders?limit=2",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_orders_with_offset(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory,
):
    """ should skip orders by offset """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, quantity=6)

    response = await client.get(
            "/orders?offset=1",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_orders_with_limit_and_offset(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory,
):
    """ should return paged orders with limit and offset """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, quantity=6)

    response = await client.get(
            "/orders?limit=1&offset=1",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

@pytest.mark.asyncio
async def test_get_orders_limit_exceeds_total(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should return all orders when limit exceeds total count """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, quantity=2)

    response = await client.get(
            "/orders?limit=100",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 2

@pytest.mark.asyncio
async def test_get_orders_invalid_limit(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business
):
    """ should return 422 when limit is invalid """
    response = await client.get(
            "/orders?limit=0",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_orders_invalid_offset(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business
):
    """ should return 422 when offset is negative """
    response = await client.get(
            "/orders?offset=-1",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_orders_filter_by_status(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory,
        assert_json_match_order
):
    """ should return all order from a business """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    # Query only pending orders
    response = await client.get(
            "/orders?status=pending",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    # Only one pending order, o1
    assert len(data) == 1
    assert_json_match_order(o1, data[0])

    # Query only cancelled orders
    response = await client.get(
            "/orders?status=cancelled",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    # Only one delivered order, o2
    assert len(data) == 1
    assert_json_match_order(o2, data[0])

    # Query only delivered orders
    response = await client.get(
            "/orders?status=delivered",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    # Only one delivered order, o3
    assert len(data) == 1
    assert_json_match_order(o3, data[0])

    # Query only confirmed orders 
    response = await client.get(
            "/orders?status=confirmed",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_orders_filter_by_status_malformed(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should return 422 when querying an order but status is not valid """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    # Ontrack is not a valid status
    response = await client.get(
            "/orders?status=ontrack",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_orders_empty(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business
):
    """ should return [] when no orders from a business """
    response = await client.get(
            "/orders",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_orders_unauthorized(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should return 401 when an unauthorized client tries to get endpoints """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    response = await client.get(
            "/orders"
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_order_by_id(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory,
        assert_json_match_order
):
    """ should return an order queried by id from a business """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    response = await client.get(
            f"/orders/{str(o1.id)}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    assert_json_match_order(o1, data)

@pytest.mark.asyncio
async def test_get_order_by_id_non_existing(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should 404 when querying a non-exisiting order by id from a business """
    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    response = await client.get(
            f"/orders/{str(uuid.uuid4())}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_order_by_id_another_business(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should 404 when querying an exisiting order by id but from another business """
    another_business_uuid = uuid.uuid4()

    o1, _, _, _ = await order_factory(business_id=another_business_uuid)
    o2, _, _, _ = await order_factory(business_id=another_business_uuid, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=another_business_uuid, status=OrderStatus.delivered, quantity=6)

    response = await client.get(
            f"/orders/{str(o1.id)}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_order_by_id_unauthorized(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should 401 when querying an exisiting order by id from business but client unauthorized """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    o1, _, _, _ = await order_factory(business_id=setup_business.id)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled, quantity=2)
    o3, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered, quantity=6)

    response = await client.get(
            f"/orders/{str(o1.id)}"
    )

    assert response.status_code == 401

# --- PATCH Tests ---

@pytest.mark.asyncio
async def test_update_order_status(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should update status of an existing order """
    o1, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.pending)
    o2, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.delivered)

    assert o1.status == "pending"

    response = await client.patch(
            f"/orders/{str(o1.id)}/status",
            json={
                "status": "confirmed"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "confirmed"
    
    assert o2.status == "delivered"

    response = await client.patch(
            f"/orders/{str(o2.id)}/status",
            json={
                "status": "cancelled"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "cancelled"

    result = await db_session.execute(
            select(Order)
            .where(Order.id == o2.id)
    )
    db_order = result.scalar_one_or_none()
    assert db_order is not None
    assert db_order.status == OrderStatus.cancelled

@pytest.mark.asyncio
async def test_update_order_status_return_stock_on_cancelled(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        item_factory,
        product_factory,
        customer_factory,
        price_history_factory,
        recipe_item_factory
):
    """ should return stock of items when order is cancelled """
    i1 = await item_factory(business_id=setup_business.id, name="Papas", current_stock=Decimal("10"))
    i2 = await item_factory(business_id=setup_business.id, name="Manteca", current_stock=Decimal("10"))
    product = await product_factory(business_id=setup_business.id, name="Pure")
    customer = await customer_factory(business_id=setup_business.id, name="Jose")
    await price_history_factory(business_id=setup_business.id, product=product, price=Decimal("150"), valid_from=date(2025, 2, 3))
    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, item=i1, product=product, quantity=Decimal("2"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, item=i2, product=product, quantity=Decimal("3"))

    order_quantity = 2

    # Place the order via endpoint so stock is decremented
    order_response = await client.post(
        "/orders",
        json={
            "customer_id": str(customer.id),
            "order_items": [
                {
                    "product_id": str(product.id),
                    "quantity": order_quantity
                }
                ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]

    stock_after_order = {}
    result = await db_session.execute(select(Item).where(Item.id.in_([i1.id, i2.id])))
    for item in result.scalars().all():
        stock_after_order[item.id] = item.current_stock

    # Cancel the order
    response = await client.patch(
        f"/orders/{order_id}/status",
        json={"status": "cancelled"},
        headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"

    # Stock should be restored
    result = await db_session.execute(select(Item).where(Item.id.in_([i1.id, i2.id])))
    db_items = {item.id: item for item in result.scalars().all()}

    assert db_items[i1.id].current_stock == stock_after_order[i1.id] + (ri1.quantity * order_quantity)
    assert db_items[i2.id].current_stock == stock_after_order[i2.id] + (ri2.quantity * order_quantity)

@pytest.mark.asyncio
async def test_update_order_status_cancelled(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should return 400 when trying to update status of a cancelled order"""
    o1, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.cancelled)

    assert o1.status == "cancelled"

    response = await client.patch(
            f"/orders/{str(o1.id)}/status",
            json={
                "status": "pending"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 400

    result = await db_session.execute(
            select(Order)
            .where(Order.id == o1.id)
    )

    db_order = result.scalar_one_or_none()
    assert db_order is not None
    assert db_order.status == OrderStatus.cancelled

@pytest.mark.asyncio
async def test_update_order_status_malformed(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should return 422 when trying to update status of an order, but stauts doesn't exist """
    o1, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.pending)

    assert o1.status == "pending"

    response = await client.patch(
            f"/orders/{str(o1.id)}/status",
            json={
                "status": "ontrack"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 422

    result = await db_session.execute(
            select(Order)
            .where(Order.id == o1.id)
    )

    db_order = result.scalar_one_or_none()
    assert db_order is not None
    assert db_order.status == OrderStatus.pending



@pytest.mark.asyncio
async def test_update_order_status_non_existing(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business
):
    """ should return 404 when trying to update status of an non-existing order"""
    order_uuid = uuid.uuid4()

    response = await client.patch(
            f"/orders/{str(order_uuid)}/status",
            json={
                "status": "confirmed"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 404

    result = await db_session.execute(
            select(Order)
            .where(Order.id == order_uuid)
    )

    db_order = result.scalar_one_or_none()
    assert db_order is None

@pytest.mark.asyncio
async def test_update_order_status_another_business(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should return 404 when trying to update status of an existing order but from another business """
    another_business_uuid = uuid.uuid4()
    o1, _, _, _ = await order_factory(business_id=another_business_uuid, status=OrderStatus.pending)

    assert o1.status == "pending"

    response = await client.patch(
            f"/orders/{str(o1.id)}/status",
            json={
                "status": "confirmed"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 404

    result = await db_session.execute(
            select(Order)
            .where(Order.id == o1.id)
    )

    db_order = result.scalar_one_or_none()
    assert db_order is not None
    assert db_order.status == OrderStatus.pending

@pytest.mark.asyncio
async def test_update_order_status_unauthorized(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        order_factory
):
    """ should return 401 when trying to update status of an existing order but the client is unauthorized """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    o1, _, _, _ = await order_factory(business_id=setup_business.id, status=OrderStatus.pending)

    assert o1.status == "pending"

    response = await client.patch(
            f"/orders/{str(o1.id)}/status",
            json={
                "status": "confirmed"
            }
    )
    assert response.status_code == 401

    result = await db_session.execute(
            select(Order)
            .where(Order.id == o1.id)
    )

    db_order = result.scalar_one_or_none()
    assert db_order is not None
    assert db_order.status == OrderStatus.pending
