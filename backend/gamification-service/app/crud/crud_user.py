import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from mavito_common.models.user import User as UserModel


class CRUDUser:
    async def get_user_by_id(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> Optional[UserModel]:
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_user_by_email(
        self, db: AsyncSession, *, email: str
    ) -> Optional[UserModel]:
        stmt = select(UserModel).where(UserModel.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def is_user_active(self, user: UserModel) -> bool:
        """
        Check if user is active (not deleted, not locked, is_active=True).
        """
        return user.is_active and not user.account_locked and user.deleted_at is None


crud_user = CRUDUser()
