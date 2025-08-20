from sqlalchemy import select
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy.orm import selectinload
from mavito_common.models.linguist_application import (
    LinguistApplication,
    ApplicationStatus,
)
from mavito_common.schemas.linguist_application import LinguistApplicationCreate


class CRUDLinguistApplication:
    async def create_application(
        self, db: AsyncSession, *, user_id: UUID, obj_in: LinguistApplicationCreate
    ) -> LinguistApplication:
        """
        Create a new linguist application record for a user.
        """

        db_obj = LinguistApplication(
            **obj_in.model_dump(), user_id=user_id, status="pending"
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_user_id(
        self, db: AsyncSession, *, user_id: UUID
    ) -> Optional[LinguistApplication]:
        """
        Retrieve the latest linguist application for a given user ID.
        """
        result = await db.execute(
            select(LinguistApplication)
            .where(LinguistApplication.user_id == user_id)
            .order_by(LinguistApplication.submitted_at.desc())
        )
        return result.scalars().first()

    async def get_all(self, db: AsyncSession) -> List[LinguistApplication]:
        """
        Retrieve all linguist applications.
        """
        result = await db.execute(select(LinguistApplication))
        return result.scalars().all()

    async def update_status(
        self, db: AsyncSession, *, application_id: UUID, new_status: ApplicationStatus
    ) -> Optional[LinguistApplication]:
        """
        Update the status of a specific linguist application.
        """
        application = await self.get_by_id(db, application_id=application_id)
        if application:
            application.status = new_status
            await db.commit()
            await db.refresh(application)
        return application

    async def get_by_id(
        self, db: AsyncSession, *, application_id: UUID
    ) -> Optional[LinguistApplication]:
        """
        Retrieve a single linguist application by its ID.
        """
        result = await db.execute(
            select(LinguistApplication).where(LinguistApplication.id == application_id)
        )
        return result.scalar_one_or_none()

    async def get_application_status(
        self, db: AsyncSession, *, application_id: UUID
    ) -> Optional[ApplicationStatus]:
        """
        Retrieve the status of a specific linguist application.
        """
        application = await self.get_by_id(db, application_id=application_id)
        if application:
            return application.status
        return None

    async def get_all_with_users(self, db: AsyncSession) -> List[LinguistApplication]:
        """
        Retrieve all linguist applications and eagerly load the associated users.
        """
        result = await db.execute(
            select(LinguistApplication).options(selectinload(LinguistApplication.user))
        )
        return result.scalars().all()


crud_linguist_application = CRUDLinguistApplication()
