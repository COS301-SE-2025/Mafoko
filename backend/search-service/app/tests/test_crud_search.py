import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import crud_search
from mavito_common.models.term import Term
from mavito_common.models.user import User


@pytest.mark.asyncio
async def test_exact_prefix_match(db_session: AsyncSession, dummy_user: User):
    term = Term(
        id=uuid4(),
        term="Banana Farming",
        language="English",
        domain="Agriculture",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add(term)
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="Banana", fuzzy=False
    )
    assert any("Banana Farming" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_fuzzy_prefix_match(db_session: AsyncSession, dummy_user: User):
    term = Term(
        id=uuid4(),
        term="Banana Farming",
        language="English",
        domain="Agriculture",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add(term)
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="Banana", fuzzy=True
    )
    assert any("Banana Farming" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_case_prefix_match(db_session: AsyncSession, dummy_user: User):
    term = Term(
        id=uuid4(),
        term="Banana Farming",
        language="English",
        domain="Agriculture",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add(term)
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="nana", fuzzy=True
    )
    assert any("Banana Farming" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_fuzzy_substring_match(db_session: AsyncSession, dummy_user: User):
    term = Term(
        id=uuid4(),
        term="Remote Sensing",
        language="English",
        domain="Science",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add(term)
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="mote", fuzzy=True
    )
    assert any("Remote Sensing" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_nonfuzzy_substring_match(db_session: AsyncSession, dummy_user: User):
    term = Term(
        id=uuid4(),
        term="Remote Sensing",
        language="English",
        domain="Science",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add(term)
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="remote", fuzzy=False
    )
    assert any("Remote Sensing" == t.term for t, _, _ in results)


@pytest.mark.asyncio
async def test_no_prefix_match(db_session: AsyncSession, dummy_user: User):
    term = Term(
        id=uuid4(),
        term="Photosynthesis",
        language="English",
        domain="Biology",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add(term)
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="synthesis", fuzzy=False
    )
    assert len(results) == 0


@pytest.mark.asyncio
async def test_case_insensitive_search(db_session: AsyncSession, dummy_user: User):
    term = Term(
        id=uuid4(),
        term="Evapotranspiration",
        language="English",
        domain="Climate",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add(term)
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="EVAPO", fuzzy=False
    )
    assert any(t.term == "Evapotranspiration" for t, _, _ in results)


@pytest.mark.asyncio
async def test_sort_by_name(db_session: AsyncSession, dummy_user: User):
    db_session.add_all(
        [
            Term(
                id=uuid4(),
                term="Zebra",
                language="English",
                domain="Wildlife",
                definition="...",
                owner_id=dummy_user.id,
            ),
            Term(
                id=uuid4(),
                term="Antelope",
                language="English",
                domain="Wildlife",
                definition="...",
                owner_id=dummy_user.id,
            ),
        ]
    )
    await db_session.commit()

    results = await crud_search.search_terms_in_db(
        db=db_session, query="", sort_by="name"
    )
    assert results[0][0].term == "Antelope"
