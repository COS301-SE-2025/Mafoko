import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from mavito_common.models.user_level import (
    UserLevel,
    calculate_level_from_xp,
    calculate_xp_for_level,
    calculate_xp_for_next_level,
)
from mavito_common.models.user_xp import UserXP
from mavito_common.schemas.user_level import UserLevelCreate, UserLevelUpdate


class CRUDUserLevel:
    async def get_user_level(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> Optional[UserLevel]:
        """Get user level record."""
        stmt = select(UserLevel).where(UserLevel.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def create_user_level(
        self, db: AsyncSession, *, obj_in: UserLevelCreate
    ) -> UserLevel:
        """Create a new user level record."""
        db_obj = UserLevel(
            user_id=obj_in.user_id,
            current_level=obj_in.current_level,
            total_xp=obj_in.total_xp,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_user_level(
        self, db: AsyncSession, *, db_obj: UserLevel, obj_in: UserLevelUpdate
    ) -> UserLevel:
        """Update user level record."""
        if obj_in.current_level is not None:
            db_obj.current_level = obj_in.current_level
        if obj_in.total_xp is not None:
            db_obj.total_xp = obj_in.total_xp

        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def calculate_and_update_user_level(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> UserLevel:
        """Calculate user's total XP and update their level."""
        stmt = select(func.sum(UserXP.xp_amount)).where(UserXP.user_id == user_id)
        result = await db.execute(stmt)
        total_xp = result.scalar() or 0

        new_level = calculate_level_from_xp(total_xp)

        user_level = await self.get_user_level(db=db, user_id=user_id)

        if user_level is None:
            level_create = UserLevelCreate(
                user_id=user_id, current_level=new_level, total_xp=total_xp
            )
            return await self.create_user_level(db=db, obj_in=level_create)
        else:
            level_update = UserLevelUpdate(current_level=new_level, total_xp=total_xp)
            return await self.update_user_level(
                db=db, db_obj=user_level, obj_in=level_update
            )

    async def get_user_level_with_progress(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> dict:
        """Get user level with progress information."""
        user_level = await self.calculate_and_update_user_level(db=db, user_id=user_id)

        current_level_xp_requirement = calculate_xp_for_level(user_level.current_level)
        xp_for_next_level = calculate_xp_for_next_level(user_level.current_level)
        xp_progress_in_level = user_level.total_xp - current_level_xp_requirement

        return {
            "id": user_level.id,
            "user_id": user_level.user_id,
            "current_level": user_level.current_level,
            "total_xp": user_level.total_xp,
            "xp_for_next_level": xp_for_next_level,
            "xp_progress_in_level": xp_progress_in_level,
        }


crud_user_level = CRUDUserLevel()
