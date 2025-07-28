# vote-service/app/api/v1/endpoints/vote.py
from fastapi import APIRouter, Depends, HTTPException, status  # noqa: F401
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
import uuid

# Import the user dependency from the local deps.py
from app.deps import get_current_active_user

# Import the database dependency directly from the common library
from mavito_common.db.session import get_db
from mavito_common.models.user import User as UserModel
from mavito_common.models.term_vote import TermVote, VoteType
from mavito_common.models.term import Term  # noqa: F401

router = APIRouter()


class VoteCreate(BaseModel):
    term_id: uuid.UUID
    vote: VoteType


class VoteResponse(BaseModel):
    term_id: uuid.UUID
    upvotes: int
    downvotes: int
    user_vote: VoteType | None


@router.post(
    "/", response_model=VoteResponse, status_code=200
)  # Changed default status to 200 OK
async def cast_vote(
    *,
    db: AsyncSession = Depends(get_db),
    vote_in: VoteCreate,
    current_user: UserModel = Depends(get_current_active_user),
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

    # Recalculate and return the new totals
    count_stmt = select(
        func.count(TermVote.id).filter(TermVote.vote == VoteType.upvote),
        func.count(TermVote.id).filter(TermVote.vote == VoteType.downvote),
    ).where(TermVote.term_id == vote_in.term_id)

    result = await db.execute(count_stmt)
    upvotes, downvotes = result.one()

    return VoteResponse(
        term_id=vote_in.term_id,
        upvotes=upvotes,
        downvotes=downvotes,
        user_vote=user_vote_status,  # Return the final state of the user's vote
    )
