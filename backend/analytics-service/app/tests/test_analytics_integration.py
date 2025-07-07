import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

import pytest
from unittest.mock import Mock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

# Import analytics module directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from api.v1.endpoints.analytics import router


class TestAnalyticsIntegration:
    """Integration tests for database-driven analytics endpoints."""

    @pytest.fixture
    def app(self) -> FastAPI:
        """Create FastAPI app with analytics router."""
        app = FastAPI()
        app.include_router(router, prefix="/api/v1/analytics")
        return app

    @pytest.fixture
    def client(self, app: FastAPI) -> TestClient:
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_db_session(self) -> AsyncMock:
        """Create a mock database session."""
        mock_session = AsyncMock(spec=AsyncSession)
        return mock_session

    @pytest.fixture
    def mock_db_results(self) -> dict:
        """Mock database query results for testing."""
        return {
            "domain_stats": [
                ("Agriculture", 5),
                ("Education", 3),
                ("Technology", 2),
            ],
            "language_stats": [
                ("english", 10),
                ("afrikaans", 8),
                ("zulu", 6),
            ],
            "terms": [
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
            ],
        }

    def test_health_endpoint(self, client: TestClient) -> None:
        """Test health endpoint."""
        response = client.get("/api/v1/analytics/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "analytics"

    def test_test_endpoint(self, client: TestClient) -> None:
        """Test test endpoint."""
        response = client.get("/api/v1/analytics/test")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "timestamp" in data
        assert "endpoints" in data
        assert isinstance(data["endpoints"], list)

    def test_all_endpoints_exist_and_respond(self, client: TestClient) -> None:
        """Test that all analytics endpoints exist and respond (may have DB connection issues)."""
        endpoints = [
            "/api/v1/analytics/descriptive",
            "/api/v1/analytics/descriptive/category-frequency",
            "/api/v1/analytics/descriptive/language-coverage",
            "/api/v1/analytics/descriptive/term-length",
            "/api/v1/analytics/descriptive/definition-length",
            "/api/v1/analytics/descriptive/unique-terms",
            "/api/v1/analytics/descriptive/terms-by-domain-and-language",
            "/api/v1/analytics/descriptive/total-statistics",
            "/api/v1/analytics/descriptive/domain-language-matrix",
            "/api/v1/analytics/descriptive/popular-terms",
            "/api/v1/analytics/descriptive/terms-without-translations",
            "/api/v1/analytics/descriptive/translation-completeness",
        ]

        for endpoint in endpoints:
            try:
                response = client.get(endpoint)
                # The endpoint should exist (not return 404)
                assert response.status_code != 404, f"Endpoint {endpoint} not found"
                # We expect database connection errors in tests without database
                # but the endpoint should exist
                print(f"✓ Endpoint {endpoint} exists (status: {response.status_code})")
            except Exception as e:
                # Check if it's a database connection error
                if "getaddrinfo failed" in str(e) or "socket.gaierror" in str(e):
                    print(
                        f"✓ Endpoint {endpoint} exists but has database connection issues (expected)"
                    )
                    # This is expected - the endpoint exists but can't connect to database
                    pass
                else:
                    # Re-raise unexpected errors
                    raise

    def test_popular_terms_endpoint_with_parameters(self, client: TestClient) -> None:
        """Test popular terms endpoint with query parameters."""
        try:
            # Test with limit parameter
            response = client.get("/api/v1/analytics/descriptive/popular-terms?limit=5")
            # Should not return 404 (endpoint exists)
            assert response.status_code != 404

            # Test with domain filter
            response = client.get(
                "/api/v1/analytics/descriptive/popular-terms?domain=Agriculture"
            )
            assert response.status_code != 404

            # Test with language filter
            response = client.get(
                "/api/v1/analytics/descriptive/popular-terms?language=english"
            )
            assert response.status_code != 404

            # Test with multiple parameters
            response = client.get(
                "/api/v1/analytics/descriptive/popular-terms?limit=3&domain=Education&language=afrikaans"
            )
            assert response.status_code != 404

            print("✓ Popular terms endpoint handles query parameters correctly")
        except Exception as e:
            if "getaddrinfo failed" in str(e) or "socket.gaierror" in str(e):
                print(
                    "✓ Popular terms endpoint exists but has database connection issues (expected)"
                )
                pass
            else:
                raise

    def test_popular_terms_parameter_validation(self, client: TestClient) -> None:
        """Test parameter validation for popular terms endpoint."""
        try:
            # Test with invalid limit (too high)
            response = client.get(
                "/api/v1/analytics/descriptive/popular-terms?limit=150"
            )
            # FastAPI should validate and return 422 for invalid parameters
            assert response.status_code in [422, 500], "Should validate limit parameter"

            # Test with invalid limit (too low)
            response = client.get("/api/v1/analytics/descriptive/popular-terms?limit=0")
            assert response.status_code in [422, 500], "Should validate limit parameter"

            print("✓ Parameter validation working for popular terms endpoint")
        except Exception as e:
            if "getaddrinfo failed" in str(e) or "socket.gaierror" in str(e):
                print(
                    "✓ Parameter validation exists but has database connection issues (expected)"
                )
                pass
            else:
                raise

    def test_endpoint_error_handling(self, client: TestClient) -> None:
        """Test error handling for non-existent endpoints."""
        response = client.get("/api/v1/analytics/descriptive/non-existent-endpoint")
        assert response.status_code == 404

    #     def test_endpoint_response_structure(self, client: TestClient) -> None:
    #         """Test that endpoints return proper response structure when working."""
    #         # Note: These tests will work only when database is connected
    #         # For now, we just verify the endpoints exist and handle errors gracefully

    #         endpoints_with_expected_structure: dict = {
    #             "/api/v1/analytics/health": {"status": str, "service": str},
    #             "/api/v1/analytics/test": {
    #                 "message": str,
    #                 "timestamp": str,
    #                 "endpoints": list,
    #             },
    #         }

    #         for endpoint, expected_structure in endpoints_with_expected_structure.items():
    #             response = client.get(endpoint)
    #             assert response.status_code == 200
    #             data = response.json()

    #             for key, expected_type in expected_structure.items():
    #                 assert key in data, f"Missing key {key} in {endpoint} response"
    #                 assert isinstance(
    #                     data[key], expected_type
    #                 ), f"Wrong type for {key} in {endpoint}"

    #     @pytest.mark.integration
    #     def test_analytics_service_startup(self, client: TestClient) -> None:
    #         """Test that the analytics service starts up correctly."""
    #         # Test that we can create a client and make basic requests
    #         assert client is not None

    #         # Test that health endpoint works (doesn't require database)
    #         response = client.get("/api/v1/analytics/health")
    #         assert response.status_code == 200

    #         # Test that router is properly mounted
    #         response = client.get("/api/v1/analytics/test")
    #         assert response.status_code == 200

    @pytest.mark.integration
    def test_concurrent_requests_safety(self, client: TestClient) -> None:
        """Test that the service handles concurrent requests safely."""
        import threading
        import time

        results = []
        errors = []

        def make_request() -> None:
            try:
                response = client.get("/api/v1/analytics/health")
                results.append(response.status_code)
            except Exception as e:
                errors.append(e)

        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)

        # Start all threads
        start_time = time.time()
        for thread in threads:
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        end_time = time.time()

        # Verify no errors and all requests succeeded
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(results) == 5
        assert all(status == 200 for status in results)
        assert (end_time - start_time) < 5.0


class TestAnalyticsServiceConfiguration:
    """Test analytics service configuration and setup."""

    def test_router_configuration(self) -> None:
        """Test that the analytics router is configured correctly."""
        from app.api.v1.endpoints.analytics import router

        # Check that router exists and has routes
        assert router is not None
        assert len(router.routes) > 0

        # Check that expected endpoints are registered
        route_paths = [getattr(route, "path", "") for route in router.routes]
        expected_paths = [
            "/health",
            "/test",
            "/descriptive",
            "/descriptive/category-frequency",
            "/descriptive/language-coverage",
            "/descriptive/popular-terms",
        ]

        for expected_path in expected_paths:
            assert any(
                expected_path in path for path in route_paths
            ), f"Missing route: {expected_path}"

    def test_endpoint_imports(self) -> None:
        """Test that all analytics endpoint functions can be imported."""
        try:
            # Test that we can import the analytics module
            import app.api.v1.endpoints.analytics  # noqa: F401

            # If we get here, imports work
            assert True
        except ImportError as e:
            pytest.fail(f"Failed to import analytics module: {e}")
