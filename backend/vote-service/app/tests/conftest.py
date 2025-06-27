# vote-service/app/tests/conftest.py

import asyncio
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import httpx
from httpx import ASGITransport

# Import models so Base.metadata knows about them
from mavito_common.models.user import User  # noqa: F401
from mavito_common.models.term import Term  # noqa: F401
from mavito_common.models.term_vote import TermVote  # noqa: F401
from mavito_common.db.base_class import Base

from mavito_common.core.config import settings
from app.main import app  # Assuming your FastAPI app is here
from mavito_common.db.session import get_db

# Build database URLs
DEFAULT_DB_URL = str(settings.SQLALCHEMY_DATABASE_URL).replace(
    str(settings.DB_NAME), "postgres", 1
)
TEST_DB_NAME = f"{settings.DB_NAME}_vote_test"
TEST_DATABASE_URL = str(settings.SQLALCHEMY_DATABASE_URL) + "_vote_test"


# Async event loop for pytest
@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Async test DB setup
@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    default_engine = create_async_engine(DEFAULT_DB_URL, isolation_level="AUTOCOMMIT")
    async with default_engine.connect() as conn:
        await conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))

    test_engine = create_async_engine(TEST_DATABASE_URL)

    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        TestingSessionLocal = async_sessionmaker(
            bind=test_engine,
            class_=AsyncSession,
            autoflush=False,
            expire_on_commit=False,
        )
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            await db.close()
    finally:
        await test_engine.dispose()
        async with default_engine.connect() as conn:
            await conn.execute(text(f"DROP DATABASE {TEST_DB_NAME} WITH (FORCE)"))
        await default_engine.dispose()


# Async test client with overridden DB dependency
@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[httpx.AsyncClient, None]:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

    del app.dependency_overrides[get_db]
