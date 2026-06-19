from decimal import Decimal
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pytest
from httpx import AsyncClient
from fastapi import HTTPException
from app.main import app
from app.dependencies.auth import get_current_business
from app.models import Business, Customer, business 

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

# Tests

# --- Post Tests ---

@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should allow authorized client to create customers, change should reflect upon db """
    response = await client.post(
               "/customers",
               json={
                   "name": "Jose",
                   "phone": "123456",
               },
               headers={"Authorization": "Bearer faketoken"}
   ) 

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Jose"
    assert data["phone"] == "123456"
    assert "id" in data

    customer_uuid = uuid.UUID(data["id"])

    result= await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer_uuid,
                Customer.business_id == setup_business.id
            )
    )
    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer.id == customer_uuid
    assert db_customer.business_id== setup_business.id
    assert db_customer.name == "Jose"
    assert db_customer.phone == "123456"

@pytest.mark.asyncio
async def test_create_customer_missing_input(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should allow authorized client to create customers, change should reflect upon db """

    # Missing phone
    response = await client.post(
               "/customers",
               json={
                   "name": "JoseWithoutPhone",
               },
               headers={"Authorization": "Bearer faketoken"}
   ) 

    assert response.status_code == 422

    result= await db_session.execute(
            select(Customer)
            .where(
                Customer.name == "JoseWithoutPhone",
            )
    )
    db_customer = result.scalar_one_or_none()

    assert db_customer is None

    # Missing name 
    response = await client.post(
               "/customers",
               json={
                   "phone": "+29 31231 2",
               },
               headers={"Authorization": "Bearer faketoken"}
   ) 

    assert response.status_code == 422

    result= await db_session.execute(
            select(Customer)
            .where(
                Customer.phone == "+29 31231 2",
            )
    )
    db_customer = result.scalar_one_or_none()

    assert db_customer is None

@pytest.mark.asyncio
async def test_create_customer_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return 401 for an unauthorized client and not make any changes to db """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    response = await client.post(
               "/customers",
               json={
                   "name": "JoseUnauthorized",
                   "phone": "123456",
               }
   ) 

    assert response.status_code == 401

    result= await db_session.execute(
            select(Customer)
            .where(
                Customer.name == "JoseUnauthorized",
            )
    )
    db_customer = result.scalar_one_or_none()

    assert db_customer is None

# --- GET Tets ---

@pytest.mark.asyncio
async def test_get_customers(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return all customers for said business for an authorized client """
    c1= await customer_factory( name="Not-so-Loyal customer 1", business_id=setup_business.id)
    c2= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)
    c3= await customer_factory(name="Loyal customer 2", business_id=setup_business.id)
    
    response = await client.get(
            "/customers",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 3 
    
    # Return order is alphabetical so it should be c2,c3,c1 
    assert data[0]["name"] == c2.name
    assert data[1]["name"] == c3.name
    assert data[2]["name"] == c1.name

@pytest.mark.asyncio
async def test_get_customers_empty(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return [] for an authorized client with no customers"""
    response = await client.get(
            "/customers",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_customers_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return ONLY customers for said business for an authorized client """
    await customer_factory( name="Not-so-Loyal customer 1")
    await customer_factory( name="Loyal customer 1")
    await customer_factory(name="Loyal customer 2")
    
    response = await client.get(
            "/customers",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    assert response.json() == [] 

@pytest.mark.asyncio
async def test_get_customers_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return 401 for an unauthorized client """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    await customer_factory( name="Not-so-Loyal customer 1")
    await customer_factory( name="Loyal customer 1")
    await customer_factory( name="Loyal customer 2")
    
    response = await client.get(
            "/customers"
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_customer_by_id(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ shuold return customer queried by id in business for authorized client """
    c1= await customer_factory( name="Not-so-Loyal customer 1", business_id=setup_business.id)
    c2= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)
    c3= await customer_factory(name="Loyal customer 2", business_id=setup_business.id)
    
    response = await client.get(
            f"/customers/{c1.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()
    
    assert data['id'] == str(c1.id)
    assert data['business_id'] == str(setup_business.id)
    assert data["name"] == c1.name
    assert data["phone"] == c1.phone

@pytest.mark.asyncio
async def test_get_customer_by_id_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ shuold return 404 for an id not matching any customer in business for authorized client """
    c1= await customer_factory( name="Not-so-Loyal customer 1", business_id=setup_business.id)
    c2= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)
    c3= await customer_factory(name="Loyal customer 2", business_id=setup_business.id)
    
    response = await client.get(
            f"/customers/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_customer_by_id_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ shuold return 404 for an id matching a customer but in another business for authorized client """
    c1= await customer_factory( name="Not-so-Loyal customer 1")
    c2= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)
    c3= await customer_factory(name="Loyal customer 2", business_id=setup_business.id)
    
    response = await client.get(
            f"/customers/{c1.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_customer_by_id_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ shuold return 401 for an id matching a customer business but unauthorized client """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    c1= await customer_factory( name="Not-so-Loyal customer 1")
    c2= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)
    c3= await customer_factory(name="Loyal customer 2", business_id=setup_business.id)
    
    response = await client.get(
            f"/customers/{c1.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

# --- PATCH Tests ---

@pytest.mark.asyncio
async def test_update_customer(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should update fields for a customers for said business for an authorized client """
    customer= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)
    
    # Full update
    response = await client.patch(
            f"/customers/{customer.id}",
            json={
                "name": "Updated name",
                "phone": "222222"
                },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()
    
    assert data["name"] == "Updated name"
    assert data["phone"] == "222222"

    # See if changes reflect on db

    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id,
                Customer.business_id == setup_business.id
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer.name == data["name"]
    assert db_customer.phone== data["phone"]

    # Partial update - name
    response = await client.patch(
            f"/customers/{customer.id}",
            json={
                "name": "Updated name v2",
                },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()
    
    assert data["name"] == "Updated name v2"
    assert data["phone"] == "222222"

    # See if changes reflect on db

    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id,
                Customer.business_id == setup_business.id
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer.name == data["name"]
    assert db_customer.phone== data["phone"]


    # Partial update - phone
    response = await client.patch(
            f"/customers/{customer.id}",
            json={
                "phone": "+11 1192 1923",
                },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()
    
    assert data["name"] == "Updated name v2"
    assert data["phone"] == "+11 1192 1923"

    # See if changes reflect on db

    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id,
                Customer.business_id == setup_business.id
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer.name == data["name"]
    assert db_customer.phone== data["phone"]

@pytest.mark.asyncio
async def test_update_customer_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return 404 when trying to update fields for a customers that doesn't exist for said business for an authorized client """
    # Full update
    response = await client.patch(
            f"/customers/{uuid.uuid4()}",
            json={
                "name": "Updated name",
                "phone": "222222"
                },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_customer_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return 404 when trying to update fields for a customers in another business for an authorized client """
    customer= await customer_factory( name="Loyal customer 1")
    
    # Full update
    response = await client.patch(
            f"/customers/{customer.id}",
            json={
                "name": "Updated name",
                "phone": "222222"
                },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    # See if changes reflect on db

    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id,
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer.name == customer.name 
    assert db_customer.phone == customer.phone

@pytest.mark.asyncio
async def test_update_customer_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return 401 when trying to update fields for a customers for said business for an unauthorized client """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    customer= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)
    
    # Full update
    response = await client.patch(
            f"/customers/{customer.id}",
            json={
                "name": "Updated name",
                "phone": "222222"
                },
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

    # See if changes reflect on db

    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id,
                Customer.business_id == setup_business.id
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer.name == customer.name 
    assert db_customer.phone == customer.phone

# --- DELETE Tests ---

@pytest.mark.asyncio
async def test_delete_customer(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return 204 when successfully delete a customer from business """
    customer= await customer_factory( name="Loyal customer 1", business_id=setup_business.id)

    response = await client.delete(
            f"/customers/{customer.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 204

    # Check if deleted from db
    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id,
                Customer.business_id == setup_business.id
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is None

@pytest.mark.asyncio
async def test_delete_customer_non_existing(client: AsyncClient, db_session: AsyncSession, setup_business):
    """ should return 404 when trying to delete a non-existing customer from business """
    response = await client.delete(
            f"/customers/{uuid.uuid4()}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_customer_another_business(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return 404 when trying to delete an existing customer but from another business """
    customer= await customer_factory( name="Not-so-loyal customer")

    response = await client.delete(
            f"/customers/{customer.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 404

    # Check if deleted from db
    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer == customer

@pytest.mark.asyncio
async def test_delete_customer_unauthorized(client: AsyncClient, db_session: AsyncSession, setup_business, customer_factory):
    """ should return 401 when trying to delete an existing customer from another business but client unauthorized """
    app.dependency_overrides[get_current_business] = mock_auth_failure

    customer= await customer_factory( name="Not-so-loyal customer")

    response = await client.delete(
            f"/customers/{customer.id}",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401

    # Check if deleted from db
    result = await db_session.execute(
            select(Customer)
            .where(
                Customer.id == customer.id
            )
    )

    db_customer = result.scalar_one_or_none()

    assert db_customer is not None
    assert db_customer == customer
