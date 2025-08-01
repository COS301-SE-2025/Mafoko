# app/crud/crud_user.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Union, Dict, Any
from uuid import UUID

from mavito_common.models.user import User as UserModel
from mavito_common.schemas.user import UserCreate, UserUpdate
from mavito_common.core.security import get_password_hash, verify_password


class CRUDUser:
    async def get_user_by_id(
        self, db: AsyncSession, *, user_id: int
    ) -> Optional[UserModel]:
        """
        Retrieve a user by their ID (integer).
        """
        result = await db.execute(select(UserModel).filter(UserModel.id == user_id))
        return result.scalars().first()

    async def get_user_by_uuid(
        self, db: AsyncSession, *, user_id: UUID
    ) -> Optional[UserModel]:
        """
        Retrieve a user by their UUID (if your User model has a uuid field).
        If your User model uses UUID as the primary key, this should work.
        """
        result = await db.execute(select(UserModel).filter(UserModel.id == user_id))
        return result.scalars().first()

    async def get_user_by_email(
        self, db: AsyncSession, *, email: str
    ) -> Optional[UserModel]:
        """
        Retrieve a user by their email address.
        """
        result = await db.execute(select(UserModel).filter(UserModel.email == email))
        return result.scalars().first()

    async def create_user(self, db: AsyncSession, *, obj_in: UserCreate) -> UserModel:
        """
        Create a new user.
        - Hashes the plain password before storing.
        - Uses fields from UserCreate schema and matches UserModel.
        """
        hashed_password = get_password_hash(obj_in.password)

        # Create a dictionary of the data for the UserModel
        # Exclude the plain password from the input schema
        db_obj_data = obj_in.model_dump(exclude={"password"})

        db_user = UserModel(
            **db_obj_data,  # Spread common fields like email, first_name, last_name, role
            password_hash=hashed_password,  # Store the hashed password
            is_verified=False,  # Default from your SQL schema
            account_locked=False,  # Default from your SQL schema
            # is_active is also a field in our model, defaulting to True
        )

        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    async def update_user(
        self,
        db: AsyncSession,
        *,
        db_obj: UserModel,
        obj_in: Union[UserUpdate, Dict[str, Any]],
    ) -> UserModel:
        """
        Update an existing user.
        obj_in can be a Pydantic UserUpdate schema or a dictionary.
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:  # Pydantic model
            update_data = obj_in.model_dump(
                exclude_unset=True
            )  # Only include fields that were actually set

        if (
            "password" in update_data and update_data["password"]
        ):  # If password is being updated
            hashed_password = get_password_hash(update_data["password"])
            db_obj.password_hash = hashed_password  # Update the password_hash field
            del update_data[
                "password"
            ]  # Don't try to set 'password' attribute directly on model

        # Update other fields
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def authenticate(
        self, db: AsyncSession, *, email: str, password: str
    ) -> Optional[UserModel]:
        """
        Authenticate a user by email and plain password.
        Returns the user object if authentication is successful, otherwise None.
        """
        user = await self.get_user_by_email(db, email=email)
        if not user:
            return None  # User not found
        if not verify_password(
            password, user.password_hash
        ):  # Compare with password_hash
            return None  # Incorrect password
        # Potentially check if user.account_locked or not user.is_verified here if needed
        return user  # Authentication successful

    async def is_user_active(self, user: UserModel) -> bool:
        """
        Checks if a user is considered active.
        Based on your SQL schema, this could mean not account_locked and is_verified.
        Our UserModel also has an 'is_active' field. Let's use that.
        """
        return user.is_active and not user.account_locked  # Example logic

    async def set_last_login(self, db: AsyncSession, *, user: UserModel) -> UserModel:
        """
        Updates the last_login timestamp for a user.
        """
        from sqlalchemy.sql import func  # For func.now()

        user.last_login = func.now()  # This will use the database's NOW() function
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def get_all_users(self, db: AsyncSession) -> List[UserModel]:
        result = await db.execute(
            select(UserModel).order_by(UserModel.created_at.desc())
        )
        return list(result.scalars().all())


# Create a global instance of the CRUDUser class.
# This instance will be imported and used by your API endpoints.
crud_user = CRUDUser()
