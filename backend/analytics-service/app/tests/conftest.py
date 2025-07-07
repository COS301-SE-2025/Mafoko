"""
Test configuration for analytics service tests.
"""

import sys
import os
import pytest
from typing import Generator

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# Configure pytest markers
def pytest_configure(config: pytest.Config) -> None:
    """Configure pytest markers."""
    config.addinivalue_line("markers", "asyncio: mark test as an async test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "slow: mark test as slow running")


@pytest.fixture(autouse=True)
def setup_test_environment() -> Generator[None, None, None]:
    """Setup test environment before each test."""
    # No longer need to reset TERM_DATASET as analytics is now database-driven
    yield
    # Cleanup if needed
