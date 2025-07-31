import pytest
import pytest_asyncio  # noqa: F401
from httpx import AsyncClient  # Use AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from mavito_common.models.term import Term


@pytest.mark.asyncio
async def test_suggest_endpoint(client: AsyncClient, db_session: AsyncSession):
    # Arrange
    term1 = Term(
        id=uuid4(),
        term="Service Level Agreement",
        definition="SLA",
        language="English",
        domain="Business",
    )
    term2 = Term(
        id=uuid4(),
        term="Server Maintenance",
        definition="Maint",
        language="English",
        domain="Technology",
    )
    db_session.add_all([term1, term2])
    await db_session.commit()

    # Act
    response = await client.get("/api/v1/suggest", params={"query": "Serv"})

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
