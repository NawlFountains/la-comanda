from decimal import Decimal
import sys
import os 
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
from app.models import Business, Product, Item, RecipeItem, Customer
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
    async def _create(business_id: uuid.UUID, name: str):
        item = Item(
                id = uuid.uuid4(),
                business_id = business_id,
                name = name,
                unit = "kg",
                current_stock = Decimal("10"),
                low_stock_threshold = Decimal("2")
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
async def assert_json_match_recipe_item():
    def _assert(recipe_item: RecipeItem, json_str):
        assert str(recipe_item.id) == json_str["id"]
        assert str(recipe_item.item_id) == json_str["item_id"]
        assert str(recipe_item.product_id) == json_str["product_id"]
        assert recipe_item.quantity == Decimal(json_str["quantity"])
        assert recipe_item.unit == json_str["unit"]
        
    return _assert

def mock_auth_failure():
        raise HTTPException(status_code=401, detail="Invalid or expired token")
