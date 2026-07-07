from datetime import date
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pytest
from decimal import Decimal
from httpx import AsyncClient
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Business, Product
from conftest import  mock_auth_failure

# --- POST Tests --- 

@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should create a product for an authorized user on request, reflect on db """
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
    """ should return 401 when tring to create a product for an unauthorized user on request, no changes on db"""
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
async def test_get_products_full(client: AsyncClient, db_session: AsyncSession, price_history_factory, recipe_item_factory, assert_json_match_recipe_item, setup_business):
    """ should return product with current price and recipe items when requested """
    # First product 
    _, p1 = await price_history_factory(business_id=setup_business.id, price=Decimal("25"), valid_from=date(2024,1,1))
    ph1, _ = await price_history_factory(business_id=setup_business.id, product=p1, price=Decimal("30"), valid_from=date(2025,1,1))

    _, _, ri11 = await recipe_item_factory(business_id=setup_business.id, product=p1, quantity=Decimal("0.3"))
    _, _, ri12 = await recipe_item_factory(business_id=setup_business.id, product=p1, quantity=Decimal("1.3"))

    # Second product
    ph2, p2 = await price_history_factory(business_id=setup_business.id, price=Decimal("10"), valid_from=date(2026,1,1))
    _, _ = await price_history_factory(business_id=setup_business.id, product=p2, price=Decimal("5"), valid_from=date(2025,1,1))

    _, _, ri21 = await recipe_item_factory(business_id=setup_business.id, product=p2)



    response = await client.get(
            "/products/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2

    # Check first product data is correct
    assert data[0]["name"] == p1.name
    assert data[0]["latest_price"] is not None
    assert Decimal(data[0]["latest_price"]['price']) == ph1.price # It's the latest price by date
    assert data[0]["latest_price"]['valid_from'] == str(ph1.valid_from) # It's the latest price by date
    assert len(data[0]["recipe_items"]) == 2

    assert_json_match_recipe_item(ri11, data[0]["recipe_items"][0])
    assert_json_match_recipe_item(ri12, data[0]["recipe_items"][1])

    # Check second product data is correct
    assert data[1]["name"] == p2.name
    assert data[1]["latest_price"] is not None
    assert Decimal(data[1]["latest_price"]['price']) == ph2.price # It's the latest price by date
    assert data[1]["latest_price"]['valid_from'] == str(ph2.valid_from) # It's the latest price by date
    assert len(data[1]["recipe_items"]) == 1

    assert_json_match_recipe_item(ri21, data[1]["recipe_items"][0])

@pytest.mark.asyncio
async def test_get_products_full_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return empty json when requesting all products with details but none defined """
    response = await client.get(
            "/products/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_products_full_missing_price(client: AsyncClient, db_session: AsyncSession, recipe_item_factory, assert_json_match_recipe_item, setup_business):
    """ should return product with recipe items and prices as None when requesting all products with details but some don't have prices defined """
    p, _, ri1 = await recipe_item_factory(business_id=setup_business.id, quantity=Decimal("0.3"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, product=p, quantity=Decimal("1.3"))

    response = await client.get(
            "/products/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == p.name
    assert data[0]["latest_price"] is None
    assert len(data[0]["recipe_items"]) == 2

    assert_json_match_recipe_item(ri1, data[0]["recipe_items"][0])
    assert_json_match_recipe_item(ri2, data[0]["recipe_items"][1])

@pytest.mark.asyncio
async def test_get_products_full_missing_recipe_items(client: AsyncClient, db_session: AsyncSession, price_history_factory, setup_business):
    """ should return product with current price and empty json for recipe items when requesting all products with details but some don't have recipe_items defined """
    _, p = await price_history_factory(business_id=setup_business.id, price=Decimal("25"), valid_from=date(2024,1,1))
    ph, _ = await price_history_factory(business_id=setup_business.id, product=p, price=Decimal("30"), valid_from=date(2025,1,1))

    response = await client.get(
            "/products/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == p.name
    assert data[0]["latest_price"] is not None
    assert Decimal(data[0]["latest_price"]['price']) == ph.price # It's the latest price by date
    assert data[0]["latest_price"]['valid_from'] == str(ph.valid_from) # It's the latest price by date
    assert data[0]["recipe_items"] == []

@pytest.mark.asyncio
async def test_get_products_full_another_business(client: AsyncClient, db_session: AsyncSession, price_history_factory, recipe_item_factory, setup_business):
    """ should return only the product from requester business """
    another_business_uuid = uuid.uuid4()
    # First product 
    _, p1 = await price_history_factory(business_id=another_business_uuid, price=Decimal("25"), valid_from=date(2024,1,1))
    ph1, _ = await price_history_factory(business_id=another_business_uuid, product=p1, price=Decimal("30"), valid_from=date(2025,1,1))

    _, _, ri11 = await recipe_item_factory(business_id=another_business_uuid, product=p1, quantity=Decimal("0.3"))
    _, _, ri12 = await recipe_item_factory(business_id=another_business_uuid, product=p1, quantity=Decimal("1.3"))

    # Second product
    ph2, p2 = await price_history_factory(business_id=another_business_uuid, price=Decimal("10"), valid_from=date(2026,1,1))
    _, _ = await price_history_factory(business_id=another_business_uuid, product=p2, price=Decimal("5"), valid_from=date(2025,1,1))

    _, _, ri21 = await recipe_item_factory(business_id=another_business_uuid, product=p2)



    response = await client.get(
            "/products/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_products_full_unauthorized(client: AsyncClient, db_session: AsyncSession, price_history_factory, recipe_item_factory, setup_business):
    """ should return 401 when client is unauthorized """
    app.dependency_overrides[get_current_business] = mock_auth_failure
    # First product 
    _, p1 = await price_history_factory(business_id=setup_business.id, price=Decimal("25"), valid_from=date(2024,1,1))
    ph1, _ = await price_history_factory(business_id=setup_business.id, product=p1, price=Decimal("30"), valid_from=date(2025,1,1))

    _, _, ri11 = await recipe_item_factory(business_id=setup_business.id, product=p1, quantity=Decimal("0.3"))
    _, _, ri12 = await recipe_item_factory(business_id=setup_business.id, product=p1, quantity=Decimal("1.3"))

    # Second product
    ph2, p2 = await price_history_factory(business_id=setup_business.id, price=Decimal("10"), valid_from=date(2026,1,1))
    _, _ = await price_history_factory(business_id=setup_business.id, product=p2, price=Decimal("5"), valid_from=date(2025,1,1))

    _, _, ri21 = await recipe_item_factory(business_id=setup_business.id, product=p2)

    response = await client.get(
            "/products/full"
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_products(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return all products  """
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
    """ should return an empty json [] if no products defined for business """
    response = await client.get("/products")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_products_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return an empty json [] if no products defined for business """
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
    """ should return 401 if client unauthorized """
    app.dependency_overrides[get_current_business] = mock_auth_failure
    p1 = Product(id=uuid.uuid4(), business_id=uuid.uuid4(), name="Milanesa")
    db_session.add(p1)
    await db_session.commit()

    response = await client.get("/products")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_product_by_id_full_existing(client: AsyncClient, db_session: AsyncSession, price_history_factory, recipe_item_factory, assert_json_match_recipe_item, setup_business):
    """ should return product with current price and recipe_items associated by id (existing product)"""
    _, p = await price_history_factory(business_id=setup_business.id, price=Decimal("25"), valid_from=date(2024,1,1))
    ph, _ = await price_history_factory(business_id=setup_business.id, product=p, price=Decimal("30"), valid_from=date(2025,1,1))

    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, product=p, quantity=Decimal("0.3"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, product=p, quantity=Decimal("1.3"))

    response = await client.get(
            f"/products/{p.id}/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == p.name
    assert data["latest_price"] is not None
    assert Decimal(data["latest_price"]['price']) == ph.price # It's the latest price by date
    assert data["latest_price"]['valid_from'] == str(ph.valid_from) # It's the latest price by date
    assert len(data["recipe_items"]) == 2

    assert_json_match_recipe_item(ri1, data["recipe_items"][0])
    assert_json_match_recipe_item(ri2, data["recipe_items"][1])

@pytest.mark.asyncio
async def test_get_products_by_id_full_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return 404 if product id doesn't match any product """ 
    response = await client.get(
            f"/products/{uuid.uuid4()}/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_product_by_id_full_missing_price(client: AsyncClient, db_session: AsyncSession, recipe_item_factory, assert_json_match_recipe_item, setup_business):
    """ should return product with recipe items and latest_price as None if price doesn't defined """ 
    p, _, ri1 = await recipe_item_factory(business_id=setup_business.id, quantity=Decimal("0.3"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, product=p, quantity=Decimal("1.3"))

    response = await client.get(
            f"/products/{p.id}/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == p.name
    assert data["latest_price"] is None
    assert len(data["recipe_items"]) == 2

    assert_json_match_recipe_item(ri1, data["recipe_items"][0])
    assert_json_match_recipe_item(ri2, data["recipe_items"][1])

@pytest.mark.asyncio
async def test_get_product_by_id_full_missing_recipe_items(client: AsyncClient, db_session: AsyncSession, price_history_factory, setup_business):
    """ should return product with latest_price and empty json for recipe_items if none defined """ 
    _, p = await price_history_factory(business_id=setup_business.id, price=Decimal("25"), valid_from=date(2024,1,1))
    ph, _ = await price_history_factory(business_id=setup_business.id, product=p, price=Decimal("30"), valid_from=date(2025,1,1))

    response = await client.get(
            f"/products/{p.id}/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == p.name
    assert data["latest_price"] is not None
    assert Decimal(data["latest_price"]['price']) == ph.price # It's the latest price by date
    assert data["latest_price"]['valid_from'] == str(ph.valid_from) # It's the latest price by date
    assert data["recipe_items"] == []

@pytest.mark.asyncio
async def test_get_product_by_id_full_another_business(client: AsyncClient, db_session: AsyncSession, price_history_factory, recipe_item_factory, setup_business):
    """ should return 404 when requesting product exist but belongs to another business """
    another_business_uuid = uuid.uuid4()

    _, p = await price_history_factory(business_id=another_business_uuid, price=Decimal("25"), valid_from=date(2024,1,1))
    await price_history_factory(business_id=another_business_uuid, product=p, price=Decimal("30"), valid_from=date(2025,1,1))

    await recipe_item_factory(business_id=another_business_uuid, product=p, quantity=Decimal("0.3"))
    await recipe_item_factory(business_id=another_business_uuid, product=p, quantity=Decimal("1.3"))

    response = await client.get(
            f"/products/{p.id}/full",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_product_by_id_full_unauthorized(client: AsyncClient, db_session: AsyncSession, price_history_factory, recipe_item_factory, setup_business):
    """ should return 401 when client is unauthorized """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    _, p = await price_history_factory(business_id=setup_business.id, price=Decimal("25"), valid_from=date(2024,1,1))
    ph, _ = await price_history_factory(business_id=setup_business.id, product=p, price=Decimal("30"), valid_from=date(2025,1,1))

    _, _, ri1 = await recipe_item_factory(business_id=setup_business.id, product=p, quantity=Decimal("0.3"))
    _, _, ri2 = await recipe_item_factory(business_id=setup_business.id, product=p, quantity=Decimal("1.3"))

    response = await client.get(
            "/products/full"
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_product_by_id_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return existing product matching id """
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
    """ should return 404 for non-existing product matching id """
    p1 = Product(id=uuid.uuid4(), business_id=setup_business.id, name="Milanesa")
    p2 = Product(id=uuid.uuid4(), business_id=setup_business.id, name="Pure")
    db_session.add_all([p1,p2])
    await db_session.commit()

    response= await client.get(f"/products/{uuid.uuid4()}")

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_product_by_id_from_another_business(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return 404 for existing product but belongs to another business """
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
    """ should return 401 for client unauthorized """
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
    """ should return updated product when succesfully updated"""
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
    """ should return 404 when product doesn't exist """
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
    """ should return 404 when product exist but for another business """
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
    """ should return 204 when product exist and succesfully deleted """
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
    """ should return 401 for client unauthorized """
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
    """ should return 404 when product doesn't exist """
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
    """ should return 404 when product exist but belongs to another business """
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
