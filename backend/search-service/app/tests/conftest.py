# search-service/app/tests/conftest.py
import asyncio
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker  # noqa: F401
from fastapi.testclient import TestClient  # noqa: F401
import httpx
from httpx import ASGITransport

# Import all models so Base.metadata knows about them
from mavito_common.models.user import User  # noqa: F401
from mavito_common.models.term import Term  # noqa: F401
from mavito_common.models.term_vote import TermVote  # noqa: F401

from mavito_common.db.base_class import Base
from mavito_common.core.config import settings
from app.main import app

# This must point to the get_db your app actually uses
from mavito_common.db.session import get_db

# --- Definitive Test Database Setup ---
# Use the main DB URL from settings to connect to the 'postgres' DB
# to be able to create/drop other databases.
DEFAULT_DB_URL = str(settings.SQLALCHEMY_DATABASE_URL).replace(
    str(settings.DB_NAME), "postgres", 1
)
# The name for our temporary test database
TEST_DB_NAME = str(settings.DB_NAME) + "_test"
# The full URL for connecting to the temporary test database
TEST_DATABASE_URL = str(settings.SQLALCHEMY_DATABASE_URL) + "_test"


@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    The master fixture that creates and destroys a temporary database and all tables for each test.
    """
    # 1. Connect to the default 'postgres' database with autocommit
    default_engine = create_async_engine(DEFAULT_DB_URL, isolation_level="AUTOCOMMIT")
    async with default_engine.connect() as conn:
        # 2. Create a new, clean test database
        await conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))

    # 3. Now, connect to the newly created test database
    test_engine = create_async_engine(TEST_DATABASE_URL)

    try:
        # 4. Create all tables within the test database
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # 5. Yield a session for the test to use
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
        # 6. Tear down: close all connections and drop the test database
        await test_engine.dispose()
        async with default_engine.connect() as conn:
            await conn.execute(text(f"DROP DATABASE {TEST_DB_NAME} WITH (FORCE)"))
        await default_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[httpx.AsyncClient, None]:
    """Provides an AsyncClient with the DB dependency overridden."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    # Use httpx.AsyncClient for a fully async test client
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

    del app.dependency_overrides[get_db]
