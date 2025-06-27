import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
from mavito_common.models.user import UserRole
from app.crud.crud_user import crud_user
from mavito_common.schemas.user import UserCreate
from mavito_common.core.config import settings
from dotenv import load_dotenv

load_dotenv()

# Read from environment
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_FIRST_NAME = os.getenv("ADMIN_FIRST_NAME", "Admin")
ADMIN_LAST_NAME = os.getenv("ADMIN_LAST_NAME", "User")

if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    raise ValueError("ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment")

DATABASE_URL = str(settings.SQLALCHEMY_DATABASE_URL)
engine = create_async_engine(DATABASE_URL, future=True)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def create_admin():
    async with SessionLocal() as session:
        existing_admin = await crud_user.get_user_by_email(session, email=ADMIN_EMAIL)
        if not existing_admin:
            user_in = UserCreate(
                email=ADMIN_EMAIL,
                password=ADMIN_PASSWORD,
                first_name=ADMIN_FIRST_NAME,
                last_name=ADMIN_LAST_NAME,
                role=UserRole.admin,
            )
            await crud_user.create_user(session, obj_in=user_in)
            print(f"Admin user created: {ADMIN_EMAIL}")
        else:
            print(f"Admin user already exists: {ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(create_admin())
