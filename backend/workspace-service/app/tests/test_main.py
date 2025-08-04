import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"service": "Marito Workspace Service", "status": "ok"}


# Add more tests for authenticated endpoints as needed
# These would require setting up test database and authentication mocks
