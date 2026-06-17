import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from httpx import AsyncClient
from fastapi import HTTPException
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Business, Product, PriceHistory
from datetime import date
from decimal import Decimal

# Fixtures

@pytest.fixture
def cleanup_override():
    yield
    app.dependency_overrides.clear()

def mock_auth_failure():
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@pytest.fixture
async def setup_business(db_session: AsyncSession):
    fake_business = Business(id=uuid.uuid4(), user_id=uuid.uuid4(),name="Test")
    db_session.add(fake_business)
    await db_session.commit()
    await db_session.refresh(fake_business)

    app.dependency_overrides[get_current_business] = lambda: fake_business
    yield fake_business
    app.dependency_overrides.clear()

# Tests 

# --- POST Tests --- 

@pytest.mark.asyncio
async def test_create_product_price(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should be able to add prices to existing business products, reflecting on the database """
    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid, business_id=setup_business.id, name="Papa")
    db_session.add(p)
    await db_session.commit()

    response = await client.post(
            f"/products/{product_uuid}/prices",
            json={"price": 1000.23, "valid_from": "2026-06-17"},
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 201
    data = response.json()

    # Json field are string
    assert data["product_id"] == str(product_uuid)
    assert Decimal(data["price"]) == Decimal("1000.23")
    assert data["valid_from"] == "2026-06-17"
    assert "id" in data 

    result = await db_session.execute(
            select(PriceHistory).where(
                    PriceHistory.product_id == product_uuid
                )
    )
    db_price = result.scalar_one_or_none()

    # Straight from db we have to format it to the correct type to test
    assert db_price is not None
    assert db_price.price == Decimal("1000.23")
    assert db_price.valid_from == date(2026,6,17)
    assert db_price.product_id == product_uuid

@pytest.mark.asyncio
async def test_create_product_price_non_existing_product(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ shouldn't be able to create prices for a non-existing product """
    expected_business_id = setup_business.id
    p = Product(id=uuid.uuid4(), business_id=expected_business_id, name="Cebolla")
    db_session.add(p)
    await db_session.commit()

    response = await client.post(
            f"/products/{uuid.uuid4()}/prices",
            json={"price": 2000.23, "valid_from": "2026-06-17"},
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_create_product_price_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should't be able to create prices if unauthorized """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    expected_business_id = setup_business.id
    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid, business_id=expected_business_id, name="Cebolla")
    db_session.add(p)
    await db_session.commit()

    response = await client.post(
            f"/products/{product_uuid}/prices",
            json={"price": 2000.23, "valid_from": "2026-06-17"},
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(PriceHistory).where(
                    PriceHistory.product_id == product_uuid
                )
    )
    db_price = result.scalar_one_or_none()

    assert db_price is None

@pytest.mark.asyncio
async def test_create_product_price_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ shouldn't be able to add prices to another business products """
    fake_business = Business(id=uuid.uuid4(), user_id=uuid.uuid4(),name="Another Business")
    db_session.add(fake_business)
    await db_session.commit()
    await db_session.refresh(fake_business)

    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid, business_id=fake_business.id, name="Cebolla Deluxe")
    db_session.add(p)
    await db_session.commit()

    response = await client.post(
            f"/products/{product_uuid}/prices",
            json={"price": 500.02, "valid_from": "2026-06-17"},
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(PriceHistory).where(
                    PriceHistory.product_id == product_uuid
                )
    )
    db_price = result.scalar_one_or_none()

    assert db_price is None

# --- GET Tests ---

@pytest.mark.asyncio
async def test_get_prices(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return all prices for a given product in the business """
    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid, business_id=setup_business.id, name="Palta")
    db_session.add(p)
    await db_session.commit()

    price_one = PriceHistory(id=uuid.uuid4(), product_id=product_uuid, price=Decimal("100.5"), valid_from=date(2026,1,1))
    price_two= PriceHistory(id=uuid.uuid4(), product_id=product_uuid, price=Decimal("150"), valid_from=date(2026,2,5))

    db_session.add_all([price_one, price_two])
    await db_session.commit()

    response = await client.get(f"/products/{product_uuid}/prices")

    assert response.status_code == 200
    
    data = response.json()

    assert len(data) == 2

    # Endpoints return from most recent price
    assert data[0]["product_id"] == str(product_uuid)
    assert Decimal(data[0]["price"]) == Decimal("150")
    assert data[0]["valid_from"] == "2026-02-05"

    assert data[1]["product_id"] == str(product_uuid)
    assert Decimal(data[1]["price"]) == Decimal("100.5")
    assert data[1]["valid_from"] == "2026-01-01"


@pytest.mark.asyncio
async def test_get_prices_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return empty json for a existing product without prices """
    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid, business_id=setup_business.id, name="Palta")
    db_session.add(p)
    await db_session.commit()

    response = await client.get(f"/products/{product_uuid}/prices")

    assert response.status_code == 200
    
    data = response.json()

    assert data == []

@pytest.mark.asyncio
async def test_get_prices_non_existing_product(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return product not found when trying to get a price of a non existing product"""
    response = await client.get(f"/products/{uuid.uuid4()}/prices")

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_prices_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return product not found when trying to get a price of an existing product but from another business"""
    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid, business_id=uuid.uuid4(), name="Palta Premium")
    db_session.add(p)
    await db_session.commit()

    response = await client.get(f"/products/{product_uuid}/prices")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_prices_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ shouldn't be able to query prices if unauthorized"""
    app.dependency_overrides[get_current_business] = mock_auth_failure

    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid, business_id=uuid.uuid4(), name="Palta")
    db_session.add(p)
    await db_session.commit()

    response = await client.get(f"/products/{product_uuid}/prices")

    assert response.status_code == 401

