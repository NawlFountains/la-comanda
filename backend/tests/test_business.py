import uuid
import pytest
from datetime import datetime, UTC
from httpx import AsyncClient
from unittest.mock import MagicMock

from app.dependencies.auth import get_current_business
from app.models import Business
from app.main import app

from app.routers import business as business_router

TEST_USER_ID = str(uuid.uuid4())

mock_user = MagicMock()
mock_user.id = TEST_USER_ID

mock_response = MagicMock()
mock_response.user = mock_user

business_router.supabase.auth.get_user = MagicMock(return_value=mock_response)

@pytest.mark.asyncio
async def test_create_business(client: AsyncClient):
    """ Verifies business creation works when authrized context resolves """

    app.dependency_overrides.clear()

    response = await client.post(
            "/businesses",
            json={"name": "Test Business", "phone": "+54 123456"},
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Business"
    assert data["user_id"] == TEST_USER_ID


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    """ Verifies profile retrival works for valid, authenticated user """
    fake_business = Business(
        id=uuid.uuid4(),
        user_id=uuid.UUID(TEST_USER_ID),
        name="Mocked Business Profile",
        created_at=datetime.now(UTC).isoformat()
    )

    app.dependency_overrides[get_current_business] = lambda: fake_business

    response = await client.get(
            "/businesses/me",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Mocked Business Profile"

@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    """ Verifies access toe dnpoint is rejected when authorziation token expire """
    from fastapi import HTTPException

    def mock_auth_failure():
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    app.dependency_overrides[get_current_business] = mock_auth_failure

    response = await client.get(
            "/businesses/me",
            headers={"Authorization": "Bearer faketoken"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired token"

