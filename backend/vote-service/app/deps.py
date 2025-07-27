# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
from pydantic import ValidationError
from typing import Optional
import logging
from mavito_common.models.user import UserRole

from mavito_common.core.config import settings
from app.crud.crud_user import crud_user
from mavito_common.schemas.token import TokenPayload
from mavito_common.schemas.user import User as UserSchema
from mavito_common.models.user import User as UserModel
from mavito_common.db.session import get_db

# Configure logging for this module
logger = logging.getLogger(__name__)
# Set the logging level for this logger to DEBUG
# In a production environment, you might set this via environment variables or a config file
# For debugging purposes, setting it here is fine.
logger.setLevel(logging.DEBUG)


# This tells FastAPI where to get the token from.
# The tokenUrl should point to your login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Optional[UserModel]:
    """
    Decodes the JWT token to get the current user.
    Raises HTTPException if token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # --- DEBUGGING LOGS ADDED HERE ---
        # Log the received token (truncated for security, but enough for comparison)
        logger.debug(f"Received token (first 30 chars): {token[:30]}...")
        # Log the SECRET_KEY (truncated for security)
        logger.debug(f"Using SECRET_KEY (first 5 chars): {settings.SECRET_KEY[:5]}...")
        # Log the algorithm
        logger.debug(f"Using ALGORITHM: {settings.ALGORITHM}")
        # --- END DEBUGGING LOGS ---

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # 'sub' (subject) in the JWT payload typically holds the user identifier (e.g., email)
        user_identifier: Optional[str] = payload.get("sub")
        if user_identifier is None:
            logger.warning("Token payload 'sub' is missing.")
            raise credentials_exception
        # Validate that the payload's subject matches what TokenPayload expects
        token_data = TokenPayload(sub=user_identifier)
    except jwt.ExpiredSignatureError:
        logger.info(
            f"Token has expired for sub: {payload.get('sub') if 'payload' in locals() else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValidationError) as e:
        logger.error(
            f"Token validation error: {e.__class__.__name__} - {e}", exc_info=False
        )
        raise credentials_exception

    assert (
        token_data.sub is not None
    ), "Token 'sub' (user_identifier) should not be None here"
    user = await crud_user.get_user_by_email(db, email=token_data.sub)

    if user is None:
        logger.warning(f"User not found for email: {token_data.sub}")
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserSchema:
    """
    Checks if the current user (obtained from token) is active.
    Raises HTTPException if the user is inactive.
    Converts the SQLAlchemy UserModel to Pydantic UserSchema for the response.
    """
    if not await crud_user.is_user_active(current_user):
        logger.warning(f"Inactive or locked user account: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive or locked user account.",
        )

    return UserSchema.model_validate(current_user)


async def get_current_active_admin(
    current_user: UserSchema = Depends(get_current_active_user),
) -> UserSchema:
    if current_user.role != UserRole.admin:
        logger.warning(
            f"User {current_user.email} attempted admin access without role."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )
    return current_user
