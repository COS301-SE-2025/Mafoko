import pytest
import pytest_asyncio  # noqa: F401
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.crud import crud_search
from mavito_common.models.term import Term


@pytest.mark.asyncio
async def test_search_by_query(db_session: AsyncSession):
    # Arrange: Add data needed specifically for this test
    term1 = Term(
        id=uuid4(),
        term="Agricultural Statistics",
        language="English",
        domain="Agriculture",
        definition="...",
    )
    db_session.add(term1)
    await db_session.commit()

    # Act
    results = await crud_search.search_terms_in_db(db=db_session, query="agri")

    # Assert
    assert len(results) == 1
    assert results[0][0].term == "Agricultural Statistics"


@pytest.mark.asyncio
async def test_search_by_language(db_session: AsyncSession):
    # Arrange
    term1 = Term(
        id=uuid4(),
        term="Landbou Statistiek",
        language="Afrikaans",
        domain="Agriculture",
        definition="...",
    )
    db_session.add(term1)
    await db_session.commit()

    # Act
    results = await crud_search.search_terms_in_db(
        db=db_session, query="", language="Afrikaans"
    )

    # Assert
    assert len(results) == 1
    assert results[0][0].language == "Afrikaans"


@pytest.mark.asyncio
async def test_suggest_terms_in_db(db_session: AsyncSession):
    # Arrange: Use data that actually starts with the query
    term1 = Term(
        id=uuid4(),
        term="Statistics in Agriculture",
        language="English",
        domain="Agriculture",
        definition="...",
    )
    term2 = Term(
        id=uuid4(),
        term="Statistieke vir Landbou",
        language="Afrikaans",
        domain="Agriculture",
        definition="...",
    )
    term3 = Term(
        id=uuid4(),
        term="Computer Science",
        language="English",
        domain="Technology",
        definition="...",
    )
    db_session.add_all([term1, term2, term3])
    await db_session.commit()

    # Act
    results = await crud_search.suggest_terms_in_db(db=db_session, query="Statis")

    # Assert
    assert len(results) == 2  # Should now correctly find 2 results
    term_names = {t.term for t in results}
    assert "Statistics in Agriculture" in term_names
    assert "Statistieke vir Landbou" in term_names
