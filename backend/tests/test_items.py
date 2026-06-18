from decimal import Decimal
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pytest
from httpx import AsyncClient
from fastapi import HTTPException
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Business, Item 

# Fixtures

def mock_auth_failure():
        raise HTTPException(status_code=401, detail="Invalid or expired token")

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

# Tests 

# --- POST Tests --- 

@pytest.mark.asyncio
async def test_create_item(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should create item for valid authorized client and update db """
    expected_business_id = setup_business.id

    response = await client.post(
            "/items",
            json={
                "name": "Azucar",
                "unit": "kg",
                "current_stock": 15,
                "low_stock_threshold": 2,
                "notes": "Ledesma"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201
    data = response.json()
    
    assert data["name"] == "Azucar"
    assert data["unit"] == "kg"
    assert Decimal(data["current_stock"]) == Decimal("15")
    assert Decimal(data["low_stock_threshold"]) == Decimal("2")
    assert data["notes"] == "Ledesma"
    assert "id" in data 

    item_uuid = uuid.UUID(data["id"])
    result = await db_session.execute(
            select(Item).where(
                    Item.id == item_uuid
                )
    )
    db_item= result.scalar_one_or_none()

    assert db_item is not None
    assert str(db_item.id) == data["id"]
    assert db_item.business_id == expected_business_id
    assert db_item.name == "Azucar"
    assert db_item.unit == "kg"
    assert db_item.current_stock == Decimal("15")
    assert db_item.low_stock_threshold == Decimal("2")
    assert db_item.notes == "Ledesma"

@pytest.mark.asyncio
async def test_create_item_without_note(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should create item for valid authorized client and update db """
    expected_business_id = setup_business.id

    response = await client.post(
            "/items",
            json={
                "name": "Peperina",
                "unit": "kg",
                "current_stock": 15,
                "low_stock_threshold": 2
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201
    data = response.json()
    
    assert data["name"] == "Peperina"
    assert data["unit"] == "kg"
    assert Decimal(data["current_stock"]) == Decimal("15")
    assert Decimal(data["low_stock_threshold"]) == Decimal("2")
    assert data["notes"] == None
    assert "id" in data 

    item_uuid = uuid.UUID(data["id"])
    result = await db_session.execute(
            select(Item).where(
                    Item.id == item_uuid
                )
    )
    db_item= result.scalar_one_or_none()

    assert db_item is not None
    assert str(db_item.id) == data["id"]
    assert db_item.name == "Peperina"
    assert db_item.unit == "kg"
    assert db_item.current_stock == Decimal("15")
    assert db_item.low_stock_threshold == Decimal("2")
    assert db_item.notes == None
    assert db_item.business_id == expected_business_id



@pytest.mark.asyncio
async def test_create_item_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ shouldn't allow unauthorized users to create items for a business or update the db """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    response = await client.post(
            "/items",
            json={
                "name": "Pimienta",
                "unit": "kg",
                "current_stock": 15,
                "low_stock_threshold": 2,
                "notes": "Ledesma"
            }
    )

    assert response.status_code == 401
    
    result = await db_session.execute(
            select(Item).where(
                Item.name ==  "Pimienta"
                )
            )
    db_item= result.scalar_one_or_none()

    assert db_item is None

@pytest.mark.asyncio
async def test_create_item_missing_input(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ shouldn't allow users to create items missing required input (all of them besides notes)"""

    # Missing unit
    response = await client.post(
            "/items",
            json={
                "name": "Pimienta",
                "current_stock": 15,
                "low_stock_threshold": 2,
                "notes": "Ledesma"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422
    
    result = await db_session.execute(
            select(Item).where(
                Item.name ==  "Pimienta"
                )
            )
    db_item= result.scalar_one_or_none()

    assert db_item is None

    # Missing current_stock 
    response = await client.post(
            "/items",
            json={
                "name": "Pimienta",
                "unit": "kg",
                "low_stock_threshold": 2,
                "notes": "Ledesma"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422
    
    result = await db_session.execute(
            select(Item).where(
                Item.name ==  "Pimienta"
                )
            )
    db_item= result.scalar_one_or_none()

    assert db_item is None

    # Missing low_stock_threshold 
    response = await client.post(
            "/items",
            json={
                "name": "Pimienta",
                "unit": "kg",
                "current_stock": 15,
                # "low_stock_threshold": 2,
                "notes": "Ledesma"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422
    
    result = await db_session.execute(
            select(Item).where(
                Item.name ==  "Pimienta"
                )
            )
    db_item= result.scalar_one_or_none()

    assert db_item is None

# --- GET Test ---

@pytest.mark.asyncio
async def test_get_items(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return all items from a business sorted alphabetically """
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Puerro",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Cebolla",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    i3 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="agua",
            unit="l",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
            notes=None
    )
 
    db_session.add_all([i1, i2, i3])

    await db_session.commit()

    response = await client.get(
            "/items", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    # First should be agua, then cebolla, and last puerro
    items_sorted = [i3, i2, i1]

    for i, item in enumerate(data):
        assert item["name"] == items_sorted[i].name
        assert item["id"] == str(items_sorted[i].id)
        assert item["business_id"] == str(items_sorted[i].business_id)
        assert item["unit"] == items_sorted[i].unit
        assert Decimal(item["current_stock"]) == items_sorted[i].current_stock
        assert Decimal(item["low_stock_threshold"]) == items_sorted[i].low_stock_threshold
        assert item["notes"] == items_sorted[i].notes

@pytest.mark.asyncio
async def test_get_items_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return an empty list if no items logged for this business"""
    i1 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Puerro",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    db_session.add(i1)

    await db_session.commit()

    response = await client.get(
            "/items", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_items_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ shouldn't allow an unauthorized user to retrieve items"""
    app.dependency_overrides[get_current_business] = mock_auth_failure

    i1 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Puerro",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    db_session.add(i1)

    await db_session.commit()

    response = await client.get(
            "/items", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_low_stock_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should only return low stock items from the business queried"""
    another_business_uuid = uuid.uuid4()
    i1 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid, 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid, 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("2.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    i3 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid, 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
            notes=None
    )
 
    db_session.add_all([i1, i2, i3])

    await db_session.commit()

    response = await client.get(
            "/items/low-stock", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_low_stock_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return empty if no items are below threshold"""
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("19.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    i3 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
            notes=None
    )
 
    db_session.add_all([i1, i2, i3])

    await db_session.commit()

    response = await client.get(
            "/items/low-stock", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_low_stock(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return business items that are below threshold stock """
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("2.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    i3 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
            notes=None
    )
 
    db_session.add_all([i1, i2, i3])

    await db_session.commit()

    response = await client.get(
            "/items/low-stock", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()


@pytest.mark.asyncio
async def test_get_low_stock_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ should't allow unauthorized client to query low stock items """
    
    i1 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("2.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    i3 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
            notes=None
    )
 
    db_session.add_all([i1, i2, i3])

    await db_session.commit()

    response = await client.get("/items/low-stock")

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_item_by_id(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return an existing item of the business by id """
    item_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=setup_business.id, 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.get(
            f"/items/{item_uuid}", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    assert data["name"] == i1.name
    assert data["id"] == str(i1.id)
    assert data["business_id"] == str(i1.business_id)
    assert data["unit"] == i1.unit
    assert Decimal(data["current_stock"]) == i1.current_stock
    assert Decimal(data["low_stock_threshold"]) == i1.low_stock_threshold
    assert data["notes"] == i1.notes

@pytest.mark.asyncio
async def test_get_item_by_id_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return an existing item of the business by id """
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.get(
            f"/items/{uuid.uuid4()}", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_item_by_id_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return an existing item of the business by id """
    item_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=uuid.uuid4(), 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.get(
            f"/items/{item_uuid}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_item_by_id_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ should return an existing item of the business by id """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    item_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=uuid.uuid4(), 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.get(
            f"/items/{item_uuid}"
    )

    assert response.status_code == 401

# --- PATCH Test ---

@pytest.mark.asyncio
async def test_update_item(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should update existing item """
    item_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=setup_business.id, 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    # Only change stock
    response = await client.patch(
            f"/items/{item_uuid}",
            json={
                "current_stock": "152.3"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()

    assert Decimal(data["current_stock"]) == Decimal("152.3")

    response = await db_session.execute(
            select(Item).where(
                    Item.id == i1.id
                )
    )
    db_item = response.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == Decimal("152.3")

    # Only change low_stock_threshold and notes
    response = await client.patch(
            f"/items/{item_uuid}",
            json={
                "low_stock_threshold": "0.3",
                "notes": "NewNote"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()

    assert Decimal(data["current_stock"]) == Decimal("152.3")

    response = await db_session.execute(
            select(Item).where(
                    Item.id == i1.id
                )
    )
    db_item = response.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == Decimal("152.3")
    assert db_item.low_stock_threshold == Decimal("0.3")
    assert db_item.notes == "NewNote" 

@pytest.mark.asyncio
async def test_update_item_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should notify trying to update non existing product """
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.patch(
            f"/items/{uuid.uuid4()}",
            json={
                "current_stock": "152.3"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should't allow item to update if the client isn't it that business """
    item_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=uuid.uuid4(), 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.patch(
            f"/items/{item_uuid}",
            json={
                "current_stock": "152.3"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 404

    # Check no changes made to db
    result= await db_session.execute(
            select(Item).where(
                Item.id == i1.id
            )
    )

    db_item = result.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == Decimal("10.0")

@pytest.mark.asyncio
async def test_update_item_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ should't allow unauthorized client to update existing items """

    item_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=uuid.uuid4(), 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(), 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.patch(
            f"/items/{item_uuid}",
            json={
                "current_stock": "152.3"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 401

    # Check no changes made to db
    result= await db_session.execute(
            select(Item).where(
                Item.id == i1.id
            )
    )

    db_item = result.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == Decimal("10.0")

# --- DELETE Tests ---

@pytest.mark.asyncio
async def test_delete_item(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should delete existing item and reflect on database """
    item_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=setup_business.id, 
            name="Mani",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Nuez",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.delete(
            f"/items/{item_uuid}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 204

    result = await db_session.execute(
            select(Item).where(
                Item.id == item_uuid
            )
    )

    db_item = result.scalar_one_or_none()
    assert db_item is None

@pytest.mark.asyncio
async def test_delete_item_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should notify trying to delete non existing item"""
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Mani",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id, 
            name="Nuez",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.delete(
            f"/items/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should't allow authenticated user to delete item from another business"""
    item_uuid = uuid.uuid4()
    another_business_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=another_business_uuid, 
            name="Mani",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid, 
            name="Nuez",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.delete(
            f"/items/{another_business_uuid}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Item).where(
                Item.id == item_uuid
            )
    )

    db_item = result.scalar_one_or_none()
    assert db_item is not None
    assert db_item == i1

@pytest.mark.asyncio
async def test_delete_item_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ should't allow unauthenticated client to delete items"""
    app.dependency_overrides[get_current_business] = mock_auth_failure

    item_uuid = uuid.uuid4()
    another_business_uuid = uuid.uuid4()
    i1 = Item(
            id=item_uuid,
            business_id=another_business_uuid, 
            name="Mani",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid, 
            name="Nuez",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    
    db_session.add_all([i1, i2])

    await db_session.commit()

    response = await client.delete(
            f"/items/{another_business_uuid}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(Item).where(
                Item.id == item_uuid
            )
    )

    db_item = result.scalar_one_or_none()
    assert db_item is not None
    assert db_item == i1


