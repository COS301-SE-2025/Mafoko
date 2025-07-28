from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from mavito_common.models.linguist_application import LinguistApplication
from mavito_common.schemas.linguist_application import LinguistApplicationCreate


class CRUDLinguistApplication:
    async def create_application(
        self, db: AsyncSession, *, user_id: UUID, obj_in: LinguistApplicationCreate
    ) -> LinguistApplication:
        """
        Create a new linguist application record for a user.
        """
        # Create the database model instance from the Pydantic schema
        db_obj = LinguistApplication(
            **obj_in.model_dump(),
            user_id=user_id,
            status="pending",  # Explicitly set the initial status
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


crud_linguist_application = CRUDLinguistApplication()
