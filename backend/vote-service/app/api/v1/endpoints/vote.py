from fastapi import APIRouter, Depends, HTTPException, status  # noqa: F401
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
import uuid
from typing import Literal  # noqa: F401

# Import the user dependency from the local deps.py
from app.deps import get_current_active_user

# Import the database dependency directly from the common library
from mavito_common.db.session import get_db
from mavito_common.models.user import User as UserModel
from mavito_common.models.term_vote import TermVote, VoteType

# IMPORTANT: You MUST define a CommentVote model in mavito_common/models/comment_vote.py
# It should be similar to TermVote, but with a 'comment_id' field.
# Then, uncomment the following line:
# from mavito_common.models.comment_vote import CommentVote
# from mavito_common.models.term import Term # noqa: F401
# from mavito_common.models.comment import Comment # noqa: F401

router = APIRouter()


# --- Base Models for Voting ---
class VoteCreateBase(BaseModel):
    vote: VoteType


class VoteResponseBase(BaseModel):
    upvotes: int
    downvotes: int
    user_vote: VoteType | None


# --- Term Voting Endpoints and Models ---
class TermVoteCreate(VoteCreateBase):
    term_id: uuid.UUID


class TermVoteResponse(VoteResponseBase):
    term_id: uuid.UUID


@router.post("/terms", response_model=TermVoteResponse, status_code=200)
async def cast_term_vote(
    *,
    db: AsyncSession = Depends(get_db),
    vote_in: TermVoteCreate,
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Casts, updates, or removes a vote on a term for the current user.
    """
    existing_vote_stmt = select(TermVote).where(
        TermVote.user_id == current_user.id, TermVote.term_id == vote_in.term_id
    )
    result = await db.execute(existing_vote_stmt)
    db_vote = result.scalars().first()

    user_vote_status: VoteType | None = vote_in.vote

    if db_vote:
        # If the user is clicking the same button again, it's an un-vote.
        if db_vote.vote == vote_in.vote:
            await db.delete(db_vote)
            user_vote_status = None
        else:
            # If they are changing their vote (e.g., from down to up)
            db_vote.vote = vote_in.vote
            db.add(db_vote)
    else:
        # If no vote exists, create a new one
        db_vote = TermVote(
            user_id=current_user.id, term_id=vote_in.term_id, vote=vote_in.vote
        )
        db.add(db_vote)

    await db.commit()

    # Recalculate and return the new totals for the specific term
    count_stmt = select(
        func.count(TermVote.id).filter(TermVote.vote == VoteType.upvote),
        func.count(TermVote.id).filter(TermVote.vote == VoteType.downvote),
    ).where(TermVote.term_id == vote_in.term_id)

    result = await db.execute(count_stmt)
    upvotes, downvotes = result.one()

    return TermVoteResponse(
        term_id=vote_in.term_id,
        upvotes=upvotes,
        downvotes=downvotes,
        user_vote=user_vote_status,
    )


'''
# --- Comment Voting Endpoints and Models ---
class CommentVoteCreate(VoteCreateBase):
    comment_id: uuid.UUID

class CommentVoteResponse(VoteResponseBase):
    comment_id: uuid.UUID

@router.post(
    "/comments", response_model=CommentVoteResponse, status_code=200
)
async def cast_comment_vote(
    *,
    db: AsyncSession = Depends(get_db),
    vote_in: CommentVoteCreate,
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Casts, updates, or removes a vote on a comment for the current user.
    """
    # Query for existing comment vote
    existing_vote_stmt = select(CommentVote).where(
        CommentVote.user_id == current_user.id, CommentVote.comment_id == vote_in.comment_id
    )
    result = await db.execute(existing_vote_stmt)
    db_vote = result.scalars().first()

    user_vote_status: VoteType | None = vote_in.vote

    if db_vote:
        # If the user is clicking the same button again, it's an un-vote.
        if db_vote.vote == vote_in.vote:
            await db.delete(db_vote)
            user_vote_status = None
        else:
            # If they are changing their vote (e.g., from down to up)
            db_vote.vote = vote_in.vote
            db.add(db_vote)
    else:
        # If no vote exists, create a new one
        db_vote = CommentVote(
            user_id=current_user.id, comment_id=vote_in.comment_id, vote=vote_in.vote
        )
        db.add(db_vote)

    await db.commit()

    # Recalculate and return the new totals for the specific comment
    count_stmt = select(
        func.count(CommentVote.id).filter(CommentVote.vote == VoteType.upvote),
        func.count(CommentVote.id).filter(CommentVote.vote == VoteType.downvote),
    ).where(CommentVote.comment_id == vote_in.comment_id)

    result = await db.execute(count_stmt)
    upvotes, downvotes = result.one()

    return CommentVoteResponse(
        comment_id=vote_in.comment_id,
        upvotes=upvotes,
        downvotes=downvotes,
        user_vote=user_vote_status,
    )
'''
