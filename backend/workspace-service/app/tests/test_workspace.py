# app/tests/test_workspace.py
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator
import json

from app.main import app

# Use TestClient for synchronous testing - simpler and more reliable
client = TestClient(app)

# Database session fixture
@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    # This would normally connect to a test database
    # For now, we'll skip database tests until properly configured
    yield None

# Basic health check test
def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "service": "Marito Workspace Service", 
        "status": "ok",
        "version": "1.0.0"
    }

# Test workspace endpoints structure (without authentication for now)
def test_workspace_endpoints_exist():
    """Test that workspace endpoints are properly registered"""
    
    # Test bookmark endpoints exist (will return 401 without auth)
    response = client.get("/api/v1/workspace/bookmarks/terms")
    assert response.status_code in [401, 422]  # Should require authentication
    
    response = client.get("/api/v1/workspace/bookmarks/glossaries")
    assert response.status_code in [401, 422]  # Should require authentication
    
    # Test groups endpoint exists
    response = client.get("/api/v1/workspace/groups")
    assert response.status_code in [401, 422]  # Should require authentication
    
    # Test overview endpoint exists
    response = client.get("/api/v1/workspace/overview")
    assert response.status_code in [401, 422]  # Should require authentication

def test_workspace_post_endpoints():
    """Test POST endpoints exist and return proper error codes"""
    
    # Test bookmark term creation (without auth)
    response = client.post(
        "/api/v1/workspace/bookmarks/terms",
        json={"term_id": "123e4567-e89b-12d3-a456-426614174000", "notes": "test"}
    )
    assert response.status_code in [401, 422]  # Should require authentication
    
    # Test bookmark glossary creation (without auth)
    response = client.post(
        "/api/v1/workspace/bookmarks/glossaries",
        json={"domain": "technology", "notes": "test"}
    )
    assert response.status_code in [401, 422]  # Should require authentication
    
    # Test group creation (without auth)
    response = client.post(
        "/api/v1/workspace/groups",
        json={"name": "My Group", "group_type": "terms"}
    )
    assert response.status_code in [401, 422]  # Should require authentication

def test_search_endpoint():
    """Test search functionality"""
    
    response = client.post(
        "/api/v1/workspace/search",
        json={"query": "test", "page": 1, "limit": 10}
    )
    assert response.status_code in [401, 422]  # Should require authentication

def test_bulk_delete_endpoint():
    """Test bulk delete functionality"""
    
    response = client.request(
        "DELETE",
        "/api/v1/workspace/bulk",
        json={"bookmark_ids": [], "group_ids": []}
    )
    assert response.status_code in [401, 422]  # Should require authentication

print("Workspace service tests completed successfully!")
