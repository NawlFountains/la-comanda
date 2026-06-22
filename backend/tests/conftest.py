from decimal import Decimal
import sys
import os 
from datetime import date
from fastapi import HTTPException
import pytest
import asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession 
from typing import AsyncGenerator

os.environ["TESTING"] = "True"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.database import get_db, Base, engine
from app.models import Business, Product, Item, RecipeItem, Customer, Restock, RestockItem, PriceHistory, Order, OrderItem
from app.models.order import OrderStatus
from app.dependencies.auth import get_current_business

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """ Build schema in-memory engine before test """
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """ Fresh isolated database session per test, roll back on end """
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """ Configured client with the database dependecy overriden """
    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.fixture
def cleanup_override():
    yield
    app.dependency_overrides.clear()

@pytest.fixture
async def setup_business(db_session: AsyncSession):
    fake_business = Business(id=uuid.uuid4(), user_id=uuid.uuid4(),name="Test")
    db_session.add(fake_business)
    await db_session.commit()
    await db_session.refresh(fake_business)

    app.dependency_overrides[get_current_business] = lambda: fake_business
    yield fake_business
    app.dependency_overrides.clear()

# --- Entities factories ---

@pytest.fixture
async def product_factory(db_session: AsyncSession):
    """ factory generator for product """
    async def _create(business_id: uuid.UUID, name: str):
        product = Product(
                    id = uuid.uuid4(),
                    business_id = business_id,
                    name=name
            )
        db_session.add(product)
        await db_session.flush()
        return product
    return _create


@pytest.fixture
async def item_factory(db_session: AsyncSession):
    """ factory generator for item """
    async def _create(business_id: uuid.UUID, name: str, unit: str = "kg", current_stock: Decimal = Decimal("10"), low_stock_threshold: Decimal = Decimal("2"), notes: str | None = None):
        item = Item(
                id = uuid.uuid4(),
                business_id = business_id,
                name = name,
                unit = unit,
                current_stock = current_stock,
                low_stock_threshold = low_stock_threshold,
                notes = notes
        )
        db_session.add(item)
        await db_session.flush()

        return item
    return _create

@pytest.fixture
async def recipe_item_factory(db_session: AsyncSession, product_factory, item_factory):
    """ factory generator for recipe_item, creating necesarry product and items"""
    async def _create(business_id: uuid.UUID, product: Product | None = None, item: Item | None = None, quantity: Decimal = Decimal("1"), unit: str = "kg"):
        if product is None:
            product = await product_factory(business_id=business_id, name="Default product")

        if item is None:
            item = await item_factory(business_id=business_id, name="Default item")

        assert product is not None
        assert item is not None

        recipe_item = RecipeItem(
                id = uuid.uuid4(),
                product_id = product.id,
                item_id = item.id,
                quantity = quantity,
                unit = unit
        )
        db_session.add(recipe_item)
        await db_session.flush()

        return product, item, recipe_item

    return _create

@pytest.fixture
def customer_factory(db_session: AsyncSession):
    """ factory fixture that generates customers with given uuids """
    async def _create_customer(name: str, business_id: uuid.UUID | None = None):
        actual_business_id = business_id if business_id is not None else uuid.uuid4()
        customer = Customer(
                id = uuid.uuid4(),
                business_id = actual_business_id,
                name = name,
                phone = "+1 1111 1111"
        )

        db_session.add(customer)
        await db_session.flush()
        await db_session.refresh(customer)

        return customer
    return _create_customer 

@pytest.fixture
async def restock_factory(db_session: AsyncSession, item_factory):
    async def _create(
            business_id: uuid.UUID,
            restock_date: date = date(2026, 5, 5),
            supplier: str = "Test supplier", 
            notes: str = "Test restock", 
            quantity: Decimal = Decimal("3")
    ):
        item = await item_factory(business_id=business_id, name="Default Item")

        restock = Restock(
            id=uuid.uuid4(),
            business_id=business_id,
            restock_date=restock_date,
            supplier=supplier,
            notes=notes
        )
        db_session.add(restock)
        await db_session.flush()

        restock_item = RestockItem(
            id=uuid.uuid4(),
            restock_id=restock.id,
            item_id=item.id,
            quantity=quantity
        )
        db_session.add(restock_item)
        await db_session.flush()

        return restock, restock_item, item
    return _create

@pytest.fixture
async def price_history_factory(db_session: AsyncSession, product_factory):
    async def _create(
            business_id: uuid.UUID,
            product: Product | None = None,
            price: Decimal = Decimal("100"),
            valid_from: date = date(2025,5,4)
    ):
        if not product:
            product = await product_factory(business_id=business_id, name="Default product")

        assert product is not None

        price_history = PriceHistory(
                id=uuid.uuid4(), 
                product_id=product.id, 
                price=price, 
                valid_from=valid_from
        )

        db_session.add(price_history)
        await db_session.flush()

        return price_history, product
    return _create

@pytest.fixture
async def order_factory(db_session: AsyncSession, product_factory, price_history_factory, customer_factory): 
    """ factory for creating orders without items, DO NOT USED IF TESTING RESTOCK """
    async def _create(
            business_id: uuid.UUID,
            customer: Customer | None = None,
            product: Product | None = None,
            status: OrderStatus = OrderStatus.pending,
            quantity: int = 1
    ):
        if customer is None:
            customer = await customer_factory(business_id=business_id, name="Jose")

        if product is None:
            product = await product_factory(business_id=business_id, name="Pure")

        ph, _ = await price_history_factory(
            business_id=business_id,
            product=product,
            price=Decimal("150"),
            valid_from=date(2025, 2, 3)
        )

        assert customer is not None
        assert product is not None

        order = Order(
            id=uuid.uuid4(),
            business_id=business_id,
            customer_id=customer.id,
            status=status
        )
        db_session.add(order)
        await db_session.flush()

        order_item = OrderItem(
            id=uuid.uuid4(),
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=ph.price
        )
        db_session.add(order_item)
        await db_session.commit()
        await db_session.refresh(order)

        return order, order_item, customer, product

    return _create

# --- Object asserters ----

@pytest.fixture
async def assert_json_match_recipe_item():
    def _assert(recipe_item: RecipeItem, json_str):
        assert str(recipe_item.id) == json_str["id"]
        assert str(recipe_item.item_id) == json_str["item_id"]
        assert str(recipe_item.product_id) == json_str["product_id"]
        assert recipe_item.quantity == Decimal(json_str["quantity"])
        assert recipe_item.unit == json_str["unit"]
        
    return _assert

@pytest.fixture
def assert_json_match_item():
    def _assert(item: Item, json_str):
        assert json_str["name"] == item.name
        assert json_str["id"] == str(item.id)
        assert json_str["business_id"] == str(item.business_id)
        assert json_str["unit"] == item.unit
        assert Decimal(json_str["current_stock"]) == item.current_stock
        assert Decimal(json_str["low_stock_threshold"]) == item.low_stock_threshold
        assert json_str["notes"] == item.notes
    return _assert

@pytest.fixture
async def assert_json_match_restock():
    def _assert(restock: Restock, json_str):
        assert str(restock.restock_date) ==  json_str["restock_date"]
        assert restock.supplier == json_str["supplier"]
        assert restock.notes == json_str["notes"] 
        for (i, _) in enumerate(restock.restock_items):
            assert str(restock.restock_items[i].item_id) == json_str["restock_items"][i]["item_id"]
            assert restock.restock_items[i].quantity == Decimal(json_str["restock_items"][i]["quantity"])
 
    return _assert

@pytest.fixture
async def assert_json_match_order():
    def _assert(order: Order, json_str):
        assert str(order.id) ==  json_str["id"]
        assert str(order.business_id) ==  json_str["business_id"]
        assert str(order.customer_id) ==  json_str["customer_id"]
        assert order.status ==  json_str["status"]
        for (i, _) in enumerate(order.order_items):
            assert str(order.order_items[i].order_id) == json_str["order_items"][i]["order_id"]
            assert str(order.order_items[i].product_id) == json_str["order_items"][i]["product_id"]
            assert order.order_items[i].quantity == Decimal(json_str["order_items"][i]["quantity"])
 
    return _assert

def mock_auth_failure():
        raise HTTPException(status_code=401, detail="Invalid or expired token")

