import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import crud_search
from mavito_common.models.term import Term
from mavito_common.models.user import User


@pytest.mark.asyncio
async def test_search_with_filters(db_session: AsyncSession, dummy_user: User):
    term1 = Term(
        id=uuid4(),
        term="Agricultural Statistics",
        language="English",
        domain="Agriculture",
        definition="...",
        owner_id=dummy_user.id,
    )
    term2 = Term(
        id=uuid4(),
        term="Landbou Statistiek",
        language="Afrikaans",
        domain="Agriculture",
        definition="...",
        owner_id=dummy_user.id,
    )
    db_session.add_all([term1, term2])
    await db_session.commit()

    results = await crud_search.search_terms_in_db(db=db_session, query="agri")
    assert len(results) == 1
    assert results[0][0].term == "Agricultural Statistics"

    results = await crud_search.search_terms_in_db(
        db=db_session, query="", language="Afrikaans"
    )
    assert len(results) == 1
    assert results[0][0].language == "Afrikaans"
