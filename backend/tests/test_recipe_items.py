import uuid
import pytest
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import RecipeItem
from conftest import mock_auth_failure

# --- POST Tests ---

@pytest.mark.asyncio
async def test_create_recipe_item(client: AsyncClient, db_session: AsyncSession, setup_business, product_factory, item_factory, assert_json_match_recipe_item):
    """ should create a recipe_item for existing item and product in the same business, reflect on db  """
    product = await product_factory(business_id=setup_business.id, name="Fideos") 
    item = await item_factory(business_id=setup_business.id, name="Harina") 

    response = await client.post(
            f"/products/{product.id}/recipe",
            json={
                "item_id": str(item.id),
                "quantity": 21.3,
                "unit": "kg"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201
    data = response.json()

    assert data["product_id"] == str(product.id)
    assert data["item_id"] == str(item.id)
    assert Decimal(data["quantity"]) == Decimal("21.3")
    assert data["unit"] == "kg"
    assert "id" in data

    recipe_item_uuid = uuid.UUID(data["id"])

    # See if changes made in db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.id == recipe_item_uuid)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is not None
    assert_json_match_recipe_item(db_recipe_item, data)

@pytest.mark.asyncio
async def test_create_recipe_item_product_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, item_factory):
    """ should return 404 when creating a recipe_item for existing item but non-existing product in the same business  """
    item = await item_factory(business_id=setup_business.id, name="Harina") 

    response = await client.post(
            f"/products/{uuid.uuid4()}/recipe",
            json={
                "item_id": str(item.id),
                "quantity": 20.3,
                "unit": "kg"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"

    # See if changes made in db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.item_id == item.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is None

@pytest.mark.asyncio
async def test_create_recipe_item_item_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, product_factory):
    """ should return 404 when creating a recipe_item for existing product but non-existing item in the same business  """
    product = await product_factory(business_id=setup_business.id, name="Ensalada") 

    response = await client.post(
            f"/products/{str(product.id)}/recipe",
            json={
                "item_id": str(uuid.uuid4()),
                "quantity": 2.3,
                "unit": "kg"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"

    # See if changes made in db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.product_id == product.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is None

@pytest.mark.asyncio
async def test_create_recipe_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, product_factory, item_factory):
    """ should return 404 when creating a recipe_item for existing product and item but for another business  """
    another_business_uuid = uuid.uuid4()

    product = await product_factory(business_id=another_business_uuid, name="Ensalada") 
    item = await item_factory(business_id=another_business_uuid, name="Cebolla") 

    response = await client.post(
            f"/products/{str(product.id)}/recipe",
            json={
                "item_id": str(item.id),
                "quantity": 2.3,
                "unit": "kg"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"

    # See if changes made in db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.product_id == product.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is None

@pytest.mark.asyncio
async def test_create_recipe_item_missing_input(client: AsyncClient, db_session: AsyncSession, setup_business, product_factory, item_factory):
    """ should return 422 when creating a recipe_item for existing item and product but missing mandatory input """
    product = await product_factory(business_id=setup_business.id, name="Fideos") 
    item = await item_factory(business_id=setup_business.id, name="Harina") 

    # Missing item_id
    response = await client.post(
            f"/products/{product.id}/recipe",
            json={
                # "item_id": str(item.id),
                "quantity": 21.3,
                "unit": "kg"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    # Missing quantity 
    response = await client.post(
            f"/products/{product.id}/recipe",
            json={
                "item_id": str(item.id),
                # "quantity": 21.3,
                "unit": "kg"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422

    # Missing unit 
    response = await client.post(
            f"/products/{product.id}/recipe",
            json={
                "item_id": str(item.id),
                "quantity": 21.3,
                # "unit": "kg"
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 422


    # See if changes made in db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.product_id == product.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is None

@pytest.mark.asyncio
async def test_create_recipe_item_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, product_factory, item_factory):
    """ should return 401 when trying to create a recipe_item for existing item and product in the same business but unauthroized client """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    product = await product_factory(business_id=setup_business.id, name="Fideos") 
    item = await item_factory(business_id=setup_business.id, name="Harina") 

    response = await client.post(
            f"/products/{product.id}/recipe",
            json={
                "item_id": str(item.id),
                "quantity": 21.3,
                "unit": "kg"
            }
    )

    assert response.status_code == 401

    # See if changes made in db

    result = await db_session.execute(
            select(RecipeItem)
            .where(
                RecipeItem.item_id == item.id,
                RecipeItem.product_id == product.id
            )
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is None

# --- GET Tests ---

@pytest.mark.asyncio
async def test_get_recipe_items(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory, assert_json_match_recipe_item):
    """ should return all recipe_items from a product  """
    p, i1, ri1= await recipe_item_factory(business_id=setup_business.id)
    _, i2, ri2 = await recipe_item_factory(business_id=setup_business.id, product=p) 
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, product=p, item=i1) 

    response = await client.get(
            f"/products/{p.id}/recipe",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 3
    assert_json_match_recipe_item(ri1, data[0])
    assert_json_match_recipe_item(ri2, data[1])
    assert_json_match_recipe_item(ri3, data[2])

@pytest.mark.asyncio
async def test_get_recipe_items_empty(client: AsyncClient, db_session: AsyncSession, setup_business, product_factory):
    """ should return empty json if no recipe_items for product """
    product = await product_factory(business_id=setup_business.id, name="Product without recipi")

    response = await client.get(
            f"/products/{product.id}/recipe",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_recipe_items_non_existing_product(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return 404 if product doesn't exist """
    response = await client.get(
            f"/products/{uuid.uuid4()}/recipe",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_recipe_items_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 404 for a product with recipe_items but from another business """
    another_business_uuid = uuid.uuid4()
    p, i1, ri1= await recipe_item_factory(business_id=another_business_uuid)
    _, i2, ri2 = await recipe_item_factory(business_id=another_business_uuid, product=p) 
    _, _, ri3 = await recipe_item_factory(business_id=another_business_uuid, product=p, item=i1) 

    response = await client.get(
            f"/products/{p.id}/recipe",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_recipe_items_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 401 for a product with recipe_items but client unauthroized """
    app.dependency_overrides[get_current_business] = mock_auth_failure
    
    p, i1, ri1= await recipe_item_factory(business_id=setup_business.id)
    _, i2, ri2 = await recipe_item_factory(business_id=setup_business.id, product=p) 
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, product=p, item=i1) 

    response = await client.get(
            f"/products/{p.id}/recipe",
    )

    assert response.status_code == 401

# --- PATCH Tests ---

@pytest.mark.asyncio
async def test_update_recipe_item(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory, assert_json_match_recipe_item):
    """ should return updated existing recipe_item, reflect on db """
    p, i1, ri1= await recipe_item_factory(business_id=setup_business.id)
    _, i2, ri2 = await recipe_item_factory(business_id=setup_business.id, product=p) 
    _, _, ri3 = await recipe_item_factory(business_id=setup_business.id, product=p, item=i1) 

    # Full update
    response = await client.patch(
            f"/products/{p.id}/recipe/{ri1.id}",
            json={
                "quantity": 32.1,
                "unit": "l"
            },
            headers={"Authorization": "Bearer faketoken"}
    )


    assert response.status_code == 200
    data = response.json()

    assert Decimal(data["quantity"]) == Decimal("32.1")
    assert data["unit"] == "l"

    # Update and check the rest of the object stayed the same
    ri1.quantity = Decimal("32.1")
    ri1.unit = "l"

    assert_json_match_recipe_item(ri1, data)

    # Partial update - quantity
    response = await client.patch(
            f"/products/{p.id}/recipe/{ri2.id}",
            json={
                "quantity": 123.2,
            },
            headers={"Authorization": "Bearer faketoken"}
    )


    assert response.status_code == 200
    data = response.json()

    assert Decimal(data["quantity"]) == Decimal("123.2")

    # Update and check the rest of the object stayed the same
    ri2.quantity = Decimal("123.2")

    assert_json_match_recipe_item(ri2, data)

    # Partial update - unit 
    response = await client.patch(
            f"/products/{p.id}/recipe/{ri3.id}",
            json={
                "unit": "ml",
            },
            headers={"Authorization": "Bearer faketoken"}
    )


    assert response.status_code == 200
    data = response.json()

    assert data["unit"] == "ml"

    # Update and check the rest of the object stayed the same
    ri3.unit = "ml"

    assert_json_match_recipe_item(ri3, data)

@pytest.mark.asyncio
async def test_update_recipe_item_wrong_input(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory, assert_json_match_recipe_item):
    """ should return 200 if trying to update wrong fields like item_id of existing recipe_item, but don't reflect to db """
    p, i, r= await recipe_item_factory(business_id=setup_business.id)

    response = await client.patch(
            f"/products/{p.id}/recipe/{r.id}",
            json={
                "item_id": str(uuid.uuid4())
            },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    # Check no changes made to db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.id == r.id)
    )
    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is not None
    assert db_recipe_item.item_id == i.id

@pytest.mark.asyncio
async def test_update_recipe_item_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, product_factory):
    """ should return 404 when updating an existing recipe_item but from another business """
    product = await product_factory(business_id=setup_business.id, name="Asado")

    response = await client.patch(
            f"/products/{product.id}/recipe/{uuid.uuid4()}",
            json={
                "quantity": 32.1,
                "unit": "l"
            },
            headers={"Authorization": "Bearer faketoken"}
    )


    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe item not found"

@pytest.mark.asyncio
async def test_update_recipe_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 404 when updating an existing recipe_item but from another business """
    another_business_uuid = uuid.uuid4()

    p, _, ri= await recipe_item_factory(business_id=another_business_uuid)

    response = await client.patch(
            f"/products/{p.id}/recipe/{ri.id}",
            json={
                "quantity": 32.1,
                "unit": "l"
            },
            headers={"Authorization": "Bearer faketoken"}
    )


    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"

@pytest.mark.asyncio
async def test_update_recipe_item_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 401 when updating an existing recipe_item but from another business """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    p, _, ri= await recipe_item_factory(business_id=setup_business.id)

    response = await client.patch(
            f"/products/{p.id}/recipe/{ri.id}",
            json={
                "quantity": 32.1,
                "unit": "l"
            }
    )

    assert response.status_code == 401

# --- DELETE Tests ---

@pytest.mark.asyncio
async def test_delete_recipe_item(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 204 when succesfully deleting a recipe_item, reflect on db """
    p, _, ri = await recipe_item_factory(business_id=setup_business.id)

    response = await client.delete(
            f"/products/{p.id}/recipe/{ri.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 204

    # Check deleted from db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.id == ri.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is None

@pytest.mark.asyncio
async def test_delete_recipe_item_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 404 when trying to delete a non-existing recipe_item, reflect on db """
    p, _, _ = await recipe_item_factory(business_id=setup_business.id)

    response = await client.delete(
            f"/products/{p.id}/recipe/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    # Check not deleted from db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.product_id == p.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is not None

@pytest.mark.asyncio
async def test_delete_recipe_item_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 404 when trying to delete a recipe_item from another business, reflect on db """
    another_business_uuid = uuid.uuid4()
    p, _, ri = await recipe_item_factory(business_id=another_business_uuid)

    response = await client.delete(
            f"/products/{p.id}/recipe/{ri.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    # Check not deleted from db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.id == ri.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is not None

@pytest.mark.asyncio
async def test_delete_recipe_item_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, recipe_item_factory):
    """ should return 404 when trying to delete a recipe_item from another business, reflect on db """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    p, _, ri = await recipe_item_factory(business_id=setup_business.id)

    response = await client.delete(
            f"/products/{p.id}/recipe/{ri.id}"
    )

    assert response.status_code == 401

    # Check not deleted from db

    result = await db_session.execute(
            select(RecipeItem)
            .where(RecipeItem.id == ri.id)
    )

    db_recipe_item = result.scalar_one_or_none()

    assert db_recipe_item is not None
