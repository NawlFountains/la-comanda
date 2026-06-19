import uuid
from app.models.item import Item
from app.models.restock_item import RestockItem
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from httpx import AsyncClient
from fastapi import HTTPException
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Business, Restock
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

@pytest.fixture
async def setup_item(db_session: AsyncSession, setup_business):
    item = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id,
            name="Papas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    db_session.add(item)
    await db_session.commit()
    yield item

@pytest.fixture
async def setup_item_another_business(db_session: AsyncSession):
    item = Item(
            id=uuid.uuid4(),
            business_id=uuid.uuid4(),
            name="Leche",
            unit="l",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    db_session.add(item)
    await db_session.commit()
    yield item

@pytest.fixture
async def setup_restock(db_session: AsyncSession, setup_business, setup_item):
    restock = Restock(
        id=uuid.uuid4(),
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="Test supplier",
        notes="Test restock"
    )
    db_session.add(restock)
    await db_session.flush()

    restock_item = RestockItem(
        id=uuid.uuid4(),
        restock_id=restock.id,
        item_id=setup_item.id,
        quantity=Decimal("3")
    )
    db_session.add(restock_item)
    await db_session.commit()
    await db_session.refresh(restock)
    yield restock

# Tests

# --- POST Test ---

@pytest.mark.asyncio
async def test_create_restock(client: AsyncClient, db_session: AsyncSession, setup_business, setup_item):
    """ should be able to create a restock with items, reflecting on database """

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "Coto",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(setup_item.id),
                        "quantity": 3
                        }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201
    data = response.json()

    assert data["restock_date"] == "2026-05-05"
    assert data["supplier"] == "Coto"
    assert data["notes"] == "No notes"
    assert data["business_id"] == str(setup_business.id)

    assert data["restock_items"] != []
    assert data["restock_items"][0]["item_id"] == str(setup_item.id)
    assert data["restock_items"][0]["quantity"] == "3"

    assert "id" in data

    restock_uuid = uuid.UUID(data["id"])

    # Should reflect on database

    result = await db_session.execute(
            select(Restock)
            .where(
                Restock.id == restock_uuid,
                Restock.business_id == setup_business.id
            )
            .options(selectinload(Restock.restock_items))
    )

    db_restock = result.scalar_one_or_none()

    assert db_restock is not None

    assert db_restock.restock_items != []
    assert db_restock.restock_date == date(2026, 5, 5)
    assert db_restock.supplier == "Coto"
    assert db_restock.notes == "No notes"
    assert db_restock.restock_items[0].item_id == setup_item.id
    assert db_restock.restock_items[0].quantity == Decimal("3") 
    
@pytest.mark.asyncio
async def test_create_restock_non_existing_item(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ shouldn't be able to create a restock with items from another business """

    item_uuid = uuid.uuid4()

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "SupSup",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(item_uuid),
                        "quantity": 3
                        }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    # Should't reflect on database

    result = await db_session.execute(
            select(Restock)
            .where(
                Restock.business_id == setup_business.id
            )
            .options(selectinload(Restock.restock_items))
    )

    db_restock = result.scalar_one_or_none()

    assert db_restock is None

    result = await db_session.execute(
            select(RestockItem)
            .where(
                RestockItem.item_id == item_uuid 
            )
    )

    db_restock_item = result.scalar_one_or_none()

    assert db_restock_item is None

@pytest.mark.asyncio
async def test_create_restock_existing_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, setup_item_another_business):
    """ shouldn't be able to create a restock with items from another business """

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "SupSup",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(setup_item_another_business.id),
                        "quantity": 3
                        }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    # Should't reflect on database

    result = await db_session.execute(
            select(Restock)
            .where(
                Restock.supplier == "SupSup"
            )
            .options(selectinload(Restock.restock_items))
    )

    db_restock = result.scalar_one_or_none()

    assert db_restock is None

    result = await db_session.execute(
            select(RestockItem)
            .where(
                RestockItem.item_id == setup_item_another_business.id
            )
    )

    db_restock_item = result.scalar_one_or_none()

    assert db_restock_item is None
 
@pytest.mark.asyncio
async def test_create_restock_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override, setup_item_another_business):
    """ shouldn't allow unauthorized client to create restocks """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "Anonima",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(setup_item_another_business.id),
                        "quantity": 3
                        }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

    # Should reflect on database

    result = await db_session.execute(
            select(Restock)
            .where(
                Restock.supplier == "Anonima"
            )
            .options(selectinload(Restock.restock_items))
    )

    db_restock = result.scalar_one_or_none()

    assert db_restock is None

@pytest.mark.asyncio
async def test_create_restock_incomplete_input_optional(client: AsyncClient, db_session: AsyncSession, setup_business, setup_item):
    """ should allow restock creation if optional input it's not given """

    # Missing supplier and notes
    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-03-03",
                "restock_items": [
                    {
                        "item_id": str(setup_item.id),
                        "quantity": 3
                        }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["restock_date"] == "2026-03-03"
    assert data["supplier"] == None
    assert data["notes"] == None
    assert data["restock_items"] != []
    assert data["restock_items"][0]["item_id"] == str(setup_item.id)
    assert data["restock_items"][0]["quantity"] == "3"
    assert "id" in data

    restock_uuid = uuid.UUID(data["id"])

    # Should reflect on database

    result = await db_session.execute(
            select(Restock)
            .where(
                Restock.id == restock_uuid,
               Restock.business_id == setup_business.id 
            )
            .options(selectinload(Restock.restock_items))
    )

    db_restock = result.scalar_one_or_none()

    assert db_restock is not None
    assert db_restock.restock_date == date(2026, 3, 3)
    assert db_restock.supplier == None
    assert db_restock.notes == None
    assert db_restock.restock_items != []
    assert db_restock.restock_items[0].item_id == setup_item.id
    assert db_restock.restock_items[0].quantity == Decimal("3")

@pytest.mark.asyncio
async def test_create_restock_incomplete_input_mandatory(client: AsyncClient, db_session: AsyncSession, setup_business, setup_item):
    """ should throw 422 if mandatory input isn't given """

    # Missing restock date
    response = await client.post(
            "/restocks",
            json={
                "supplier": "Anonima",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(setup_item.id),
                        "quantity": 3
                        }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    # Missing restock items
    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-01-01",
                "supplier": "Anonima",
                "notes": "No notes",
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    # Should reflect on database

    result = await db_session.execute(
            select(Restock)
            .where(
                Restock.supplier == "Anonima"
            )
            .options(selectinload(Restock.restock_items))
    )

    db_restock = result.scalar_one_or_none()

    assert db_restock is None

# --- GET Test ---

@pytest.mark.asyncio
async def test_get_restocks(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return all restocks from the current business sorted by the most recent """
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id,
            name="Papas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id,
            name="Pepas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    db_session.add_all([i1, i2])
    await db_session.commit()

    r1= Restock(
        id=uuid.uuid4(),
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock"
    )

    r2= Restock(
        id=uuid.uuid4(),
        business_id=setup_business.id,
        restock_date=date(2026, 6, 5),
        supplier="WallMock",
        notes="Test restock"
    )
    db_session.add_all([r1, r2])
    await db_session.flush()

    ri1= RestockItem(
        id=uuid.uuid4(),
        restock_id=r1.id,
        item_id=i1.id,
        quantity=Decimal("3")
    )

    ri2= RestockItem(
        id=uuid.uuid4(),
        restock_id=r2.id,
        item_id=i2.id,
        quantity=Decimal("5")
    )

    db_session.add_all([ri1, ri2])
    await db_session.commit()

    response = await client.get(
            "/restocks", 
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["id"] == str(r2.id)
    assert data[1]["id"] == str(r1.id)

    assert len(data[0]["restock_items"]) == 1
    assert data[0]["restock_items"][0]["id"] == str(ri2.id)
    assert data[0]["restock_items"][0]["item_id"] == str(i2.id)
    assert data[0]["restock_items"][0]["quantity"] == str(ri2.quantity)

    assert len(data[1]["restock_items"]) == 1
    assert data[1]["restock_items"][0]["id"] == str(ri1.id)
    assert data[1]["restock_items"][0]["item_id"] == str(i1.id)
    assert data[1]["restock_items"][0]["quantity"] == str(ri1.quantity)

@pytest.mark.asyncio
async def test_get_restocks_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return empty list if no restocks logged for said business """
    response = await client.get("/restocks", headers={"Authorization": "Bearer faketoken"})

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_restocks_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should only return the stocks asocciated with the client business"""
    another_business_uuid = uuid.uuid4()
    i1 = Item(
            id=uuid.uuid4(),
            business_id=setup_business.id,
            name="Papas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid,
            name="Pepas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    db_session.add_all([i1, i2])
    await db_session.commit()

    r1= Restock(
        id=uuid.uuid4(),
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock"
    )

    r2= Restock(
        id=uuid.uuid4(),
        business_id=another_business_uuid,
        restock_date=date(2026, 6, 5),
        supplier="WallMock",
        notes="Test restock"
    )
    db_session.add_all([r1, r2])
    await db_session.flush()

    ri1= RestockItem(
        id=uuid.uuid4(),
        restock_id=r1.id,
        item_id=i1.id,
        quantity=Decimal("3")
    )

    ri2= RestockItem(
        id=uuid.uuid4(),
        restock_id=r2.id,
        item_id=i2.id,
        quantity=Decimal("5")
    )

    db_session.add_all([ri1, ri2])
    await db_session.commit()

    response = await client.get("/restocks")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == str(r1.id)
    assert data[0]["business_id"] == str(setup_business.id)


@pytest.mark.asyncio
async def test_get_restocks_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override):
    """ should return empty list if no restocks logged for said business """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    another_business_uuid = uuid.uuid4()
    i1 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid,
            name="Papas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    i2 = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid,
            name="Pepas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    db_session.add_all([i1, i2])
    await db_session.commit()

    r1= Restock(
        id=uuid.uuid4(),
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock"
    )

    r2= Restock(
        id=uuid.uuid4(),
        business_id=another_business_uuid,
        restock_date=date(2026, 6, 5),
        supplier="WallMock",
        notes="Test restock"
    )
    db_session.add_all([r1, r2])
    await db_session.flush()

    ri1= RestockItem(
        id=uuid.uuid4(),
        restock_id=r1.id,
        item_id=i1.id,
        quantity=Decimal("3")
    )

    ri2= RestockItem(
        id=uuid.uuid4(),
        restock_id=r2.id,
        item_id=i2.id,
        quantity=Decimal("5")
    )

    db_session.add_all([ri1, ri2])
    await db_session.commit()

    response = await client.get("/restocks")

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_restock_by_id(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ should return exsting restock in business if queried by id """
    response = await client.get(
            f"/restocks/{setup_restock.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == str(setup_restock.id)
    assert data["business_id"] == str(setup_business.id)
    assert data["restock_items"][0]["id"] == str(setup_restock.restock_items[0].id)

@pytest.mark.asyncio
async def test_get_restock_by_id_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return exsting restock in business if queried by id """
    response = await client.get(
            f"/restocks/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_restock_by_id_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return 404 for exsting restock but linked to another business """
    another_business_uuid = uuid.uuid4()

    item = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid,
            name="Papas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    db_session.add(item)
    await db_session.commit()

    restock_uuid = uuid.uuid4()
 
    restock = Restock(
        id=restock_uuid,
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="Test supplier",
        notes="Test restock"
    )
    db_session.add(restock)
    await db_session.flush()

    restock_item = RestockItem(
        id=uuid.uuid4(),
        restock_id=restock.id,
        item_id=item.id,
        quantity=Decimal("3")
    )
    db_session.add(restock_item)
    await db_session.commit()
    await db_session.refresh(restock)
 
    response = await client.get(
            f"/restocks/{restock_uuid}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_restock_by_id_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ should return exsting restock in business if queried by id """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    response = await client.get(
            f"/restocks/{setup_restock.id}"
    )

    assert response.status_code == 401

# -- PATCH Test ---

@pytest.mark.asyncio
async def test_update_restock(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ should update restock and update db for an authorized client and a restock in said buisness """

    # Full update
    response = await client.patch(
            f"/restocks/{setup_restock.id}",
            json={
                "restock_date": "2026-01-09",
                "supplier": "Update supplier",
                "notes": "Update note",
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == setup_restock.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert data["id"] == str(db_restock.id)
    assert data["business_id"] == str(db_restock.business_id)
    assert data["supplier"] == db_restock.supplier == "Update supplier"
    assert data["restock_date"] == "2026-01-09" 
    assert db_restock.restock_date == date(2026, 1, 9)
    assert data["notes"] == db_restock.notes== "Update note"

    # Partial update - restock_date
    response = await client.patch(
            f"/restocks/{setup_restock.id}",
            json={
                "restock_date": "2026-02-10"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == setup_restock.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert data["id"] == str(db_restock.id)
    assert data["business_id"] == str(db_restock.business_id)
    assert data["supplier"] == db_restock.supplier == "Update supplier"
    assert data["restock_date"] == "2026-02-10" 
    assert db_restock.restock_date == date(2026, 2, 10)
    assert data["notes"] == db_restock.notes== "Update note"

    # Partial update - supplier 
    response = await client.patch(
            f"/restocks/{setup_restock.id}",
            json={
                "supplier": "Updated v2 supplier"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == setup_restock.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert data["id"] == str(db_restock.id)
    assert data["business_id"] == str(db_restock.business_id)
    assert data["supplier"] == db_restock.supplier == "Updated v2 supplier"
    assert data["restock_date"] == "2026-02-10" 
    assert db_restock.restock_date == date(2026, 2, 10)
    assert data["notes"] == db_restock.notes== "Update note"

    # Partial update - notes 
    response = await client.patch(
            f"/restocks/{setup_restock.id}",
            json={
                "notes": "Update v2 notes"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == setup_restock.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert data["id"] == str(db_restock.id)
    assert data["business_id"] == str(db_restock.business_id)
    assert data["supplier"] == db_restock.supplier == "Updated v2 supplier"
    assert data["restock_date"] == "2026-02-10" 
    assert db_restock.restock_date == date(2026, 2, 10)
    assert data["notes"] == db_restock.notes== "Update v2 notes"

@pytest.mark.asyncio
async def test_update_restock_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ should return 404 if restock doesn't exist """

    response = await client.patch(
            f"/restocks/{uuid.uuid4()}",
            json={
                "restock_date": "2026-01-09",
                "supplier": "Update supplier",
                "notes": "Update note",
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
 
@pytest.mark.asyncio
async def test_update_restock_wrong_input(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ should return 200 if restock field is not muttable, silently failing but not updating the db """

    item_uuid = uuid.uuid4()
    response = await client.patch(
            f"/restocks/{setup_restock.id}",
            json={
                "restock_items": [
                    { 
                     "id": str(uuid.uuid4()),
                     "restock_id": str(setup_restock.id),
                     "item_id": str(item_uuid) ,
                     "quantity": 15
                     }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    # Check no changes made to db
    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == setup_restock.id)
    )

    db_restock_item = result.scalar_one_or_none()
    
    assert db_restock_item is not None
    assert db_restock_item.item_id != item_uuid

@pytest.mark.asyncio
async def test_update_restock_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ shouldn't allow to modify restocks of another business"""
    another_business_uuid = uuid.uuid4()
    i = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid,
            name="Papas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )

    db_session.add(i)
    await db_session.commit()

    r= Restock(
        id=uuid.uuid4(),
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock"
    )
    
    db_session.add(r)
    await db_session.flush()

    ri= RestockItem(
        id=uuid.uuid4(),
        restock_id=r.id,
        item_id=i.id,
        quantity=Decimal("3")
    )


    db_session.add(ri)
    await db_session.commit()

    response = await client.patch(
            f"/restocks/{r.id}",
            json={
                "restock_date": "2026-01-09",
                "supplier": "Update supplier",
                "notes": "Update note",
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == r.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert db_restock.id == r.id
    assert db_restock.business_id == r.business_id
    assert db_restock.supplier == r.supplier
    assert db_restock.restock_date == r.restock_date
    assert db_restock.notes == r.notes


@pytest.mark.asyncio
async def test_update_restock_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ shouldn't allow unauthorized user to modify restocks """

    app.dependency_overrides[get_current_business] = mock_auth_failure

    response = await client.patch(
            f"/restocks/{setup_restock.id}",
            json={
                "restock_date": "2026-01-09",
                "supplier": "Update supplier",
                "notes": "Update note",
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == setup_restock.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert db_restock.id == setup_restock.id
    assert db_restock.business_id == setup_restock.business_id
    assert db_restock.supplier == setup_restock.supplier
    assert db_restock.restock_date == setup_restock.restock_date
    assert db_restock.notes == setup_restock.notes

 # --- DELETE Test ---

@pytest.mark.asyncio
async def test_delete_restock(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ should allow a authorized client to delete a restock from their business """
    response = await client.delete(
            f"/restocks/{setup_restock.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 204

    result = await db_session.execute(
            select(Restock)
            .where( Restock.id == setup_restock.id)
    )

    db_restock = result.scalar_one_or_none()
    assert db_restock is None

    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == setup_restock.id)
    )

    db_restock_item = result.scalar_one_or_none()
    assert db_restock_item is None

@pytest.mark.asyncio
async def test_delete_restock_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ should allow a authorized client to delete a restock from their business """
    response = await client.delete(
            f"/restocks/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Restock)
            .where( Restock.id == setup_restock.id)
    )

    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == setup_restock.id)
    )

    db_restock_item = result.scalar_one_or_none()
    assert db_restock_item is not None

@pytest.mark.asyncio
async def test_delete_restock_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ shouldn't allow a authorized client to delete a restock from another business """
    another_business_uuid = uuid.uuid4()

    item = Item(
            id=uuid.uuid4(),
            business_id=another_business_uuid,
            name="Papas",
            unit="kg",
            current_stock=Decimal("20"),
            low_stock_threshold=Decimal("0.4"),
    )
    db_session.add(item)
    await db_session.commit()

    restock = Restock(
        id=uuid.uuid4(),
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="Test supplier",
        notes="Test restock"
    )
    db_session.add(restock)
    await db_session.flush()

    restock_item = RestockItem(
        id=uuid.uuid4(),
        restock_id=restock.id,
        item_id=item.id,
        quantity=Decimal("3")
    )
    db_session.add(restock_item)
    await db_session.commit()
    await db_session.refresh(restock)
 
    response = await client.delete(
            f"/restocks/{restock.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Restock)
            .where( Restock.id == restock.id)
    )

    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == restock.id)
    )

    db_restock_item = result.scalar_one_or_none()
    assert db_restock_item is not None

@pytest.mark.asyncio
async def test_delete_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, setup_restock):
    """ shouldn't allow a unauthorized client to delete a restock from their business """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    response = await client.delete(
            f"/restocks/{setup_restock.id}"
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(Restock)
            .where( Restock.id == setup_restock.id)
    )

    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == setup_restock.id)
    )

    db_restock_item = result.scalar_one_or_none()
    assert db_restock_item is not None
