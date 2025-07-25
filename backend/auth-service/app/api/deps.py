# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
import jwt  # PyJWT (ensure it's in requirements.txt: python-jose[cryptography] or PyJWT)
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
    Decodes the JWT token to get the current user.
    Updated for PyJWT 2.10.1 compatibility.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # FIX 1: More explicit decode with proper options for PyJWT 2.10.1
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "verify_aud": False,  # We don't use audience
                "verify_iss": False,  # We don't use issuer
                "require": ["sub", "exp", "iat"],  # Require these claims
            },
        )

        user_identifier: Optional[str] = payload.get("sub")
        if user_identifier is None:
            logger.error("JWT payload missing 'sub' claim")
            raise credentials_exception

        token_data = TokenPayload(sub=user_identifier)

    except jwt.InvalidAlgorithmError as e:
        logger.error(f"JWT InvalidAlgorithmError: {e}")
        logger.error(f"Configured algorithm: '{settings.ALGORITHM}'")
        logger.error(f"PyJWT version: {jwt.__version__}")
        raise credentials_exception

    except jwt.InvalidSignatureError as e:
        logger.error(f"JWT InvalidSignatureError: {e}")
        raise credentials_exception

    except jwt.ExpiredSignatureError as e:
        logger.info(
            f"JWT ExpiredSignatureError: Token expired for user {payload.get('sub') if 'payload' in locals() else 'unknown': {e}}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except jwt.InvalidTokenError as e:
        # This catches all other JWT-related errors in PyJWT 2.10.1
        logger.error(f"JWT InvalidTokenError: {e}")
        raise credentials_exception

    except ValidationError as e:
        logger.error(f"Token payload validation error: {e}")
        raise credentials_exception

    except Exception as e:
        logger.error(f"Unexpected JWT error: {e.__class__.__name__} - {e}")
        raise credentials_exception

    assert token_data.sub is not None, "Token 'sub' should not be None here"

    user = await crud_user.get_user_by_email(db, email=token_data.sub)
    if user is None:
        logger.warning(f"User not found for email: {token_data.sub}")
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
