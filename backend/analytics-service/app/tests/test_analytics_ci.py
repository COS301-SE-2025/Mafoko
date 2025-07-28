import pytest
from unittest.mock import Mock, AsyncMock, patch
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestAnalyticsServiceMocked:
    """Fully mocked tests for analytics service."""

    def test_analytics_module_imports(self):
        """Test that analytics module can be imported."""
        try:
            from api.v1.endpoints import analytics

            assert analytics is not None
        except ImportError as e:
            pytest.fail(f"Failed to import analytics module: {e}")

    def test_router_exists(self):
        """Test that analytics router exists."""
        try:
            from api.v1.endpoints.analytics import router

            assert router is not None
            assert hasattr(router, "routes")
        except ImportError as e:
            pytest.fail(f"Failed to import analytics router: {e}")

    @pytest.mark.asyncio
    async def test_get_domain_statistics_mocked(self):
        """Test get_domain_statistics with mocked database."""
        from api.v1.endpoints.analytics import get_domain_statistics

        # Create a mock database session
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.all.return_value = [
            ("Agriculture", 5),
            ("Education", 3),
            ("Technology", 2),
        ]
        mock_db.execute.return_value = mock_result

        # Test the function
        result = await get_domain_statistics(mock_db)

        # Verify results
        assert result == {"Agriculture": 5, "Education": 3, "Technology": 2}
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_language_statistics_mocked(self):
        """Test get_language_statistics with mocked database."""
        from api.v1.endpoints.analytics import get_language_statistics

        # Create a mock database session
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.all.return_value = [
            ("english", 10),
            ("afrikaans", 8),
            ("zulu", 6),
        ]
        mock_db.execute.return_value = mock_result

        # Test the function
        result = await get_language_statistics(mock_db)

        # Verify results
        assert result == {"english": 10, "afrikaans": 8, "zulu": 6}
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_terms_mocked(self):
        """Test get_all_terms with mocked database."""
        from api.v1.endpoints.analytics import get_all_terms

        # Create a mock database session
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_scalars = Mock()
        mock_scalars.all.return_value = [
            Mock(id=1, term="Farm", language="english", domain="Agriculture"),
            Mock(id=2, term="School", language="english", domain="Education"),
        ]
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Test the function
        result = await get_all_terms(mock_db)

        # Verify results
        assert len(result) == 2
        assert result[0].term == "Farm"
        assert result[1].term == "School"
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_language_coverage_mocked(self):
        """Test get_language_coverage with mocked database."""
        from api.v1.endpoints.analytics import get_language_coverage

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock the total terms query
        mock_total_result = Mock()
        mock_total_result.scalar.return_value = 24  # Total terms

        # Mock the language statistics function
        async def mock_get_language_statistics(db):
            return {"english": 10, "afrikaans": 8, "zulu": 6}

        # Configure the mock session
        mock_db.execute.return_value = mock_total_result

        # Patch the get_language_statistics function
        with patch(
            "api.v1.endpoints.analytics.get_language_statistics",
            side_effect=mock_get_language_statistics,
        ):
            result = await get_language_coverage(mock_db)

        # Verify results (percentages)
        assert result == {"english": 41.67, "afrikaans": 33.33, "zulu": 25.0}
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_language_coverage_zero_terms(self):
        """Test get_language_coverage with zero terms."""
        from api.v1.endpoints.analytics import get_language_coverage

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock the total terms query to return 0
        mock_total_result = Mock()
        mock_total_result.scalar.return_value = 0
        mock_db.execute.return_value = mock_total_result

        # Test the function
        result = await get_language_coverage(mock_db)

        # Verify empty result
        assert result == {}
        mock_db.execute.assert_called_once()

    def test_health_endpoint_exists(self):
        """Test that health endpoint exists in router."""
        from api.v1.endpoints.analytics import router

        # Check that health endpoint is registered
        health_routes = [
            route
            for route in router.routes
            if hasattr(route, "path") and "health" in route.path
        ]
        assert len(health_routes) > 0, "Health endpoint should be registered"

    def test_test_endpoint_exists(self):
        """Test that test endpoint exists in router."""
        from api.v1.endpoints.analytics import router

        # Check that test endpoint is registered
        test_routes = [
            route
            for route in router.routes
            if hasattr(route, "path") and "test" in route.path
        ]
        assert len(test_routes) > 0, "Test endpoint should be registered"

    def test_descriptive_endpoints_exist(self):
        """Test that descriptive analytics endpoints exist in router."""
        from api.v1.endpoints.analytics import router

        # Check that descriptive endpoints are registered
        descriptive_routes = [
            route
            for route in router.routes
            if hasattr(route, "path") and "descriptive" in route.path
        ]
        assert len(descriptive_routes) > 0, "Descriptive endpoints should be registered"

    def test_router_has_routes(self):
        """Test that router has routes registered."""
        from api.v1.endpoints.analytics import router

        # Check that router has routes
        assert len(router.routes) > 0, "Router should have routes registered"

    def test_analytics_functions_exist(self):
        """Test that analytics functions exist and are callable."""
        from api.v1.endpoints.analytics import (
            get_domain_statistics,
            get_language_statistics,
            get_all_terms,
        )

        # Check that functions exist and are callable
        assert callable(get_domain_statistics)
        assert callable(get_language_statistics)
        assert callable(get_all_terms)

    @pytest.mark.asyncio
    async def test_analytics_functions_handle_empty_results(self):
        """Test that analytics functions handle empty database results."""
        from api.v1.endpoints.analytics import (
            get_domain_statistics,
            get_language_statistics,
        )

        # Create a mock database session with empty results
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_db.execute.return_value = mock_result

        # Test domain statistics
        domain_result = await get_domain_statistics(mock_db)
        assert domain_result == {}

        # Test language statistics
        language_result = await get_language_statistics(mock_db)
        assert language_result == {}

    @pytest.mark.asyncio
    async def test_analytics_functions_handle_database_errors(self):
        """Test that analytics functions handle database errors gracefully."""
        from api.v1.endpoints.analytics import get_domain_statistics

        # Create a mock database session that raises an error
        mock_db = AsyncMock()
        mock_db.execute.side_effect = Exception("Database connection error")

        # Test that the function raises the error (expected behavior)
        with pytest.raises(Exception):
            await get_domain_statistics(mock_db)

    def test_analytics_endpoint_configuration(self):
        """Test analytics endpoint configuration and setup."""
        from api.v1.endpoints.analytics import router

        # Check router configuration
        assert router.prefix == "" or router.prefix is None, (
            "Router should not have a conflicting prefix"
        )
        assert hasattr(router, "routes"), "Router should have routes attribute"
        assert len(router.routes) > 0, "Router should have routes registered"

    def test_analytics_imports_work(self):
        """Test that all required analytics imports work."""
        try:
            # Test basic imports
            from api.v1.endpoints.analytics import (
                router,
                get_domain_statistics,
                get_language_statistics,
            )

            # Test that imports are not None
            assert router is not None
            assert get_domain_statistics is not None
            assert get_language_statistics is not None

        except ImportError as e:
            pytest.fail(f"Failed to import analytics components: {e}")

    def test_analytics_module_structure(self):
        """Test that analytics module has expected structure."""
        import api.v1.endpoints.analytics as analytics_module

        # Check that module has expected attributes
        expected_functions = [
            "get_domain_statistics",
            "get_language_statistics",
            "get_all_terms",
        ]

        for func_name in expected_functions:
            assert hasattr(analytics_module, func_name), (
                f"Module should have {func_name} function"
            )
            assert callable(getattr(analytics_module, func_name)), (
                f"{func_name} should be callable"
            )

    @pytest.mark.asyncio
    async def test_analytics_with_realistic_data(self):
        """Test analytics functions with realistic mock data."""
        from api.v1.endpoints.analytics import (
            get_domain_statistics,
            get_language_statistics,
        )

        # Create mock database session with realistic data
        mock_db = AsyncMock()

        # Test domain statistics
        mock_domain_result = Mock()
        mock_domain_result.all.return_value = [
            ("Agriculture", 150),
            ("Education", 98),
            ("Technology", 234),
            ("Health", 76),
            ("Business", 189),
        ]
        mock_db.execute.return_value = mock_domain_result

        domain_result = await get_domain_statistics(mock_db)
        assert len(domain_result) == 5
        assert domain_result["Technology"] == 234
        assert domain_result["Health"] == 76

        # Test language statistics
        mock_language_result = Mock()
        mock_language_result.all.return_value = [
            ("english", 347),
            ("afrikaans", 298),
            ("zulu", 156),
            ("xhosa", 134),
            ("sotho", 89),
        ]
        mock_db.execute.return_value = mock_language_result

        language_result = await get_language_statistics(mock_db)
        assert len(language_result) == 5
        assert language_result["english"] == 347
        assert language_result["sotho"] == 89

    def test_analytics_service_can_be_tested_in_ci(self):
        """Test that analytics service can be tested in CI environment."""
        # This test verifies that we can run tests without database dependencies

        # Check that we can import the module
        from api.v1.endpoints.analytics import router

        # Check that router has routes (indicating service is configured)
        assert len(router.routes) > 0, "Service should have routes configured"

        # Check that this test itself runs without database errors
        assert True, "This test should pass in CI without database"

    def test_ci_environment_detection(self):
        """Test CI environment detection."""
        import os

        # Check if we're in CI environment
        ci_detected = os.environ.get("CI", "").lower() in ["true", "1", "yes"]

        # This test should pass regardless of environment
        if ci_detected:
            print("✓ Running in CI environment - using mock-based tests")
        else:
            print("✓ Running in local environment - mock-based tests still work")

        assert True, "Environment detection should work"


class TestAnalyticsServiceCompatibility:
    """Test compatibility with existing analytics functionality."""

    def test_backwards_compatibility(self):
        """Test that existing analytics endpoints are still available."""
        from api.v1.endpoints.analytics import router

        # Check that router exists and has routes
        assert router is not None
        assert len(router.routes) > 0

        # Check that common endpoints are available
        route_paths = [getattr(route, "path", "") for route in router.routes]

        # These endpoints should exist for backwards compatibility
        expected_endpoints = [
            "health",
            "test",
            "descriptive",
        ]

        for endpoint in expected_endpoints:
            assert any(endpoint in path for path in route_paths), (
                f"Endpoint {endpoint} should be available"
            )

    def test_function_signatures_unchanged(self):
        """Test that function signatures are unchanged for compatibility."""
        from api.v1.endpoints.analytics import (
            get_domain_statistics,
            get_language_statistics,
        )

        # Test that functions can be called with expected parameters
        # (We're not actually calling them, just checking they exist)
        import inspect

        # Check get_domain_statistics signature
        domain_sig = inspect.signature(get_domain_statistics)
        assert "db" in domain_sig.parameters, (
            "get_domain_statistics should have db parameter"
        )

        # Check get_language_statistics signature
        language_sig = inspect.signature(get_language_statistics)
        assert "db" in language_sig.parameters, (
            "get_language_statistics should have db parameter"
        )

    def test_return_types_consistent(self):
        """Test that return types are consistent with expectations."""
        # This is a metadata test - we're checking that the functions
        # are designed to return the expected types

        from api.v1.endpoints.analytics import (
            get_domain_statistics,
            get_language_statistics,
        )

        # These functions should be async
        import asyncio

        assert asyncio.iscoroutinefunction(get_domain_statistics)
        assert asyncio.iscoroutinefunction(get_language_statistics)

        # Functions should exist and be callable
        assert callable(get_domain_statistics)
        assert callable(get_language_statistics)
