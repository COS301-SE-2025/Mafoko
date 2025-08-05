from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid

from mavito_common.models.bookmark import TermBookmark, GlossaryBookmark


class CRUDBookmark:
    async def get_user_term_bookmarks(
        self, db: AsyncSession, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[TermBookmark]:
        """Get all term bookmarks for a user."""
        result = await db.execute(
            select(TermBookmark)
            .where(TermBookmark.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(TermBookmark.created_at.desc())
        )
        return result.scalars().all()

    async def get_user_glossary_bookmarks(
        self, db: AsyncSession, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[GlossaryBookmark]:
        """Get all glossary bookmarks for a user."""
        result = await db.execute(
            select(GlossaryBookmark)
            .where(GlossaryBookmark.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(GlossaryBookmark.created_at.desc())
        )
        return result.scalars().all()

    async def create_term_bookmark(
        self, db: AsyncSession, *, user_id: uuid.UUID, term_id: uuid.UUID
    ) -> TermBookmark:
        """Create a new term bookmark."""
        bookmark = TermBookmark(user_id=user_id, term_id=term_id)
        db.add(bookmark)
        await db.commit()
        await db.refresh(bookmark)
        return bookmark

    async def create_glossary_bookmark(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        domain: str,
        description: Optional[str] = None,
        term_count: int = 0
    ) -> GlossaryBookmark:
        """Create a new glossary bookmark."""
        bookmark = GlossaryBookmark(
            user_id=user_id,
            domain=domain,
            description=description,
            term_count=term_count,
        )
        db.add(bookmark)
        await db.commit()
        await db.refresh(bookmark)
        return bookmark

    async def get_term_bookmark(
        self, db: AsyncSession, *, user_id: uuid.UUID, term_id: uuid.UUID
    ) -> Optional[TermBookmark]:
        """Get a specific term bookmark."""
        result = await db.execute(
            select(TermBookmark).where(
                and_(TermBookmark.user_id == user_id, TermBookmark.term_id == term_id)
            )
        )
        return result.scalar_one_or_none()

    async def get_glossary_bookmark(
        self, db: AsyncSession, *, user_id: uuid.UUID, domain: str
    ) -> Optional[GlossaryBookmark]:
        """Get a specific glossary bookmark."""
        result = await db.execute(
            select(GlossaryBookmark).where(
                and_(
                    GlossaryBookmark.user_id == user_id,
                    GlossaryBookmark.domain == domain,
                )
            )
        )
        return result.scalar_one_or_none()

    async def delete_term_bookmark(
        self, db: AsyncSession, *, bookmark: TermBookmark
    ) -> bool:
        """Delete a term bookmark."""
        await db.delete(bookmark)
        await db.commit()
        return True

    async def delete_glossary_bookmark(
        self, db: AsyncSession, *, bookmark: GlossaryBookmark
    ) -> bool:
        """Delete a glossary bookmark."""
        await db.delete(bookmark)
        await db.commit()
        return True


crud_bookmark = CRUDBookmark()
