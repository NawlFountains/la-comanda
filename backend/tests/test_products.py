import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pytest
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Business, Product
from conftest import mock_auth_failure

# --- POST Tests --- 

@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, db_session: AsyncSession, setup_business):
    expected_business_id = setup_business.id
    response = await client.post(
            "/products",
            json={"name": "Milanesa"},
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Milanesa"
    assert "id" in data 

    product_uuid = uuid.UUID(data["id"])
    result = await db_session.execute(
            select(Product).where(
                    Product.id == product_uuid
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is not None
    assert db_product.name == "Milanesa"
    assert db_product.business_id == expected_business_id

@pytest.mark.asyncio
async def test_create_product_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    app.dependency_overrides[get_current_business] = mock_auth_failure
    
    response = await client.post("/products", json={"name": "Pan"})
    assert response.status_code == 401

    result = await db_session.execute(
            select(Product).where(
                    Product.name == "Pan"
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is None

# --- GET Tests ---

@pytest.mark.asyncio
async def test_get_products(client: AsyncClient, db_session: AsyncSession, setup_business):
    p1 = Product(id=uuid.uuid4(), business_id=setup_business.id, name="Milanesa")
    p2 = Product(id=uuid.uuid4(), business_id=setup_business.id, name="Pure")
    db_session.add_all([p1,p2])
    await db_session.commit()

    response = await client.get("/products")
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["name"] == "Milanesa"
    assert data[1]["name"] == "Pure"


@pytest.mark.asyncio
async def test_get_products_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    response = await client.get("/products")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_products_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    fake_business = Business(id=uuid.uuid4(), user_id=uuid.uuid4(),name="Another Fake Business")
    db_session.add(fake_business)
    await db_session.commit()
    await db_session.refresh(fake_business)

    test_product_id = uuid.uuid4()
    p1 = Product(id=test_product_id, business_id=fake_business.id, name="Milanesa")
    p2 = Product(id=uuid.uuid4(), business_id=fake_business.id, name="Pure")
    db_session.add_all([p1,p2])
    await db_session.commit()

    response= await client.get(f"/products")

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_products_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    app.dependency_overrides[get_current_business] = mock_auth_failure
    p1 = Product(id=uuid.uuid4(), business_id=uuid.uuid4(), name="Milanesa")
    db_session.add(p1)
    await db_session.commit()

    response = await client.get("/products")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_product_by_id_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    test_product_id = uuid.uuid4()
    p1 = Product(id=test_product_id, business_id=setup_business.id, name="Milanesa")
    p2 = Product(id=uuid.uuid4(), business_id=setup_business.id, name="Pure")
    db_session.add_all([p1,p2])
    await db_session.commit()

    response= await client.get(f"/products/{test_product_id}")

    assert response.status_code == 200
    assert response.json()["name"] == "Milanesa"

@pytest.mark.asyncio
async def test_get_product_by_id_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    p1 = Product(id=uuid.uuid4(), business_id=setup_business.id, name="Milanesa")
    p2 = Product(id=uuid.uuid4(), business_id=setup_business.id, name="Pure")
    db_session.add_all([p1,p2])
    await db_session.commit()

    response= await client.get(f"/products/{uuid.uuid4()}")

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_product_by_id_from_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    fake_business = Business(id=uuid.uuid4(), user_id=uuid.uuid4(),name="Another Fake Business")
    db_session.add(fake_business)
    await db_session.commit()
    await db_session.refresh(fake_business)

    test_product_id = uuid.uuid4()
    p1 = Product(id=test_product_id, business_id=fake_business.id, name="Milanesa")
    p2 = Product(id=uuid.uuid4(), business_id=fake_business.id, name="Pure")
    db_session.add_all([p1,p2])
    await db_session.commit()

    response= await client.get(f"/products/{test_product_id}")

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_product_by_id_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    app.dependency_overrides[get_current_business] = mock_auth_failure
    test_product_id = uuid.uuid4()
    p = Product(id=test_product_id, business_id=uuid.uuid4(), name="Milanesa")
    db_session.add(p)
    await db_session.commit()

    response= await client.get(f"/products/{test_product_id}")

    assert response.status_code == 401

# --- PATCH Tests ---

@pytest.mark.asyncio
async def test_patch_product_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    expected_business_id = setup_business.id
    test_product_id = uuid.uuid4()
    p = Product(id=test_product_id, business_id=setup_business.id, name="Milanesa")
    db_session.add(p)
    await db_session.commit()

    response= await client.patch(
            f"/products/{test_product_id}",
            json={"name": "Bife"},
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Bife"

    product_uuid = uuid.UUID(data["id"])
    result = await db_session.execute(
            select(Product).where(
                    Product.id == product_uuid
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is not None
    assert db_product.name == "Bife"
    assert db_product.business_id == expected_business_id

@pytest.mark.asyncio
async def test_patch_product_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    expected_business_id = setup_business.id
    product_id = uuid.uuid4()
    p = Product(id=product_id, business_id=setup_business.id, name="Milanesa")
    db_session.add(p)
    await db_session.commit()

    response= await client.patch(
            f"/products/{uuid.uuid4()}",
            json={"name": "Bife"},
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Product).where(
                    Product.id == product_id
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is not None
    assert db_product.name == "Milanesa"
    assert db_product.business_id == expected_business_id

@pytest.mark.asyncio
async def test_patch_product_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    fake_business = Business(id=uuid.uuid4(), user_id=uuid.uuid4(),name="Another Fake Business")
    db_session.add(fake_business)
    await db_session.commit()
    await db_session.refresh(fake_business)

    test_product_id = uuid.uuid4()
    p = Product(id=test_product_id, business_id=fake_business.id, name="Milanesa")
    db_session.add(p)
    await db_session.commit()

    response= await client.patch(
            f"/products/{test_product_id}",
            json={"name": "Bife"},
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Product).where(
                    Product.id == test_product_id
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is not None
    assert db_product.name == "Milanesa"
    assert db_product.business_id == fake_business.id

# --- DELETE Test ---

@pytest.mark.asyncio
async def test_delete_product(client: AsyncClient, db_session: AsyncSession, setup_business):
    test_product_id = uuid.uuid4()
    p = Product(id=test_product_id, business_id=setup_business.id, name="Milanesa")
    db_session.add(p)
    await db_session.commit()

    response= await client.delete(
            f"/products/{test_product_id}"
    )

    assert response.status_code == 204

    result = await db_session.execute(
            select(Product).where(
                    Product.id == test_product_id
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is None

@pytest.mark.asyncio
async def test_delete_product_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    app.dependency_overrides[get_current_business] = mock_auth_failure
    test_product_id = uuid.uuid4()
    p = Product(id=test_product_id, business_id=uuid.uuid4(), name="Milanesa")
    db_session.add(p)
    await db_session.commit()

    response= await client.delete(
            f"/products/{test_product_id}"
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(Product).where(
                    Product.id == test_product_id
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is not None
    assert db_product.name == "Milanesa"

@pytest.mark.asyncio
async def test_delete_product_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid , business_id=setup_business.id, name="Milanesa")
    db_session.add(p)
    await db_session.commit()


    response= await client.delete(
            f"/products/{uuid.uuid4()}"
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Product).where(
                    Product.id == product_uuid
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is not None

@pytest.mark.asyncio
async def test_delete_product_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    fake_business = Business(id=uuid.uuid4(), user_id=uuid.uuid4(),name="Another Fake Business")
    db_session.add(fake_business)
    await db_session.commit()
    await db_session.refresh(fake_business)

    product_uuid = uuid.uuid4()
    p = Product(id=product_uuid , business_id=fake_business.id, name="Milanesa")
    db_session.add(p)
    await db_session.commit()


    response= await client.delete(
            f"/products/{product_uuid}"
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Product).where(
                    Product.id == product_uuid
                )
    )
    db_product = result.scalar_one_or_none()

    assert db_product is not None
