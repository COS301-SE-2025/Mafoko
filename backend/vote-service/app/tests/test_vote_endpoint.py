import pytest
import pytest_asyncio  # noqa: F401
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

from mavito_common.models.user import User, UserRole
from mavito_common.models.term import Term
from mavito_common.models.comment import Comment
from mavito_common.models.term_vote import TermVote, VoteType
from mavito_common.models.comment_vote import CommentVote
from mavito_common.core.security import create_access_token


# Helper function to create a test user
async def create_test_user(db: AsyncSession) -> User:
    """Creates and commits a new test user to the database."""
    user = User(
        id=uuid4(),
        email=f"test_{uuid4()}@example.com",
        first_name="Test",
        last_name="User",
        password_hash="somehashedpassword",
        role=UserRole.contributor,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# Helper function to create a test term
async def create_test_term(db: AsyncSession, owner: User) -> Term:
    """Creates and commits a new test term to the database with a valid owner."""
    term = Term(
        id=uuid4(),
        term=f"Test Term {uuid4()}",
        definition="A term for testing.",
        language="English",
        domain="Testing",
        owner_id=owner.id,  # assign owner
    )
    db.add(term)
    await db.commit()
    await db.refresh(term)
    return term


# Helper function to create a test comment
async def create_test_comment(db: AsyncSession, user: User, term: Term) -> Comment:
    """Creates and commits a new test comment to the database."""
    comment = Comment(
        id=uuid4(),
        term_id=term.id,
        user_id=user.id,
        content="This is a test comment.",
        tombstone=False,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio


# --- Term Voting Tests ---


async def test_vote_requires_authentication(
    client: AsyncClient, db_session: AsyncSession
):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)

    response = await client.post(
        "/api/v1/votes/terms",
        json={"term_id": str(term.id), "vote": "upvote"},
    )
    assert response.status_code == 401


async def test_cast_new_upvote(client: AsyncClient, db_session: AsyncSession):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)
    token = create_access_token(data={"sub": user.email})

    response = await client.post(
        "/api/v1/votes/terms",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 1
    assert data["downvotes"] == 0
    assert data["user_vote"] == "upvote"

    result = await db_session.execute(
        select(TermVote).where(TermVote.user_id == user.id, TermVote.term_id == term.id)
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is not None
    assert vote_in_db.vote == VoteType.upvote


async def test_change_vote_from_up_to_down(
    client: AsyncClient, db_session: AsyncSession
):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)
    token = create_access_token(data={"sub": user.email})

    await client.post(
        "/api/v1/votes/terms",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.post(
        "/api/v1/votes/terms",
        json={"term_id": str(term.id), "vote": "downvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 0
    assert data["downvotes"] == 1
    assert data["user_vote"] == "downvote"

    result = await db_session.execute(
        select(TermVote).where(TermVote.user_id == user.id, TermVote.term_id == term.id)
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is not None and vote_in_db.vote == VoteType.downvote


async def test_unvote_an_existing_vote(client: AsyncClient, db_session: AsyncSession):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)
    token = create_access_token(data={"sub": user.email})

    await client.post(
        "/api/v1/votes/terms",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.post(
        "/api/v1/votes/terms",
        json={"term_id": str(term.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 0
    assert data["downvotes"] == 0
    assert data["user_vote"] is None

    result = await db_session.execute(
        select(TermVote).where(TermVote.user_id == user.id, TermVote.term_id == term.id)
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is None


# --- Comment Voting Tests ---


async def test_cast_new_comment_upvote(client: AsyncClient, db_session: AsyncSession):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)
    comment = await create_test_comment(db_session, user=user, term=term)
    token = create_access_token(data={"sub": user.email})

    response = await client.post(
        "/api/v1/votes/comments",
        json={"comment_id": str(comment.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 1
    assert data["downvotes"] == 0
    assert data["user_vote"] == "upvote"

    result = await db_session.execute(
        select(CommentVote).where(
            CommentVote.user_id == user.id, CommentVote.comment_id == comment.id
        )
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is not None
    assert vote_in_db.vote == VoteType.upvote


async def test_change_comment_vote_from_up_to_down(
    client: AsyncClient, db_session: AsyncSession
):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)
    comment = await create_test_comment(db_session, user=user, term=term)
    token = create_access_token(data={"sub": user.email})

    await client.post(
        "/api/v1/votes/comments",
        json={"comment_id": str(comment.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.post(
        "/api/v1/votes/comments",
        json={"comment_id": str(comment.id), "vote": "downvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 0
    assert data["downvotes"] == 1
    assert data["user_vote"] == "downvote"

    result = await db_session.execute(
        select(CommentVote).where(
            CommentVote.user_id == user.id, CommentVote.comment_id == comment.id
        )
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is not None and vote_in_db.vote == VoteType.downvote


async def test_unvote_an_existing_comment_vote(
    client: AsyncClient, db_session: AsyncSession
):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)
    comment = await create_test_comment(db_session, user=user, term=term)
    token = create_access_token(data={"sub": user.email})

    await client.post(
        "/api/v1/votes/comments",
        json={"comment_id": str(comment.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.post(
        "/api/v1/votes/comments",
        json={"comment_id": str(comment.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["upvotes"] == 0
    assert data["downvotes"] == 0
    assert data["user_vote"] is None

    result = await db_session.execute(
        select(CommentVote).where(
            CommentVote.user_id == user.id, CommentVote.comment_id == comment.id
        )
    )
    vote_in_db = result.scalars().first()
    assert vote_in_db is None


async def test_vote_on_deleted_comment_raises_error(
    client: AsyncClient, db_session: AsyncSession
):
    user = await create_test_user(db_session)
    term = await create_test_term(db_session, owner=user)
    comment = await create_test_comment(db_session, user=user, term=term)
    token = create_access_token(data={"sub": user.email})

    # Soft-delete the comment
    comment.tombstone = True
    await db_session.commit()

    response = await client.post(
        "/api/v1/votes/comments",
        json={"comment_id": str(comment.id), "vote": "upvote"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert "Comment not found or is deleted" in response.json()["detail"]
