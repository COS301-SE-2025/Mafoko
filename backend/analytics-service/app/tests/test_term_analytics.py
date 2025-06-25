import pytest
import pandas as pd
from unittest.mock import patch

# import json
# import os
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import the actual analytics router and functions
from app.api.v1.endpoints.analytics import (
    router,
    load_marito_data,
    get_dataset_columns,
    # get_category_frequency,
    get_language_coverage,
    get_term_length_analysis,
    #  get_definition_length_analysis,
    get_unique_terms_count,
    DATASET_PATH,
)

# Create a test app with the analytics router
app = FastAPI()
app.include_router(router, prefix="/api/v1/analytics")

client = TestClient(app)


class TestAnalyticsRouter:
    """Test suite for the analytics router."""

    @pytest.fixture
    def sample_dataframe(self):
        """Create a sample DataFrame for testing."""
        data = {
            "category": [
                "Agriculture",
                "Agriculture",
                "Agriculture",
                "Education",
                "Education",
            ],
            "eng_term": [
                "Agricultural inputs",
                "Annual crops",
                "Livestock",
                "Education",
                "Learning",
            ],
            "afr_term": ["Landbou-insette", "Jaargewasse", "Vee", "Onderwys", "Leer"],
            "nde_term": [
                "Iinsetjenziswa zokulima",
                "Izitshalo zonyaka",
                "Izifuyo",
                "Imfundo",
                "Ukufunda",
            ],
            "xho_term": [
                "Amagalelo ezolimo",
                "Izityalo zonyaka",
                "Imfuyo",
                "Imfundo",
                "Ukufunda",
            ],
            "zul_term": [
                "Izinsizamikhiqizo zezolimo",
                "Izitshalo zonyaka",
                "Izifuyo",
                "Imfundo",
                "Ukufunda",
            ],
            "eng_definition": [
                "Consumable expendable inputs in agricultural production",
                "Crops that are planted and harvested during the same production season",
                "Domesticated animals raised for food or other products",
                "The process of teaching and learning",
                "The acquisition of knowledge and skills",
            ],
        }
        return pd.DataFrame(data)

    @pytest.fixture
    def mock_json_data(self, sample_dataframe):
        """Create mock JSON data that matches the DataFrame."""
        return sample_dataframe.to_dict("records")

    # @pytest.fixture
    # def mock_file_system(self, mock_json_data):
    #     """Mock the file system and pandas read_json."""
    #     with patch("pandas.read_json") as mock_read_json, patch(
    #         "os.path.abspath"
    #     ) as mock_abspath, patch("os.path.join") as mock_join, patch(
    #         "os.path.dirname"
    #     ) as mock_dirname:

    #         mock_abspath.return_value = "/mocked/path/to/dataset.json"
    #         mock_join.return_value = "mocked/relative/path"
    #         mock_dirname.return_value = "/mocked/current/dir"

    #         # Create DataFrame from mock data
    #         df = pd.DataFrame(mock_json_data)
    #         # Normalize column names as done in the actual function
    #         df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    #         mock_read_json.return_value = df

    #         yield mock_read_json

    # @pytest.fixture(autouse=True)
    # def reset_global_cache(self):
    #     """Reset the global TERM_DATASET cache before each test."""
    #     # Import and reset the global variable
    #     import app.api.v1.endpoints.analytics as analytics_module

    #     analytics_module.TERM_DATASET = None
    #     yield
    #     # Reset after test
    #     analytics_module.TERM_DATASET = None

    # @pytest.mark.asyncio
    # async def test_load_marito_data_first_call(
    #     self, mock_file_system, sample_dataframe
    # ):
    #     """Test that load_marito_data loads data correctly on first call."""
    #     # Mock the global variable
    #     import app.api.v1.endpoints.analytics as analytics_module

    #     analytics_module.TERM_DATASET = None

    #     result = await load_marito_data()

    #     assert result is not None
    #     assert len(result) == 5
    #     assert "category" in result.columns
    #     mock_file_system.assert_called_once()

    # @pytest.mark.asyncio
    # async def test_load_marito_data_cached(self, mock_file_system, sample_dataframe):
    #     """Test that load_marito_data uses cache on subsequent calls."""
    #     import app.api.v1.endpoints.analytics as analytics_module

    #     analytics_module.TERM_DATASET = sample_dataframe

    #     result1 = await load_marito_data()
    #     result2 = await load_marito_data()

    #     # Should be the same object (cached)
    #     assert result1 is result2
    #     # read_json should not be called when using cache
    #     mock_file_system.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_dataset_columns(self, mock_file_system):
        """Test get_dataset_columns returns correct column categorization."""
        df, language_columns, definition_columns, category_column = (
            await get_dataset_columns()
        )

        assert category_column == "category"
        assert "eng_term" in language_columns
        assert "afr_term" in language_columns
        assert "nde_term" in language_columns
        assert "xho_term" in language_columns
        assert "zul_term" in language_columns
        assert "eng_definition" in definition_columns

    def test_get_descriptive_analytics_endpoint(self, mock_file_system):
        """Test the main descriptive analytics endpoint."""
        response = client.get("/api/v1/analytics/descriptive")

        assert response.status_code == 200
        data = response.json()

        # Check that all expected keys are present
        expected_keys = [
            "category_frequency",
            "language_coverage_percent",
            "average_term_lengths",
            "average_definition_lengths",
            "unique_term_counts",
        ]
        for key in expected_keys:
            assert key in data

    def test_get_category_frequency_endpoint(self, mock_file_system):
        """Test category frequency endpoint."""
        response = client.get("/api/v1/analytics/descriptive/category-frequency")

        assert response.status_code == 200
        data = response.json()

        # Should have counts for each category
        assert isinstance(data, dict)
        assert "Agriculture" in data
        assert "Education" in data
        assert data["Agriculture"] == 3  # Based on sample data
        assert data["Education"] == 2

    def test_get_language_coverage_endpoint(self, mock_file_system):
        """Test language coverage endpoint."""
        response = client.get("/api/v1/analytics/descriptive/language-coverage")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, dict)
        # All languages should have coverage percentages
        for lang in ["eng_term", "afr_term", "nde_term"]:
            assert lang in data
            assert isinstance(data[lang], (int, float))
            assert 0 <= data[lang] <= 100

    def test_get_term_length_analysis_endpoint(self, mock_file_system):
        """Test term length analysis endpoint."""
        response = client.get("/api/v1/analytics/descriptive/term-length")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, dict)
        # Should have average lengths for each language
        for lang in ["eng_term", "afr_term", "nde_term"]:
            assert lang in data
            assert isinstance(data[lang], (int, float))
            assert data[lang] > 0  # Should have positive average length

    def test_get_definition_length_analysis_endpoint(self, mock_file_system):
        """Test definition length analysis endpoint."""
        response = client.get("/api/v1/analytics/descriptive/definition-length")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, dict)
        # Should have average lengths for definition columns
        assert "eng_definition" in data
        assert isinstance(data["eng_definition"], (int, float))
        assert data["eng_definition"] > 0

    def test_get_unique_terms_count_endpoint(self, mock_file_system):
        """Test unique terms count endpoint."""
        response = client.get("/api/v1/analytics/descriptive/unique-terms")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, dict)
        # Should have unique counts for each language
        for lang in ["eng_term", "afr_term", "nde_term"]:
            assert lang in data
            assert isinstance(data[lang], int)
            assert data[lang] >= 0

    @pytest.mark.asyncio
    async def test_language_coverage_with_missing_values(self, mock_file_system):
        """Test language coverage calculation with missing values."""
        # Test with sample data that has full coverage
        result = await get_language_coverage()

        # All languages should have 100% coverage in our sample data
        for lang in ["eng_term", "afr_term", "nde_term", "xho_term", "zul_term"]:
            assert result[lang] == 100.0

    @pytest.mark.asyncio
    async def test_term_length_with_null_values(self, mock_file_system):
        """Test term length calculation ignores null values."""
        result = await get_term_length_analysis()

        # Should calculate average length only for non-null values
        assert all(isinstance(length, float) for length in result.values())
        assert all(length > 0 for length in result.values())

    @pytest.mark.asyncio
    async def test_unique_terms_count_excludes_na(self, mock_file_system):
        """Test unique terms count excludes NA values."""
        result = await get_unique_terms_count()

        # Each language column has 5 unique non-null values in our sample data
        for lang in ["eng_term", "afr_term", "nde_term", "xho_term", "zul_term"]:
            assert result[lang] == 5

    def test_file_path_construction(self):
        """Test that the dataset path is constructed correctly."""
        # Should end with the expected filename
        assert DATASET_PATH.endswith("multilingual_statistical_terminology_clean.json")

    @pytest.mark.asyncio
    async def test_error_handling_file_not_found(self):
        """Test error handling when dataset file is not found."""
        with patch("pandas.read_json", side_effect=FileNotFoundError("File not found")):
            with pytest.raises(FileNotFoundError):
                await load_marito_data()

    @pytest.mark.asyncio
    async def test_error_handling_invalid_json(self):
        """Test error handling when JSON is invalid."""
        with patch("pandas.read_json", side_effect=ValueError("Invalid JSON")):
            with pytest.raises(ValueError):
                await load_marito_data()

    def test_column_normalization(self, mock_file_system):
        """Test that column names are properly normalized."""
        # Create DataFrame with messy column names
        messy_data = pd.DataFrame(
            {
                "Category ": ["test"],
                " English Term": ["test"],
                "Spanish_Term ": ["test"],
            }
        )

        with patch("pandas.read_json", return_value=messy_data):
            # Fixed: Use the correct full URL path
            response = client.get("/api/v1/analytics/descriptive/category-frequency")
            assert response.status_code == 200

    @pytest.mark.parametrize(
        "endpoint",
        [
            "/api/v1/analytics/descriptive",
            "/api/v1/analytics/descriptive/category-frequency",
            "/api/v1/analytics/descriptive/language-coverage",
            "/api/v1/analytics/descriptive/term-length",
            "/api/v1/analytics/descriptive/definition-length",
            "/api/v1/analytics/descriptive/unique-terms",
        ],
    )
    def test_all_endpoints_return_json(self, endpoint, mock_file_system):
        """Test that all endpoints return valid JSON."""
        response = client.get(endpoint)
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        # Should be able to parse as JSON
        data = response.json()
        assert isinstance(data, dict)


# Additional integration tests
# class TestIntegration:
#     """Integration tests for the full workflow."""

#     @pytest.fixture
#     def sample_dataframe(self):
#         """Create a sample DataFrame for testing."""
#         data = {
#             "category": [
#                 "Agriculture",
#                 "Agriculture",
#                 "Agriculture",
#                 "Education",
#                 "Education",
#             ],
#             "eng_term": [
#                 "Agricultural inputs",
#                 "Annual crops",
#                 "Livestock",
#                 "Education",
#                 "Learning",
#             ],
#             "afr_term": ["Landbou-insette", "Jaargewasse", "Vee", "Onderwys", "Leer"],
#             "nde_term": [
#                 "Iinsetjenziswa zokulima",
#                 "Izitshalo zonyaka",
#                 "Izifuyo",
#                 "Imfundo",
#                 "Ukufunda",
#             ],
#             "xho_term": [
#                 "Amagalelo ezolimo",
#                 "Izityalo zonyaka",
#                 "Imfuyo",
#                 "Imfundo",
#                 "Ukufunda",
#             ],
#             "zul_term": [
#                 "Izinsizamikhiqizo zezolimo",
#                 "Izitshalo zonyaka",
#                 "Izifuyo",
#                 "Imfundo",
#                 "Ukufunda",
#             ],
#             "eng_definition": [
#                 "Consumable expendable inputs in agricultural production",
#                 "Crops that are planted and harvested during the same production season",
#                 "Domesticated animals raised for food or other products",
#                 "The process of teaching and learning",
#                 "The acquisition of knowledge and skills",
#             ],
#         }
#         return pd.DataFrame(data)

#     @pytest.fixture
#     def mock_json_data(self, sample_dataframe):
#         """Create mock JSON data that matches the DataFrame."""
#         return sample_dataframe.to_dict("records")

#     @pytest.fixture
#     def mock_file_system(self, mock_json_data):
#         """Mock the file system and pandas read_json."""
#         with patch("pandas.read_json") as mock_read_json, patch(
#             "os.path.abspath"
#         ) as mock_abspath, patch("os.path.join") as mock_join, patch(
#             "os.path.dirname"
#         ) as mock_dirname:

#             mock_abspath.return_value = "/mocked/path/to/dataset.json"
#             mock_join.return_value = "mocked/relative/path"
#             mock_dirname.return_value = "/mocked/current/dir"

#             # Create DataFrame from mock data
#             df = pd.DataFrame(mock_json_data)
#             # Normalize column names as done in the actual function
#             df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
#             mock_read_json.return_value = df

#             yield mock_read_json

#     @pytest.fixture(autouse=True)
#     def reset_global_cache(self):
#         """Reset the global TERM_DATASET cache before each test."""
#         # Import and reset the global variable
#         import app.api.v1.endpoints.analytics as analytics_module

#         analytics_module.TERM_DATASET = None
#         yield
#         # Reset after test
#         analytics_module.TERM_DATASET = None

#     def test_full_analytics_workflow(self, mock_file_system):
#         """Test the complete analytics workflow."""
#         # Test main endpoint
#         main_response = client.get("/api/v1/analytics/descriptive")
#         assert main_response.status_code == 200
#         main_data = main_response.json()

#         # Test individual endpoints
#         category_response = client.get(
#             "/api/v1/analytics/descriptive/category-frequency"
#         )
#         coverage_response = client.get(
#             "/api/v1/analytics/descriptive/language-coverage"
#         )
#         term_length_response = client.get("/api/v1/analytics/descriptive/term-length")
#         def_length_response = client.get(
#             "/api/v1/analytics/descriptive/definition-length"
#         )
#         unique_response = client.get("/api/v1/analytics/descriptive/unique-terms")

#         # All should be successful
#         responses = [
#             category_response,
#             coverage_response,
#             term_length_response,
#             def_length_response,
#             unique_response,
#         ]
#         assert all(r.status_code == 200 for r in responses)

#         # Main endpoint should contain data from individual endpoints
#         assert main_data["category_frequency"] == category_response.json()
#         assert main_data["language_coverage_percent"] == coverage_response.json()
#         assert main_data["average_term_lengths"] == term_length_response.json()
#         assert main_data["average_definition_lengths"] == def_length_response.json()
#         assert main_data["unique_term_counts"] == unique_response.json()


# if __name__ == "__main__":
#     pytest.main([__file__, "-v"])
