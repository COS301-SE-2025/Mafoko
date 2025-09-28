# app/utils/password_reset.py
import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from mavito_common.models.user import User


def generate_reset_token() -> str:
    """Generate a secure random token for password reset."""
    return secrets.token_urlsafe(32)


def get_reset_token_expiry() -> datetime:
    """Get the expiry time for a reset token (1 hour from now)."""
    return datetime.utcnow() + timedelta(hours=1)


async def create_password_reset_token(db: AsyncSession, user: User) -> str:
    """Create and store a password reset token for a user."""
    reset_token = generate_reset_token()
    reset_expires = get_reset_token_expiry()

    user.password_reset_token = reset_token
    user.password_reset_expires = reset_expires

    await db.commit()
    await db.refresh(user)

    return reset_token


async def verify_reset_token(db: AsyncSession, token: str) -> Optional[User]:
    """Verify a password reset token and return the associated user if valid."""
    stmt = select(User).where(
        User.password_reset_token == token,
        User.password_reset_expires > datetime.utcnow(),
        User.is_active,
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def clear_reset_token(db: AsyncSession, user: User) -> None:
    """Clear the password reset token from a user after successful reset."""
    user.password_reset_token = None
    user.password_reset_expires = None
    await db.commit()


async def find_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Find a user by email address."""
    stmt = select(User).where(User.email == email, User.is_active)
    result = await db.execute(stmt)
    return result.scalars().first()


def is_token_expired(user: User) -> bool:
    """Check if a user's password reset token has expired."""
    if not user.password_reset_expires:
        return True
    return datetime.utcnow() > user.password_reset_expires
