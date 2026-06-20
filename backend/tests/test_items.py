from decimal import Decimal
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pytest
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Item 
from conftest import mock_auth_failure

# --- POST Tests --- 

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


@pytest.mark.asyncio
async def test_create_item(client: AsyncClient, db_session: AsyncSession, setup_business, assert_json_match_item):
    """ should create item for valid authorized client and update db """
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

    assert_json_match_item(db_item, data)

@pytest.mark.asyncio
async def test_create_item_without_note(client: AsyncClient, db_session: AsyncSession, setup_business, assert_json_match_item):
    """ should create item for valid authorized client and update db """

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
    
    assert_json_match_item(db_item, data)

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
async def test_get_items(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory, assert_json_match_item):
    """ should return all items from a business sorted alphabetically """
    
    i1 = await item_factory(
            business_id=setup_business.id, 
            name="Puerro",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = await item_factory(
            business_id=setup_business.id, 
            name="Cebolla",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
    )
    i3 = await item_factory(
            business_id=setup_business.id, 
            name="agua",
            unit="l",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
    )

    response = await client.get(
            "/items", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    # First should be agua, then cebolla, and last puerro
    items_sorted = [i3, i2, i1]

    for i, item_json in enumerate(data):
        assert_json_match_item(items_sorted[i], item_json)

@pytest.mark.asyncio
async def test_get_items_empty(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should return an empty list if no items logged for this business"""
    _ = await item_factory(business_id=uuid.uuid4(), name="Puerro")

    response = await client.get(
            "/items", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_items_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ shouldn't allow an unauthorized user to retrieve items"""
    app.dependency_overrides[get_current_business] = mock_auth_failure

    _= await item_factory(business_id=uuid.uuid4(), name="Puerro")

    response = await client.get(
            "/items", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_low_stock_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should only return low stock items from the business queried"""
    another_business_uuid = uuid.uuid4()
    _= await item_factory(
            business_id=another_business_uuid, 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    _= await item_factory(
            business_id=another_business_uuid, 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("2.3"),
            low_stock_threshold=Decimal("10"),
    )
    _ = await item_factory(
            business_id=another_business_uuid, 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
    )

    response = await client.get(
            "/items/low-stock", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_low_stock_empty(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should return empty if no items are below threshold"""
    _= await item_factory(
            business_id=setup_business.id, 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("19.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    _= await item_factory(
            business_id=setup_business.id, 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
    )
    _= await item_factory(
            business_id=setup_business.id, 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
    )

    response = await client.get(
            "/items/low-stock", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_low_stock(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory, assert_json_match_item):
    """ should return business items that are below threshold stock """
    i1 = await item_factory(
            business_id=setup_business.id, 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = await item_factory(
            business_id=setup_business.id, 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("2.3"),
            low_stock_threshold=Decimal("10"),
    )
    _= await item_factory(
            business_id=setup_business.id, 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
    )

    response = await client.get(
            "/items/low-stock", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    # Should return sorted
    assert_json_match_item(i1, data[1])
    assert_json_match_item(i2, data[0])


@pytest.mark.asyncio
async def test_get_low_stock_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override, item_factory):
    """ should't allow unauthorized client to query low stock items """
    
    _= await item_factory(
            business_id=uuid.uuid4(), 
            name="Perejil",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    _= await item_factory(
            business_id=uuid.uuid4(), 
            name="Cafe",
            unit="kg",
            current_stock=Decimal("2.3"),
            low_stock_threshold=Decimal("10"),
    )
    _= await item_factory(
            business_id=uuid.uuid4(), 
            name="Yapa",
            unit="kg",
            current_stock=Decimal("30.3"),
            low_stock_threshold=Decimal("2"),
    )

    response = await client.get("/items/low-stock")

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_item_by_id(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory, assert_json_match_item):
    """ should return an existing item of the business by id """
    i = await item_factory(
            business_id=setup_business.id, 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    _= await item_factory(
            business_id=setup_business.id, 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
    )

    response = await client.get(
            f"/items/{i.id}", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    assert_json_match_item(i, data)

@pytest.mark.asyncio
async def test_get_item_by_id_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should return 404 for a non-existing item of the business by id """
    _ = await item_factory(business_id=setup_business.id, name="Queso")

    response = await client.get(
            f"/items/{uuid.uuid4()}", 
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_item_by_id_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should return an existing item of the business by id """
    i = await item_factory(business_id=uuid.uuid4(), name="Queso")
    _= await item_factory(business_id=uuid.uuid4(), name="Leche")

    response = await client.get(
            f"/items/{i.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_item_by_id_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override, item_factory):
    """ should return an existing item of the business by id """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    i = await item_factory(business_id=uuid.uuid4(), name="Queso")

    response = await client.get(
            f"/items/{i.id}"
    )

    assert response.status_code == 401

# --- PATCH Test ---

@pytest.mark.asyncio
async def test_update_item(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should update existing item """
    i1 = await item_factory(
            business_id=setup_business.id, 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    i2 = await item_factory(
            business_id=setup_business.id, 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10"),
            notes=None
    )
    

    # Only change stock
    response = await client.patch(
            f"/items/{i1.id}",
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
            f"/items/{i1.id}",
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
async def test_update_item_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should notify trying to update non existing product """
    _ = await item_factory(business_id=setup_business.id, name="Queso")
    

    response = await client.patch(
            f"/items/{uuid.uuid4()}",
            json={
                "current_stock": "152.3"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should't allow item to update if the client isn't it that business """
    another_business_uuid = uuid.uuid4()
    i = await item_factory(business_id=another_business_uuid, name="Queso")
    
    response = await client.patch(
            f"/items/{i.id}",
            json={
                "current_stock": "152.3"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 404

    # Check no changes made to db
    result= await db_session.execute(
            select(Item).where(
                Item.id == i.id
            )
    )

    db_item = result.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == i.current_stock 

@pytest.mark.asyncio
async def test_update_item_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should't allow unauthorized client to update existing items """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    i = await item_factory(
            business_id=setup_business.id, 
            name="Queso",
            unit="kg",
            current_stock=Decimal("10.0"),
            low_stock_threshold=Decimal("15"),
            notes="Verde"
    )
    _ = await item_factory(
            business_id=setup_business.id, 
            name="Leche",
            unit="l",
            current_stock=Decimal("22.3"),
            low_stock_threshold=Decimal("10")
    )
    
    response = await client.patch(
            f"/items/{i.id}",
            json={
                "current_stock": "152.3"
            },
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 401

    # Check no changes made to db
    result= await db_session.execute(
            select(Item).where(
                Item.id == i.id
            )
    )

    db_item = result.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == i.current_stock 

# --- DELETE Tests ---

@pytest.mark.asyncio
async def test_delete_item(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should delete existing item and reflect on database """
    i = await item_factory(business_id=setup_business.id, name="Mani")
    

    response = await client.delete(
            f"/items/{i.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 204

    result = await db_session.execute(
            select(Item).where(
                Item.id == i.id
            )
    )

    db_item = result.scalar_one_or_none()
    assert db_item is None

@pytest.mark.asyncio
async def test_delete_item_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should notify trying to delete non existing item"""
    response = await client.delete(
            f"/items/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should't allow authenticated user to delete item from another business"""
    another_business_uuid = uuid.uuid4()
    i = await item_factory(business_id=another_business_uuid, name="Mani")    

    response = await client.delete(
            f"/items/{another_business_uuid}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Item).where(
                Item.id == i.id
            )
    )

    db_item = result.scalar_one_or_none()
    assert db_item is not None
    assert db_item == i

@pytest.mark.asyncio
async def test_delete_item_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override, item_factory):
    """ should't allow unauthenticated client to delete items"""
    app.dependency_overrides[get_current_business] = mock_auth_failure
    
    another_business_uuid = uuid.uuid4()
    i = await item_factory(business_id=another_business_uuid, name="Nuez")

    response = await client.delete(
            f"/items/{another_business_uuid}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(Item).where(
                Item.id == i.id 
            )
    )

    db_item = result.scalar_one_or_none()
    assert db_item is not None
    assert db_item == i


