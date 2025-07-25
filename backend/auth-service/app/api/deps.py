# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from pydantic import ValidationError  # For validating token payload
from typing import Optional
import logging
from mavito_common.models.user import UserRole

from mavito_common.core.config import settings
from app.crud.crud_user import crud_user  # Your user CRUD operations
from mavito_common.schemas.token import TokenPayload  # Pydantic schema for token data
from mavito_common.schemas.user import (
    User as UserSchema,
)  # Pydantic schema for API response
from mavito_common.models.user import (
    User as UserModel,
)  # SQLAlchemy model for DB operations
from mavito_common.db.session import get_db  # Your DB session dependency

logger = logging.getLogger(__name__)

# This tells FastAPI where to get the token from.
# The tokenUrl should point to your login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Optional[UserModel]:
    """
    SAME FUNCTION - just simplified exception handling
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        user_identifier: Optional[str] = payload.get("sub")
        if user_identifier is None:
            raise credentials_exception

        token_data = TokenPayload(sub=user_identifier)

    except JWTError as e:
        logger.error(f"JWT validation error: {e}")
        raise credentials_exception
    except ValidationError as e:
        logger.error(f"Token payload validation error: {e}")
        raise credentials_exception

    assert token_data.sub is not None, "Token 'sub' should not be None here"
    user = await crud_user.get_user_by_email(db, email=token_data.sub)

    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: UserModel = Depends(
        get_current_user
    ),  # Depends on the function above
) -> UserSchema:  # Returns the Pydantic UserSchema for API responses
    """
    Checks if the current user (obtained from token) is active.
    Raises HTTPException if the user is inactive.
    Converts the SQLAlchemy UserModel to Pydantic UserSchema for the response.
    """
    # The logic for "is_active" is in crud_user.is_user_active
    if not await crud_user.is_user_active(current_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive or locked user account.",
        )

    # Convert the SQLAlchemy UserModel to Pydantic UserSchema for the API response.
    # UserSchema should have model_config = ConfigDict(from_attributes=True)
    return UserSchema.model_validate(current_user)  # Pydantic V2
    # For Pydantic V1, it would be: return UserSchema.from_orm(current_user)


async def get_current_active_admin(
    current_user: UserSchema = Depends(get_current_active_user),
) -> UserSchema:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )
    return current_user
