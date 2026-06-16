import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import patch, MagicMock
import uuid

TEST_USER_ID = str(uuid.uuid4())

mock_user = MagicMock()
mock_user.id = TEST_USER_ID

mock_response = MagicMock()
mock_response.user = mock_user

@pytest.fixture
def mock_supabase():
    with patch("app.dependencies.auth.supabase.auth.get_user", return_value=mock_response):
        with patch("app.routers.business.supabase.auth.get_user", return_value=mock_response):
            yield

@pytest.mark.asyncio
async def test_create_business(mock_supabase):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
                "/businesses",
                json={"name": "Test Business", "phone": "+54 123456"},
                headers={"Authorization": "Bearer faketoken"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Business"


@pytest.mark.asyncio
async def test_get_me(mock_supabase):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
                "/businesses/me",
                headers={"Authorization": "Bearer faketoken"}
        )
        assert response.status_code == 200

