# vote-service/app/deps.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from mavito_common.core.config import settings

# Import the get_db dependency from the common library
from mavito_common.db.session import get_db
from mavito_common.models.user import User as UserModel
from mavito_common.schemas.token import TokenPayload
from app.crud.crud_user import crud_user

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    # This now correctly depends on the get_db function from the common library
    db: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2),
) -> UserModel:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.PyJWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    if token_data.sub is None:
        raise HTTPException(status_code=403, detail="Invalid token: subject missing")

    user = await crud_user.get_user_by_email(db, email=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
