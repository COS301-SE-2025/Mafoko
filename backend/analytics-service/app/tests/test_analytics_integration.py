"""
Integration tests for the Analytics Service.
These tests provide end-to-end testing of the analytics API endpoints
with real-world scenarios and edge cases.
"""

import pytest
import pandas as pd
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

from app.api.v1.endpoints.analytics import router


class TestAnalyticsIntegration:
    """Integration tests for analytics endpoints with real-world scenarios."""

    @pytest.fixture
    def app(self):
        """Create FastAPI app with analytics router."""
        app = FastAPI()
        app.include_router(router, prefix="/api/v1/analytics")
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def realistic_dataset(self):
        """Create a realistic dataset with various scenarios."""
        data = {
            "category": [
                "Agriculture",
                "Agriculture",
                "Agriculture",
                "Education",
                "Education",
                "Technology",
                "Technology",
                "Health",
                "Health",
                "Finance",
            ],
            "eng_term": [
                "Agricultural inputs",
                "Annual crops",
                "Livestock",
                "Education",
                "Learning",
                "Software",
                "Hardware",
                "Medicine",
                "Treatment",
                "Investment",
            ],
            "afr_term": [
                "Landbou-insette",
                "Jaargewasse",
                "Vee",
                "Onderwys",
                "Leer",
                "Sagteware",
                "Hardeware",
                "Medisyne",
                "Behandeling",
                "Belegging",
            ],
            "nde_term": [
                "Iinsetjenziswa zokulima",
                "Izitshalo zonyaka",
                "Izifuyo",
                "Imfundo",
                "Ukufunda",
                "I-software",
                "I-hardware",
                "Iyeza",
                "Unyango",
                "Utyalomali",
            ],
            "xho_term": [
                "Amagalelo ezolimo",
                "Izityalo zonyaka",
                "Imfuyo",
                "Imfundo",
                "Ukufunda",
                "Isoftware",
                "Ihardware",
                "Iyeza",
                "Unyango",
                "Utyalomali",
            ],
            "zul_term": [
                "Izinsizamikhiqizo zezolimo",
                "Izitshalo zonyaka",
                "Izifuyo",
                "Imfundo",
                "Ukufunda",
                "I-software",
                "I-hardware",
                "Imithi",
                "Ukwelapha",
                "Ukutshalwa kwemali",
            ],
            "eng_definition": [
                "Consumable expendable inputs in agricultural production process",
                "Crops planted and harvested during the same production season annually",
                "Domesticated animals raised for food or other agricultural products",
                "The systematic process of teaching and learning in institutions",
                "The continuous acquisition of knowledge, skills and competencies",
                "Computer programs and applications used for various tasks",
                "Physical components of computer systems and electronic devices",
                "Substances used for treating diseases and health conditions",
                "Medical care provided to patients for health conditions",
                "Allocation of money expecting future profitable returns",
            ],
        }
        return pd.DataFrame(data)

    @pytest.fixture
    def dataset_no_definition_columns(self):
        """Create a dataset without explicit definition columns to test fallback."""
        data = {
            "category": ["Agriculture", "Education"],
            "eng_term": ["Farming", "Teaching"],
            "afr_term": ["Boerdery", "Onderrig"],
            "eng_definition": ["Cultivation of crops", "Process of instruction"],
        }
        return pd.DataFrame(data)

    @pytest.fixture
    def mock_realistic_data(self, realistic_dataset):
        """Mock file system with realistic data."""
        with patch("pandas.read_json") as mock_read_json, patch(
            "os.path.abspath"
        ) as mock_abspath, patch("os.path.join") as mock_join, patch(
            "os.path.dirname"
        ) as mock_dirname:

            mock_abspath.return_value = "/mocked/path/to/dataset.json"
            mock_join.return_value = "mocked/relative/path"
            mock_dirname.return_value = "/mocked/current/dir"

            # Normalize column names as done in the actual function
            df = realistic_dataset.copy()
            df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
            mock_read_json.return_value = df

            yield mock_read_json

    @pytest.fixture
    def mock_no_definition_columns(self, dataset_no_definition_columns):
        """Mock file system with dataset that has no definition columns."""
        with patch("pandas.read_json") as mock_read_json, patch(
            "os.path.abspath"
        ) as mock_abspath, patch("os.path.join") as mock_join, patch(
            "os.path.dirname"
        ) as mock_dirname:

            mock_abspath.return_value = "/mocked/path/to/dataset.json"
            mock_join.return_value = "mocked/relative/path"
            mock_dirname.return_value = "/mocked/current/dir"

            # Normalize column names
            df = dataset_no_definition_columns.copy()
            df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
            mock_read_json.return_value = df

            yield mock_read_json

    @pytest.fixture(autouse=True)
    def reset_cache(self):
        """Reset global cache before each test."""
        import app.api.v1.endpoints.analytics as analytics_module

        analytics_module.TERM_DATASET = None
        yield
        analytics_module.TERM_DATASET = None

    @pytest.mark.integration
    def test_complete_analytics_workflow(self, client, mock_realistic_data):
        """Test complete analytics workflow with realistic data."""
        # Test main descriptive analytics endpoint
        response = client.get("/api/v1/analytics/descriptive")
        assert response.status_code == 200
        data = response.json()

        # Verify all expected keys are present
        expected_keys = [
            "category_frequency",
            "language_coverage_percent",
            "average_term_lengths",
            "average_definition_lengths",
            "unique_term_counts",
        ]
        for key in expected_keys:
            assert key in data

        # Verify category frequency structure
        category_freq = data["category_frequency"]
        assert isinstance(category_freq, dict)
        assert "Agriculture" in category_freq
        assert "Education" in category_freq

        # Verify language coverage structure
        language_coverage = data["language_coverage_percent"]
        assert isinstance(language_coverage, dict)
        assert "eng_term" in language_coverage
        assert "afr_term" in language_coverage

        # Verify coverage percentages are realistic
        for lang, coverage in language_coverage.items():
            assert 0 <= coverage <= 100
            assert isinstance(coverage, (int, float))

    @pytest.mark.integration
    def test_individual_endpoints_consistency(self, client, mock_realistic_data):
        """Test that individual endpoints return consistent data with main endpoint."""
        # Get data from main endpoint
        main_response = client.get("/api/v1/analytics/descriptive")
        main_data = main_response.json()

        # Test individual endpoints
        endpoints_to_test = [
            ("category-frequency", "category_frequency"),
            ("language-coverage", "language_coverage_percent"),
            ("term-length", "average_term_lengths"),
            ("definition-length", "average_definition_lengths"),
            ("unique-terms", "unique_term_counts"),
        ]

        for endpoint, main_key in endpoints_to_test:
            response = client.get(f"/api/v1/analytics/descriptive/{endpoint}")
            assert response.status_code == 200
            individual_data = response.json()

            # Compare with main endpoint data
            assert individual_data == main_data[main_key], f"Mismatch in {endpoint}"

    @pytest.mark.integration
    def test_category_frequency_detailed(self, client, mock_realistic_data):
        """Test category frequency endpoint with detailed validation."""
        response = client.get("/api/v1/analytics/descriptive/category-frequency")
        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert isinstance(data, dict)
        assert len(data) > 0

        # Verify counts are positive integers
        for category, count in data.items():
            assert isinstance(count, int)
            assert count > 0

        # Verify expected categories are present
        expected_categories = [
            "Agriculture",
            "Education",
            "Technology",
            "Health",
            "Finance",
        ]
        for category in expected_categories:
            assert category in data

    @pytest.mark.integration
    def test_language_coverage_validation(self, client, mock_realistic_data):
        """Test language coverage with validation of percentage calculations."""
        response = client.get("/api/v1/analytics/descriptive/language-coverage")
        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert isinstance(data, dict)
        language_columns = ["eng_term", "afr_term", "nde_term", "xho_term", "zul_term"]

        for lang in language_columns:
            assert lang in data
            coverage = data[lang]
            assert isinstance(coverage, (int, float))
            assert 0 <= coverage <= 100
            # With our test data, all languages should have 100% coverage
            assert coverage == 100.0

    @pytest.mark.integration
    def test_term_length_analysis_detailed(self, client, mock_realistic_data):
        """Test term length analysis with detailed validation."""
        response = client.get("/api/v1/analytics/descriptive/term-length")
        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert isinstance(data, dict)

        # Verify all language columns are present
        language_columns = ["eng_term", "afr_term", "nde_term", "xho_term", "zul_term"]
        for lang in language_columns:
            assert lang in data
            avg_length = data[lang]
            assert isinstance(avg_length, (int, float))
            assert avg_length > 0  # All our terms have positive length

    @pytest.mark.integration
    def test_definition_length_fallback_scenario(
        self, client, mock_no_definition_columns
    ):
        """Test definition length analysis fallback when no definition columns exist."""
        response = client.get("/api/v1/analytics/descriptive/definition-length")
        assert response.status_code == 200
        data = response.json()

        # Should fallback to eng_definition
        assert "eng_definition" in data
        assert isinstance(data["eng_definition"], (int, float))
        assert data["eng_definition"] > 0

    @pytest.mark.integration
    def test_unique_terms_count_validation(self, client, mock_realistic_data):
        """Test unique terms count with validation."""
        response = client.get("/api/v1/analytics/descriptive/unique-terms")
        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert isinstance(data, dict)

        # Verify all language columns are present
        language_columns = ["eng_term", "afr_term", "nde_term", "xho_term", "zul_term"]
        for lang in language_columns:
            assert lang in data
            unique_count = data[lang]
            assert isinstance(unique_count, int)
            assert unique_count > 0
            # With our test data, we should have exactly 10 unique terms per language
            assert unique_count == 10

    @pytest.mark.integration
    def test_error_handling_malformed_requests(self, client, mock_realistic_data):
        """Test error handling for malformed requests."""
        # Test with invalid endpoint
        response = client.get("/api/v1/analytics/descriptive/invalid-endpoint")
        assert response.status_code == 404

    @pytest.mark.integration
    def test_concurrent_requests(self, client, mock_realistic_data):
        """Test handling of concurrent requests to ensure thread safety."""
        import threading
        import time

        results = []
        errors = []

        def make_request(endpoint):
            try:
                response = client.get(f"/api/v1/analytics/descriptive/{endpoint}")
                results.append((response.status_code, response.json()))
            except Exception as e:
                errors.append(e)

        # Create multiple threads to test concurrent access
        endpoints = ["category-frequency", "language-coverage", "term-length"]
        threads = []

        for endpoint in endpoints:
            for _ in range(3):  # 3 requests per endpoint
                thread = threading.Thread(target=make_request, args=(endpoint,))
                threads.append(thread)

        # Start all threads
        start_time = time.time()
        for thread in threads:
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        end_time = time.time()

        # Verify no errors occurred
        assert len(errors) == 0, f"Errors occurred: {errors}"

        # Verify all requests succeeded
        assert len(results) == 9  # 3 endpoints * 3 requests each
        for status_code, data in results:
            assert status_code == 200
            assert isinstance(data, dict)
            assert len(data) > 0

        # Should complete within reasonable time
        assert (end_time - start_time) < 10.0

    @pytest.mark.integration
    def test_data_consistency_across_requests(self, client, mock_realistic_data):
        """Test that data remains consistent across multiple requests."""
        # Make multiple requests to the same endpoint
        responses = []
        for _ in range(5):
            response = client.get("/api/v1/analytics/descriptive/category-frequency")
            responses.append(response.json())

        # All responses should be identical (due to caching)
        first_response = responses[0]
        for response in responses[1:]:
            assert response == first_response

    @pytest.mark.integration
    def test_full_descriptive_analytics_structure(self, client, mock_realistic_data):
        """Test the complete structure of descriptive analytics response."""
        response = client.get("/api/v1/analytics/descriptive")
        assert response.status_code == 200
        data = response.json()

        # Test category frequency structure
        category_freq = data["category_frequency"]
        assert len(category_freq) == 5  # We have 5 distinct categories

        # Test language coverage structure
        lang_coverage = data["language_coverage_percent"]
        assert len(lang_coverage) == 5  # We have 5 language columns

        # Test term lengths structure
        term_lengths = data["average_term_lengths"]
        assert len(term_lengths) == 5  # We have 5 language columns

        # Test definition lengths structure
        def_lengths = data["average_definition_lengths"]
        assert len(def_lengths) == 1  # We have 1 definition column

        # Test unique terms structure
        unique_counts = data["unique_term_counts"]
        assert len(unique_counts) == 5  # We have 5 language columns

    @pytest.mark.integration
    def test_edge_case_empty_data_handling(self, client):
        """Test handling of edge cases with empty or minimal data."""
        empty_df = pd.DataFrame({"category": [], "eng_term": [], "eng_definition": []})

        with patch("pandas.read_json") as mock_read_json:
            mock_read_json.return_value = empty_df

            # This should handle empty data gracefully
            response = client.get("/api/v1/analytics/descriptive/category-frequency")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, dict)

    @pytest.mark.integration
    def test_performance_with_large_dataset_simulation(self, client):
        """Test performance with simulated large dataset."""
        # Create a larger dataset to test performance
        large_data = {
            "category": ["Category" + str(i % 10) for i in range(1000)],
            "eng_term": ["Term" + str(i) for i in range(1000)],
            "afr_term": ["Afrikaans" + str(i) for i in range(1000)],
            "eng_definition": ["Definition " + str(i) * 10 for i in range(1000)],
        }
        large_df = pd.DataFrame(large_data)

        with patch("pandas.read_json") as mock_read_json:
            mock_read_json.return_value = large_df

            import time

            start_time = time.time()
            response = client.get("/api/v1/analytics/descriptive")
            end_time = time.time()

            assert response.status_code == 200
            # Should complete within reasonable time (5 seconds)
            assert (end_time - start_time) < 5.0


class TestAnalyticsErrorScenarios:
    """Test error scenarios and edge cases for analytics endpoints."""

    @pytest.fixture
    def app(self):
        """Create FastAPI app with analytics router."""
        app = FastAPI()
        app.include_router(router, prefix="/api/v1/analytics")
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture(autouse=True)
    def reset_cache(self):
        """Reset global cache before each test."""
        import app.api.v1.endpoints.analytics as analytics_module

        analytics_module.TERM_DATASET = None
        yield
        analytics_module.TERM_DATASET = None

    @pytest.mark.integration
    def test_file_not_found_handling(self, client):
        """Test handling when dataset file is not found."""
        with patch("pandas.read_json") as mock_read_json:
            mock_read_json.side_effect = FileNotFoundError("Dataset file not found")

            # Should raise an internal server error due to unhandled exception
            with pytest.raises(Exception):
                client.get("/api/v1/analytics/descriptive")

    @pytest.mark.integration
    def test_invalid_json_handling(self, client):
        """Test handling of invalid JSON data."""
        with patch("pandas.read_json") as mock_read_json:
            mock_read_json.side_effect = ValueError("Invalid JSON format")

            # Should raise an internal server error due to unhandled exception
            with pytest.raises(Exception):
                client.get("/api/v1/analytics/descriptive")

    @pytest.mark.integration
    def test_corrupted_data_handling(self, client):
        """Test handling of corrupted or malformed data."""
        corrupted_df = pd.DataFrame(
            {"invalid_column": [1, 2, 3], "another_invalid": ["a", "b", "c"]}
        )

        with patch("pandas.read_json") as mock_read_json:
            mock_read_json.return_value = corrupted_df

            # Should raise KeyError due to missing expected columns
            with pytest.raises(Exception):
                client.get("/api/v1/analytics/descriptive/category-frequency")
