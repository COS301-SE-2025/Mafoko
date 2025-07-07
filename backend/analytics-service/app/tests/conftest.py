"""
Test configuration for analytics service tests.
This configuration avoids database dependencies to prevent CI failures.
"""

import sys
import os
import pytest
from typing import Generator, AsyncGenerator, Any, Optional
from unittest.mock import AsyncMock, MagicMock

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# Configure pytest markers
def pytest_configure(config: pytest.Config) -> None:
    """Configure pytest markers."""
    config.addinivalue_line("markers", "asyncio: mark test as an async test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line(
        "markers", "mock: mark test as using mocks instead of database"
    )
    config.addinivalue_line(
        "markers", "database_dependent: mark test as requiring database"
    )


@pytest.fixture(autouse=True)
def setup_test_environment() -> Generator[None, None, None]:
    """Setup test environment before each test."""
    # Setup any test environment variables or configurations
    yield
    # Cleanup if needed


@pytest.fixture
def mock_db_session() -> AsyncMock:
    """Create a mock database session for tests that don't need real database."""
    mock_session = AsyncMock()

    # Mock common database operations
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()
    mock_session.execute = AsyncMock()

    # Mock query results
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_result.scalar.return_value = 0
    mock_result.scalars.return_value.all.return_value = []
    mock_result.fetchall.return_value = []

    mock_session.execute.return_value = mock_result

    return mock_session


@pytest.fixture
def mock_analytics_data() -> dict:
    """Provide mock analytics data for tests."""
    return {
        "domain_stats": {
            "Agriculture": 5,
            "Education": 3,
            "Technology": 2,
        },
        "language_stats": {
            "english": 10,
            "afrikaans": 8,
            "zulu": 6,
        },
        "terms": [
            {
                "id": 1,
                "term": "Farm",
                "language": "english",
                "domain": "Agriculture",
                "definition": "Agricultural area",
            },
            {
                "id": 2,
                "term": "Plaas",
                "language": "afrikaans",
                "domain": "Agriculture",
                "definition": "Landbougebied",
            },
            {
                "id": 3,
                "term": "School",
                "language": "english",
                "domain": "Education",
                "definition": "Educational institution",
            },
        ],
        "total_statistics": {
            "total_terms": 10,
            "unique_languages": 3,
            "unique_domains": 3,
            "average_term_length": 5.5,
            "average_definition_length": 15.2,
        },
    }


@pytest.fixture
def mock_term_objects() -> list:
    """Provide mock term objects for tests."""
    from unittest.mock import Mock

    return [
        Mock(
            id=1,
            term="Farm",
            language="english",
            domain="Agriculture",
            definition="Agricultural area",
        ),
        Mock(
            id=2,
            term="Plaas",
            language="afrikaans",
            domain="Agriculture",
            definition="Landbougebied",
        ),
        Mock(
            id=3,
            term="School",
            language="english",
            domain="Education",
            definition="Educational institution",
        ),
    ]


# Event loop fixture for async tests
@pytest.fixture(scope="session")
def event_loop() -> Generator[Any, None, None]:
    """Create an instance of the default event loop for the test session."""
    import asyncio

    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# Async generator fixture for mock database sessions
@pytest.fixture
async def async_mock_db_session() -> AsyncGenerator[AsyncMock, None]:
    """Create an async mock database session."""
    mock_session = AsyncMock()

    # Mock common database operations
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()
    mock_session.execute = AsyncMock()

    # Mock query results
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_result.scalar.return_value = 0
    mock_result.scalars.return_value.all.return_value = []
    mock_result.fetchall.return_value = []

    mock_session.execute.return_value = mock_result

    yield mock_session

    # Cleanup
    await mock_session.close()


@pytest.fixture
def skip_database_tests() -> None:
    """Skip tests that require database when running in CI."""
    # Check if we're running in a CI environment
    ci_environment = os.environ.get("CI", "").lower() in ["true", "1", "yes"]
    database_available = os.environ.get("DATABASE_URL", "") != ""

    if ci_environment and not database_available:
        pytest.skip("Skipping database tests in CI environment without database")


def pytest_collection_modifyitems(config: Any, items: Any) -> None:
    """Modify test collection to handle database-dependent tests."""
    # Add marker to tests that don't use mocks
    for item in items:
        if "mock" not in item.keywords and "database" not in item.name.lower():
            # If the test doesn't explicitly use mocks, check if it needs database
            if any(
                keyword in item.name.lower()
                for keyword in ["db", "database", "terms", "integration"]
            ):
                # Add a marker to indicate this test might need database
                item.add_marker(pytest.mark.database_dependent)


# Helper function to create mock database responses
def create_mock_db_response(
    data: Optional[list[Any]] = None, scalar_value: int = 0, single_result: bool = False
) -> Any:
    """Create a mock database response."""
    mock_result = MagicMock()

    if data is None:
        data = []

    if single_result:
        mock_result.scalar.return_value = scalar_value
    else:
        mock_result.all.return_value = data
        mock_result.fetchall.return_value = data

    # Mock scalars for ORM queries
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = data
    mock_result.scalars.return_value = mock_scalars

    return mock_result
