import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Union, Dict, Any
from uuid import UUID

from mavito_common.models.user import User as UserModel
from mavito_common.schemas.user import (
    UserCreate,
    UserUpdate,
    UserCreateGoogle,
    UserCreateGuest,
)
from mavito_common.core.security import get_password_hash, verify_password
from mavito_common.core.exceptions import InvalidPasswordError


class CRUDUser:
    async def get_user_by_id(
        self, db: AsyncSession, *, user_id: int
    ) -> Optional[UserModel]:
        result = await db.execute(select(UserModel).filter(UserModel.id == user_id))
        return result.scalars().first()

    async def get_user_by_uuid(
        self, db: AsyncSession, *, user_id: UUID
    ) -> Optional[UserModel]:
        result = await db.execute(select(UserModel).filter(UserModel.id == user_id))
        return result.scalars().first()

    async def get_user_by_email(
        self, db: AsyncSession, *, email: str
    ) -> Optional[UserModel]:
        normalized_email = email.lower()
        result = await db.execute(
            select(UserModel).filter(UserModel.email == normalized_email)
        )
        return result.scalars().first()

    async def create_user(
        self,
        db: AsyncSession,
        *,
        obj_in: Union[UserCreate, UserCreateGoogle, UserCreateGuest],
    ) -> UserModel:
        if isinstance(obj_in, UserCreateGuest):
            # For guest users, generate a unique email and minimal data
            guest_id = str(uuid.uuid4())[:8]
            user_data = {
                "first_name": obj_in.first_name,
                "last_name": obj_in.last_name,
                "email": f"guest_{guest_id}@mafoko.app",  # Unique guest email
                "role": obj_in.role,
                "is_verified": obj_in.is_verified,
                "is_active": obj_in.is_active,
                "password_hash": get_password_hash(
                    str(uuid.uuid4())
                ),  # Random password
            }
        else:
            user_data = obj_in.model_dump(exclude={"password"})
            user_data["email"] = user_data["email"].lower()

            if isinstance(obj_in, UserCreate):
                if not obj_in.password:
                    raise InvalidPasswordError(
                        "Password must be provided for new users."
                    )
                if len(obj_in.password) < 8:
                    raise InvalidPasswordError(
                        "Password must be at least 8 characters long."
                    )
                if not any(char.isdigit() for char in obj_in.password):
                    raise InvalidPasswordError(
                        "Password must contain at least one number."
                    )
                if not any(char.isupper() for char in obj_in.password):
                    raise InvalidPasswordError(
                        "Password must contain at least one uppercase letter."
                    )

                user_data["password_hash"] = get_password_hash(obj_in.password)
            else:  # UserCreateGoogle
                user_data["password_hash"] = get_password_hash(str(uuid.uuid4()))

        db_obj = UserModel(**user_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_user(
        self,
        db: AsyncSession,
        *,
        db_obj: UserModel,
        obj_in: Union[UserUpdate, Dict[str, Any]],
    ) -> UserModel:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            password = update_data["password"]
            if len(password) < 8:
                raise InvalidPasswordError(
                    "New password must be at least 8 characters long."
                )
            if not any(char.isdigit() for char in password):
                raise InvalidPasswordError(
                    "New password must contain at least one number."
                )
            if not any(char.isupper() for char in password):
                raise InvalidPasswordError(
                    "New password must contain at least one uppercase letter."
                )

            hashed_password = get_password_hash(password)
            db_obj.password_hash = hashed_password
            del update_data["password"]

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
        user = await self.get_user_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    async def is_user_active(self, user: UserModel) -> bool:
        return user.is_active and not user.account_locked

    async def set_last_login(self, db: AsyncSession, *, user: UserModel) -> UserModel:
        from sqlalchemy.sql import func

        user.last_login = func.now()
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def get_all_users(self, db: AsyncSession) -> List[UserModel]:
        result = await db.execute(
            select(UserModel).order_by(UserModel.created_at.desc())
        )
        return list(result.scalars().all())


crud_user = CRUDUser()
