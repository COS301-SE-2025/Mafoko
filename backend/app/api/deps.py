# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
import jwt # PyJWT (ensure it's in requirements.txt: python-jose[cryptography] or PyJWT)
from pydantic import ValidationError # For validating token payload
from typing import Optional

from app.core.config import settings
from app.crud.crud_user import crud_user # Your user CRUD operations
from app.schemas.token import TokenPayload # Pydantic schema for token data
from app.schemas.user import User as UserSchema # Pydantic schema for API response
from app.models.user import User as UserModel # SQLAlchemy model for DB operations
from app.db.session import get_db # Your DB session dependency

# This tells FastAPI where to get the token from.
# The tokenUrl should point to your login endpoint.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Optional[UserModel]: # Returns the SQLAlchemy UserModel or None
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
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # 'sub' (subject) in the JWT payload typically holds the user identifier (e.g., email)
        user_identifier: Optional[str] = payload.get("sub")
        if user_identifier is None:
            raise credentials_exception
        # Validate that the payload's subject matches what TokenPayload expects
        token_data = TokenPayload(sub=user_identifier)
    except (jwt.PyJWTError, ValidationError) as e:
        # Catches errors from jwt.decode (e.g., expired, invalid signature)
        # and Pydantic validation of TokenPayload.
        logger.error(f"Token validation error: {e}", exc_info=True) # Added logger
        raise credentials_exception

    user = await crud_user.get_user_by_email(db, email=token_data.sub) # Fetch user from DB

    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user) # Depends on the function above
) -> UserSchema: # Returns the Pydantic UserSchema for API responses
    """
    Checks if the current user (obtained from token) is active.
    Raises HTTPException if the user is inactive.
    Converts the SQLAlchemy UserModel to Pydantic UserSchema for the response.
    """
    # The logic for "is_active" is in crud_user.is_user_active
    if not await crud_user.is_user_active(current_user):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive or locked user account.")

    # Convert the SQLAlchemy UserModel to Pydantic UserSchema for the API response.
    # UserSchema should have model_config = ConfigDict(from_attributes=True)
    return UserSchema.model_validate(current_user) # Pydantic V2
    # For Pydantic V1, it would be: return UserSchema.from_orm(current_user)