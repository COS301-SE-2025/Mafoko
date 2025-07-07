import pytest
import pytest_asyncio  # noqa: F401
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

# from mavito_common.models.term_vote import TermVote, VoteType
from app.crud import crud_search
from mavito_common.models.term import Term


@pytest.mark.asyncio
async def test_exact_prefix_match(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Banana Farming",
        language="English",
        domain="Agriculture",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="Banana", fuzzy=False
    )
    assert any("Banana Farming" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_fuzzy_prefix_match(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Banana Farming",
        language="English",
        domain="Agriculture",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="Banana", fuzzy=True
    )
    assert any("Banana Farming" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_case_prefix_match(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Banana Farming",
        language="English",
        domain="Agriculture",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="nana", fuzzy=True
    )
    assert any("Banana Farming" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_fuzzy_substring_match(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Remote Sensing",
        language="English",
        domain="Science",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="mote", fuzzy=True
    )
    assert any("Remote Sensing" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_nonfuzzy_substring_match(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Remote Sensing",
        language="English",
        domain="Science",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="remote", fuzzy=False
    )
    assert any("Remote Sensing" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_no_prefix_match(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Photosynthesis",
        language="English",
        domain="Biology",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="synthesis", fuzzy=False
    )
    assert len(results) == 0


@pytest.mark.asyncio
async def test_case_insensitive_search(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Evapotranspiration",
        language="English",
        domain="Climate",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="EVAPO", fuzzy=False
    )
    assert any(t.term == "Evapotranspiration" for t, _, _ in results)


@pytest.mark.asyncio
async def test_sort_by_name(db_session: AsyncSession):
    db_session.add_all(
        [
            Term(
                id=uuid4(),
                term="Zebra",
                language="English",
                domain="Wildlife",
                definition="...",
            ),
            Term(
                id=uuid4(),
                term="Antelope",
                language="English",
                domain="Wildlife",
                definition="...",
            ),
        ]
    )
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="", sort_by="name"
    )
    assert results[0][0].term == "Antelope"


@pytest.mark.asyncio
async def test_filter_by_domain(db_session: AsyncSession):
    term = Term(
        id=uuid4(),
        term="Organic Chemistry",
        language="English",
        domain="Chemistry",
        definition="...",
    )
    db_session.add(term)
    await db_session.commit()
    results = await crud_search.search_terms_in_db(
        db=db_session, query="Organic", domain="Chemistry"
    )
    assert len(results) == 1


@pytest.mark.asyncio
async def test_suggest_exact_prefix_only(db_session: AsyncSession):
    db_session.add_all(
        [
            Term(
                id=uuid4(),
                term="Biology Basics",
                language="English",
                domain="Science",
                definition="...",
            ),
            Term(
                id=uuid4(),
                term="Zoology",
                language="English",
                domain="Science",
                definition="...",
            ),
        ]
    )
    await db_session.commit()
    results = await crud_search.suggest_terms_in_db(db=db_session, query="Bio")
    assert all(t.term.startswith("Bio") for t in results)


@pytest.mark.asyncio
async def test_suggest_term_limit(db_session: AsyncSession):
    terms = [
        Term(
            id=uuid4(),
            term=f"Term{i}",
            language="English",
            domain="Test",
            definition="...",
        )
        for i in range(15)
    ]
    db_session.add_all(terms)
    await db_session.commit()
    results = await crud_search.suggest_terms_in_db(db=db_session, query="Term")
    assert len(results) <= 10


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
