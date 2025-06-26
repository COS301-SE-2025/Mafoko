import pytest
import pytest_asyncio  # noqa: F401
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

from mavito_common.models.user import User, UserRole
from mavito_common.models.term import Term
from mavito_common.models.term_vote import TermVote, VoteType
from mavito_common.core.security import create_access_token


# Helper function to create a test user
async def create_test_user(db: AsyncSession) -> User:
    user = User(
        id=uuid4(),
        email="test@example.com",
        first_name="Test",
        last_name="User",
        password_hash="somehashedpassword",  # Hashing not needed for this test's scope
        role=UserRole.contributor,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    return user


# Helper function to create a test term
async def create_test_term(db: AsyncSession) -> Term:
    term = Term(
        id=uuid4(),
        term="Test Term",
        definition="A term for testing.",
        language="English",
        domain="Testing",
    )
    db.add(term)
    await db.commit()
    return term


# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio


async def test_vote_requires_authentication(
    client: AsyncClient, db_session: AsyncSession
):
    """
    Tests that unauthenticated requests are rejected.
    """
    term = await create_test_term(db_session)
    response = await client.post(
        "/api/v1/votes/",
        json={"term_id": str(term.id), "vote": "upvote"},
    )
    assert response.status_code == 401  # Or 403 depending on your setup


async def test_cast_new_upvote(client: AsyncClient, db_session: AsyncSession):
    """
    Tests casting a new upvote on a term.
    """
    user = await create_test_user(db_session)
    term = await create_test_term(db_session)
    token = create_access_token(data={"sub": user.email})

    response = await client.post(
        "/api/v1/votes/",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # 1. Check API response
    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 1
    assert data["downvotes"] == 0
    assert data["user_vote"] == "upvote"

    # 2. Check database state
    result = await db_session.execute(
        select(TermVote).where(
            TermVote.user_id == user.id,
            TermVote.term_id == term.id,
        )
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is not None
    assert vote_in_db.vote == VoteType.upvote


async def test_change_vote_from_up_to_down(
    client: AsyncClient, db_session: AsyncSession
):
    """
    Tests changing an existing upvote to a downvote.
    """
    user = await create_test_user(db_session)
    term = await create_test_term(db_session)
    token = create_access_token(data={"sub": user.email})

    # First, cast an upvote
    await client.post(
        "/api/v1/votes/",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Then, change to a downvote
    response = await client.post(
        "/api/v1/votes/",
        json={"term_id": str(term.id), "vote": "downvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 0
    assert data["downvotes"] == 1
    assert data["user_vote"] == "downvote"

    result = await db_session.execute(
        select(TermVote).where(
            TermVote.user_id == user.id,
            TermVote.term_id == term.id,
        )
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is not None and vote_in_db.vote == VoteType.downvote


async def test_unvote_an_existing_vote(client: AsyncClient, db_session: AsyncSession):
    """
    Tests removing a vote by casting the same vote again.
    """
    user = await create_test_user(db_session)
    term = await create_test_term(db_session)
    token = create_access_token(data={"sub": user.email})

    # First, cast an upvote
    await client.post(
        "/api/v1/votes/",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Then, cast the same upvote again to un-vote
    response = await client.post(
        "/api/v1/votes/",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 0
    assert data["downvotes"] == 0
    assert data["user_vote"] is None  # User's vote is now null

    result = await db_session.execute(
        select(TermVote).where(
            TermVote.user_id == user.id,
            TermVote.term_id == term.id,
        )
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is None  # The record should be deleted from the database
