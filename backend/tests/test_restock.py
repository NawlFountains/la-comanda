import uuid
import pytest
from app.models.restock_item import RestockItem
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Restock, Item
from datetime import date
from decimal import Decimal
from conftest import assert_json_match_recipe_item, mock_auth_failure

# --- POST Test ---

@pytest.mark.asyncio
async def test_create_restock(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory, assert_json_match_restock):
    """ should be able to create a restock with items, reflecting on database """
    i = await item_factory(business_id=setup_business.id, name="Papa")

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "Coto",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(i.id),
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
    assert data["business_id"] == str(i.business_id)

    assert data["restock_items"] != []
    assert data["restock_items"][0]["item_id"] == str(i.id)
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
    assert_json_match_restock(db_restock, data)

@pytest.mark.asyncio
async def test_create_restock_increment_stock(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory, assert_json_match_restock):
    """ should be able to create a restock with items, reflecting on database """
    i = await item_factory(business_id=setup_business.id, name="Papa", current_stock=Decimal("5"))

    assert i.current_stock == Decimal("5") # Previous stock

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "Coto",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(i.id),
                        "quantity": 3
                        }
                    ]
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201

    # Check item restocked incremented their current stock

    result = await db_session.execute(
            select(Item)
            .where(Item.id == i.id)
    )

    db_item = result.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == Decimal("8")

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
async def test_create_restock_existing_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ shouldn't be able to create a restock with items from another business """
    i = await item_factory(business_id=uuid.uuid4(), name="Cebolla")

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "SupSup",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(i.id),
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
                RestockItem.item_id == i.id
            )
    )

    db_restock_item = result.scalar_one_or_none()

    assert db_restock_item is None
 
@pytest.mark.asyncio
async def test_create_restock_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ shouldn't allow unauthorized client to create restocks """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    i = await item_factory(business_id=setup_business.id, name="Tomate")

    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-05-05",
                "supplier": "Anonima",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(i.id),
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
async def test_create_restock_incomplete_input_optional(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should allow restock creation if optional input it's not given """
    i = await item_factory(business_id=setup_business.id, name="Pollo")

    # Missing supplier and notes
    response = await client.post(
            "/restocks",
            json={
                "restock_date": "2026-03-03",
                "restock_items": [
                    {
                        "item_id": str(i.id),
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
    assert data["restock_items"][0]["item_id"] == str(i.id)
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
    assert db_restock.restock_items[0].item_id == i.id
    assert db_restock.restock_items[0].quantity == Decimal("3")

@pytest.mark.asyncio
async def test_create_restock_incomplete_input_mandatory(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should throw 422 if mandatory input isn't given """
    i = await item_factory(business_id=setup_business.id, name="Mandarina")

    # Missing restock date
    response = await client.post(
            "/restocks",
            json={
                "supplier": "Anonima",
                "notes": "No notes",
                "restock_items": [
                    {
                        "item_id": str(i.id),
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
async def test_get_restocks_with_limit(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        restock_factory,
        assert_json_match_restock
):
    """ should return only the number of restocks specified by limit """
    r1, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2025, 5, 7))
    r2, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 3, 6))
    r3, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 7))

    response = await client.get(
            "/restocks?limit=2",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Always return from most recent
    assert_json_match_restock(r3, data[0])
    assert_json_match_restock(r2, data[1])

@pytest.mark.asyncio
async def test_get_restocks_with_offset(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        restock_factory,
        assert_json_match_restock
):
    """ should skip restocks by offset """
    r1, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 5))
    r2, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 6))
    r3, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 7))

    response = await client.get(
            "/restocks?offset=1",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    assert_json_match_restock(r2, data[0])
    assert_json_match_restock(r1, data[1])

@pytest.mark.asyncio
async def test_get_restocks_with_limit_and_offset(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        restock_factory,
        assert_json_match_restock
):
    """ should return paged restocks with limit and offset """
    r1, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 5))
    r2, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 6))
    r3, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 7))

    response = await client.get(
            "/restocks?limit=1&offset=1",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    assert_json_match_restock(r2, data[0]) # Skip 1 (the most recent by date r3)

@pytest.mark.asyncio
async def test_get_restocks_limit_exceeds_total(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business,
        restock_factory,
        assert_json_match_restock
):
    """ should return all restocks when limit exceeds total count """
    r1, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 5))
    r2, _, _ = await restock_factory(business_id=setup_business.id, restock_date=date(2026, 5, 6))

    response = await client.get(
            "/restocks?limit=100",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200
    data = response.json()

    assert len(data) == 2

    assert_json_match_restock(r2, data[0])
    assert_json_match_restock(r1, data[1])

@pytest.mark.asyncio
async def test_get_restocks_invalid_limit(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business
):
    """ should return 422 when limit is invalid """
    response = await client.get(
            "/restocks?limit=0",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_restocks_invalid_offset(
        client: AsyncClient,
        db_session: AsyncSession,
        setup_business
):
    """ should return 422 when offset is negative """
    response = await client.get(
            "/restocks?offset=-1",
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_restocks(client: AsyncClient, db_session: AsyncSession, setup_business,restock_factory, assert_json_match_restock):
    """ should return all restocks from the current business sorted by the most recent """

    r1, _, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )
    r2, _, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 6, 5),
        supplier="WallMock",
        notes="Test restock",
        quantity=Decimal("5")
    )



    response = await client.get(
            "/restocks", 
            headers={"Authorization": "Bearer faketoken"}
    )
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert_json_match_restock(r2, data[0])
    assert_json_match_restock(r1, data[1])

@pytest.mark.asyncio
async def test_get_restocks_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return empty list if no restocks logged for said business """
    response = await client.get("/restocks", headers={"Authorization": "Bearer faketoken"})

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_restocks_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory, assert_json_match_restock):
    """ should only return the stocks asocciated with the client business"""
    r1, ri1, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

    another_business_uuid = uuid.uuid4()
    r2, ri2, _= await restock_factory(
        business_id=another_business_uuid,
        restock_date=date(2026, 6, 5),
        supplier="WallMock",
        notes="Test restock",
        quantity=Decimal("5")
    )

    response = await client.get("/restocks")

    assert response.status_code == 200

    data = response.json()

    assert_json_match_restock(r1, data[0])

@pytest.mark.asyncio
async def test_get_restocks_unauthorized(client: AsyncClient, db_session: AsyncSession, cleanup_override, restock_factory):
    """ should return empty list if no restocks logged for said business """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    another_business_uuid = uuid.uuid4()
    r1, _, _ = await restock_factory(
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

    r2, _, _ = await restock_factory(
        business_id=another_business_uuid,
        restock_date=date(2026, 6, 5),
        supplier="WallMock",
        notes="Test restock",
        quantity=Decimal("5")
    )

    response = await client.get("/restocks")

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_restock_by_id(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory, assert_json_match_restock):
    """ should return exsting restock in business if queried by id """
    r, _, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )
    _, _, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2022, 5, 5),
        supplier="WallMock",
        notes="Test restock",
        quantity=Decimal("35")
    )


    response = await client.get(
            f"/restocks/{r.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert_json_match_restock(r, data)

@pytest.mark.asyncio
async def test_get_restock_by_id_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return exsting restock in business if queried by id """
    response = await client.get(
            f"/restocks/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_restock_by_id_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ should return 404 for exsting restock but linked to another business """
    another_business_uuid = uuid.uuid4()

    r, _, _= await restock_factory(
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="Test supplier",
        notes="Test restock",
        quantity=Decimal("3")
    )
 
    response = await client.get(
            f"/restocks/{r.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_restock_by_id_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ should return exsting restock in business if queried by id """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    r, _, _= await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="Test supplier",
        notes="Test restock",
        quantity=Decimal("3")
    )
 
    response = await client.get(
            f"/restocks/{r.id}"
    )

    assert response.status_code == 401

# -- PATCH Test ---

@pytest.mark.asyncio
async def test_update_restock(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory, assert_json_match_restock):
    """ should update restock and update db for an authorized client and a restock in said buisness """

    r, _, _= await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="Test supplier",
        notes="Test restock",
        quantity=Decimal("3")
    )
 
    # Full update
    response = await client.patch(
            f"/restocks/{r.id}",
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
            .where(Restock.id == r.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert_json_match_restock(db_restock, data)

    # Partial update - restock_date
    response = await client.patch(
            f"/restocks/{r.id}",
            json={
                "restock_date": "2026-02-10"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    assert_json_match_restock(r, data)

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == r.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert_json_match_restock(db_restock, data)

    # Partial update - supplier 
    response = await client.patch(
            f"/restocks/{r.id}",
            json={
                "supplier": "Updated v2 supplier"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == r.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert_json_match_restock(db_restock, data)

    # Partial update - notes 
    response = await client.patch(
            f"/restocks/{r.id}",
            json={
                "notes": "Update v2 notes"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    result = await db_session.execute(
            select(Restock)
            .where(Restock.id == r.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert_json_match_restock(db_restock, data)

@pytest.mark.asyncio
async def test_update_restock_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
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
async def test_update_restock_wrong_input(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ should return 200 if restock field is not muttable, silently failing but not updating the db """

    r, _, i = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

    item_uuid = uuid.uuid4()
    response = await client.patch(
            f"/restocks/{r.id}",
            json={
                "restock_items": [
                    { 
                     "id": str(uuid.uuid4()),
                     "restock_id": str(r.id),
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
            .where( RestockItem.restock_id == r.id)
    )

    db_restock_item = result.scalar_one_or_none()
    
    assert db_restock_item is not None
    assert db_restock_item.item_id == i.id

@pytest.mark.asyncio
async def test_update_restock_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ shouldn't allow to modify restocks of another business"""
    another_business_uuid = uuid.uuid4()

    r, _, _= await restock_factory(
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

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
async def test_update_restock_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ shouldn't allow unauthorized user to modify restocks """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    r, _, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

    response = await client.patch(
            f"/restocks/{r.id}",
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
            .where(Restock.id == r.id)
    )
    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    assert db_restock.id == r.id
    assert db_restock.business_id == r.business_id
    assert db_restock.supplier == r.supplier
    assert db_restock.restock_date == r.restock_date
    assert db_restock.notes == r.notes

 # --- DELETE Test ---

@pytest.mark.asyncio
async def test_delete_restock(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ should allow a authorized client to delete a restock from their business """
    r, _, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

    response = await client.delete(
            f"/restocks/{r.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 204

    result = await db_session.execute(
            select(Restock)
            .where( Restock.id == r.id)
    )

    db_restock = result.scalar_one_or_none()
    assert db_restock is None

    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == r.id)
    )

    db_restock_item = result.scalar_one_or_none()
    assert db_restock_item is None

@pytest.mark.asyncio
async def test_delete_restock_decrement_stock(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ should decrement item stock if restock deleted """
    r, ri, i = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

    stock_before_deletion = i.current_stock

    response = await client.delete(
            f"/restocks/{r.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 204

    result = await db_session.execute(
            select(Item)
            .where( Item.id == i.id)
    )

    db_item = result.scalar_one_or_none()

    assert db_item is not None
    assert db_item.current_stock == stock_before_deletion - ri.quantity # Stock - restock item quantity

@pytest.mark.asyncio
async def test_delete_restock_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should allow a authorized client to delete a restock from their business """
    response = await client.delete(
            f"/restocks/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_restock_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ shouldn't allow a authorized client to delete a restock from another business """
    another_business_uuid = uuid.uuid4()

    r, _, _ = await restock_factory(
        business_id=another_business_uuid,
        restock_date=date(2026, 5, 5),
        supplier="Test supplier",
        notes="Test restock",
        quantity=Decimal("3")
    )
    
    response = await client.delete(
            f"/restocks/{r.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    result = await db_session.execute(
            select(Restock)
            .where( Restock.id == r.id)
    )

    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == r.id)
    )

    db_restock_item = result.scalar_one_or_none()
    assert db_restock_item is not None

@pytest.mark.asyncio
async def test_delete_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, restock_factory):
    """ shouldn't allow a unauthorized client to delete a restock from their business """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    r, _, _ = await restock_factory(
        business_id=setup_business.id,
        restock_date=date(2026, 5, 5),
        supplier="WallMart",
        notes="Test restock",
        quantity=Decimal("3")
    )

    response = await client.delete(
            f"/restocks/{r.id}"
    )

    assert response.status_code == 401

    result = await db_session.execute(
            select(Restock)
            .where( Restock.id == r.id)
    )

    db_restock = result.scalar_one_or_none()
    assert db_restock is not None

    result = await db_session.execute(
            select(RestockItem)
            .where( RestockItem.restock_id == r.id)
    )

    db_restock_item = result.scalar_one_or_none()
    assert db_restock_item is not None
