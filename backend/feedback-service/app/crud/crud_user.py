from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from mavito_common.models.user import User


class CRUDUser:
    def __init__(self, model: type[User]):
        self.model = model

    async def get_user_by_email(
        self, db: AsyncSession, *, email: str
    ) -> Optional[User]:
        """Get user by email."""
        result = await db.execute(select(self.model).where(self.model.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_uuid(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> Optional[User]:
        """Get user by UUID."""
        result = await db.execute(select(self.model).where(self.model.id == user_id))
        return result.scalar_one_or_none()

    async def is_user_active(self, user: User) -> bool:
        """Check if user is active and not locked."""
        return user.is_active and not user.account_locked


# Create instance
crud_user = CRUDUser(User)
