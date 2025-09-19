import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from mavito_common.models.user_xp import UserXP
from mavito_common.schemas.user_xp import UserXPCreate


class CRUDUserXP:
    async def create_xp_record(
        self, db: AsyncSession, *, obj_in: UserXPCreate
    ) -> UserXP:
        """Create a new XP record for a user."""
        db_obj = UserXP(
            user_id=obj_in.user_id,
            xp_amount=obj_in.xp_amount,
            xp_source=obj_in.xp_source,
            source_reference_id=obj_in.source_reference_id,
            description=obj_in.description,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_user_xp_records(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> List[UserXP]:
        """Get all XP records for a user, ordered by creation date (newest first)."""
        stmt = (
            select(UserXP)
            .where(UserXP.user_id == user_id)
            .order_by(desc(UserXP.created_at))
        )
        result = await db.execute(stmt)
        return result.scalars().all()


crud_user_xp = CRUDUserXP()
