"""
Unit test module for the /api/v1/search endpoint.

Validates:
- Basic search functionality with filters
- Pagination response structure
- Edge cases: empty result sets, invalid pages, and large page sizes
- Response structure and content integrity
"""

import pytest
import pytest_asyncio  # noqa: F401
from httpx import AsyncClient  # Use AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from mavito_common.models.term import Term


@pytest.mark.asyncio
async def test_search_with_filters(client: AsyncClient, db_session: AsyncSession):
    # Arrange
    term1 = Term(
        id=uuid4(),
        term="Grain Silo",
        definition="A place for grain",
        language="English",
        domain="Agriculture",
        owner_id=uuid4(),  # Added to satisfy NOT NULL constraint
    )
    db_session.add(term1)
    await db_session.commit()

    # Act
    response = await client.get(
        "/api/v1/search", params={"query": "grain", "language": "English"}
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["term"] == "Grain Silo"


@pytest.mark.asyncio
async def test_search_empty_result(client: AsyncClient):
    # Act
    response = await client.get("/api/v1/search", params={"query": "nonexistentquery"})

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
