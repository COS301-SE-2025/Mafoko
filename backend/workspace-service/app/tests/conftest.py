# glossary-service/app/tests/conftest.py
import asyncio
import pytest
import pytest_asyncio
import warnings
import uuid
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker  # noqa: F401
from fastapi.testclient import TestClient  # noqa: F401
import httpx
from httpx import ASGITransport
from unittest.mock import MagicMock

# Import all models so Base.metadata knows about them
from mavito_common.models.user import User  # noqa: F401
from mavito_common.models.term import Term  # noqa: F401
from mavito_common.models.term_vote import TermVote  # noqa: F401
from mavito_common.db.base_class import Base
from mavito_common.core.config import settings
from app.main import app
from mavito_common.db.session import get_db

# Suppress Pydantic warning about class-based config
warnings.filterwarnings(
    "ignore",
    message="Support for class-based `config` is deprecated",
    category=DeprecationWarning,
)

# --- Definitive Test Database Setup ---
# Use the main DB URL from settings to connect to the 'postgres' DB
# to be able to create/drop other databases.
# Replace 'db' with 'localhost' when running tests locally
LOCAL_DB_URL = str(settings.SQLALCHEMY_DATABASE_URL).replace("db:", "localhost:")
DEFAULT_DB_URL = LOCAL_DB_URL.replace(str(settings.DB_NAME), "postgres", 1)
# The name for our temporary test database
TEST_DB_NAME = str(settings.DB_NAME) + "_test"
# The full URL for connecting to the temporary test database
TEST_DATABASE_URL = LOCAL_DB_URL + "_test"


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


@pytest.fixture
def mock_db():
    """Fixture to create a mock database session for unit tests."""
    from unittest.mock import MagicMock, AsyncMock

    # Create an AsyncMock for db.execute
    execute_mock = AsyncMock()

    # Create the main db mock
    db = MagicMock()

    # Replace the execute method with an AsyncMock
    db.execute = execute_mock

    # Setup common return patterns
    scalar_mock = MagicMock()
    scalar_mock.scalar_one_or_none.return_value = None

    scalars_mock = MagicMock()
    scalars_mock.all.return_value = []

    # Configure the execute AsyncMock to return appropriate values
    execute_mock.return_value = scalar_mock

    # Setup a side effect that allows tests to override return values
    def get_result(*args, **kwargs):
        return scalar_mock

    execute_mock.side_effect = get_result

    # Add a commit method that can be awaited
    db.commit = AsyncMock()

    # Add a refresh method that can be awaited
    db.refresh = AsyncMock()

    return db


@pytest.fixture
def mock_user():
    """Fixture to create a mock user for unit tests."""
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.username = "testuser"
    user.email = "test@example.com"
    return user
