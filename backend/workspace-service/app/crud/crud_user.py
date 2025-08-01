# app/crud/crud_user.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Union, Dict, Any
from uuid import UUID

from mavito_common.models.user import User as UserModel
from mavito_common.schemas.user import UserCreate, UserUpdate
from mavito_common.core.security import get_password_hash, verify_password


class CRUDUser:
    async def get_user_by_id(
        self, db: AsyncSession, *, user_id: Union[str, UUID]
    ) -> Optional[UserModel]:
        """
        Retrieve a user by their ID.
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
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> UserModel:
        """
        Update an existing user.
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        # If password is being updated, hash it
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password_hash"] = hashed_password

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def authenticate_user(
        self, db: AsyncSession, *, email: str, password: str
    ) -> Optional[UserModel]:
        """
        Authenticate a user by email and password.
        """
        user = await self.get_user_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    async def is_active(self, user: UserModel) -> bool:
        """
        Check if a user is active.
        """
        return user.is_active

    async def is_superuser(self, user: UserModel) -> bool:
        """
        Check if a user is a superuser.
        """
        # Assuming you have a role field or is_superuser field
        # Adjust this based on your UserModel
        return hasattr(user, 'is_superuser') and user.is_superuser


crud_user = CRUDUser()
