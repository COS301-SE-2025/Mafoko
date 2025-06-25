"""
Test configuration for analytics service tests.
"""

import sys
import os
import pytest

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# Configure pytest markers
def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line("markers", "asyncio: mark test as an async test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "slow: mark test as slow running")


@pytest.fixture(autouse=True)
def reset_analytics_cache():
    """Reset analytics cache before each test."""
    import app.api.v1.endpoints.analytics as analytics_module

    analytics_module.TERM_DATASET = None
    yield
    analytics_module.TERM_DATASET = None
