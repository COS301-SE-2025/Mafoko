from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any, Union
from uuid import UUID

from mavito_common.models.user_preferences import (
    UserPreferences as UserPreferencesModel,
)
from mavito_common.schemas.user_preferences import (
    UserPreferencesCreate,
    UserPreferencesUpdate,
)


class CRUDUserPreferences:
    async def get_user_preferences(
        self, db: AsyncSession, *, user_id: UUID
    ) -> Optional[UserPreferencesModel]:
        """Get user preferences by user ID"""
        result = await db.execute(
            select(UserPreferencesModel).filter(UserPreferencesModel.user_id == user_id)
        )
        return result.scalars().first()

    async def create_user_preferences(
        self, db: AsyncSession, *, obj_in: UserPreferencesCreate
    ) -> UserPreferencesModel:
        """Create new user preferences"""
        preferences_data = obj_in.model_dump()
        db_obj = UserPreferencesModel(**preferences_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_user_preferences(
        self,
        db: AsyncSession,
        *,
        db_obj: UserPreferencesModel,
        obj_in: Union[UserPreferencesUpdate, Dict[str, Any]],
    ) -> UserPreferencesModel:
        """Update existing user preferences"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_or_create_user_preferences(
        self, db: AsyncSession, *, user_id: UUID
    ) -> UserPreferencesModel:
        """Get user preferences or create default ones if they don't exist"""
        preferences = await self.get_user_preferences(db, user_id=user_id)
        if not preferences:
            # Create default preferences
            preferences_create = UserPreferencesCreate(user_id=user_id)
            preferences = await self.create_user_preferences(
                db, obj_in=preferences_create
            )
        return preferences

    async def delete_user_preferences(
        self, db: AsyncSession, *, user_id: UUID
    ) -> Optional[UserPreferencesModel]:
        """Delete user preferences by user ID"""
        preferences = await self.get_user_preferences(db, user_id=user_id)
        if preferences:
            await db.delete(preferences)
            await db.commit()
        return preferences


crud_user_preferences = CRUDUserPreferences()
