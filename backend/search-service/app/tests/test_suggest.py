import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import crud_search
from mavito_common.models.term import Term
from mavito_common.models.user import User


@pytest.mark.asyncio
async def test_suggest_terms_in_db(db_session: AsyncSession, dummy_user: User):
    terms = [
        Term(
            id=uuid4(),
            term="Statistics in Agriculture",
            language="English",
            domain="Agriculture",
            definition="...",
            owner_id=dummy_user.id,
        ),
        Term(
            id=uuid4(),
            term="Statistieke vir Landbou",
            language="Afrikaans",
            domain="Agriculture",
            definition="...",
            owner_id=dummy_user.id,
        ),
        Term(
            id=uuid4(),
            term="Computer Science",
            language="English",
            domain="Technology",
            definition="...",
            owner_id=dummy_user.id,
        ),
    ]
    db_session.add_all(terms)
    await db_session.commit()

    results = await crud_search.suggest_terms_in_db(db=db_session, query="Statis")
    assert len(results) == 2
    term_names = {t.term for t in results}
    assert "Statistics in Agriculture" in term_names
    assert "Statistieke vir Landbou" in term_names


@pytest.mark.asyncio
async def test_suggest_term_limit(db_session: AsyncSession, dummy_user: User):
    terms = [
        Term(
            id=uuid4(),
            term=f"Term{i}",
            language="English",
            domain="Test",
            definition="...",
            owner_id=dummy_user.id,
        )
        for i in range(15)
    ]
    db_session.add_all(terms)
    await db_session.commit()

    results = await crud_search.suggest_terms_in_db(db=db_session, query="Term")
    assert len(results) <= 10


@pytest.mark.asyncio
async def test_suggest_exact_prefix_only(db_session: AsyncSession, dummy_user: User):
    terms = [
        Term(
            id=uuid4(),
            term="Biology Basics",
            language="English",
            domain="Science",
            definition="...",
            owner_id=dummy_user.id,
        ),
        Term(
            id=uuid4(),
            term="Zoology",
            language="English",
            domain="Science",
            definition="...",
            owner_id=dummy_user.id,
        ),
    ]
    db_session.add_all(terms)
    await db_session.commit()

    results = await crud_search.suggest_terms_in_db(db=db_session, query="Bio")
    assert all(t.term.startswith("Bio") for t in results)
