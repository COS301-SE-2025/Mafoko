# search-service/app/crud/crud_search.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload
from typing import List, Optional
from mavito_common.models.term import Term
from mavito_common.models.term_vote import TermVote, VoteType


async def search_terms_in_db(
    db: AsyncSession,
    query: str,
    language: Optional[str] = None,
    domain: Optional[str] = None,
    sort_by: str = "name",
) -> List:  # The function will now return tuples of (Term, upvotes, downvotes)

    # --- NEW: Subquery to count upvotes and downvotes ---
    # This creates two columns: 'upvote_count' and 'downvote_count'
    vote_counts = (
        select(
            TermVote.term_id,
            func.count(case((TermVote.vote == VoteType.upvote, TermVote.id))).label(
                "upvote_count"
            ),
            func.count(case((TermVote.vote == VoteType.downvote, TermVote.id))).label(
                "downvote_count"
            ),
        )
        .group_by(TermVote.term_id)
        .subquery()
    )

    # --- NEW: The main query now joins with the vote counts ---
    stmt = (
        select(Term, vote_counts.c.upvote_count, vote_counts.c.downvote_count)
        .outerjoin(vote_counts, Term.id == vote_counts.c.term_id)
        .options(selectinload(Term.translations))
    )

    if query:
        stmt = stmt.where(Term.term.ilike(f"%{query}%"))
    if language:
        stmt = stmt.where(Term.language == language)
    if domain:
        stmt = stmt.where(Term.domain == domain)

    if sort_by == "name":
        stmt = stmt.order_by(Term.term)
    elif sort_by == "popularity":
        # Now we can sort by popularity!
        # We use coalesce to treat NULL counts (for terms with 0 votes) as 0.
        popularity = func.coalesce(vote_counts.c.upvote_count, 0) - func.coalesce(
            vote_counts.c.downvote_count, 0
        )
        stmt = stmt.order_by(popularity.desc())

    result = await db.execute(stmt)
    return list(result.all())


async def suggest_terms_in_db(db: AsyncSession, query: str) -> List[Term]:
    if not query:
        return []

    stmt = (
        select(Term).where(Term.term.ilike(f"{query}%")).order_by(Term.term).limit(10)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
