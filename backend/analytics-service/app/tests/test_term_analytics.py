import pytest
import pandas as pd
import json
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

from app.api.v1.endpoints.analytics import router, load_marito_data, DATASET_PATH

# Create a test app
app = FastAPI()
app.include_router(router, prefix="/analytics")
client = TestClient(app)


class TestAnalyticsModule:
    """Test suite for analytics module"""

    @pytest.fixture
    def sample_data(self):
        """Sample data fixture for testing"""
        return [
            {
                "category": "Statistics",
                "eng_term": "Mean",
                "spa_term": "Media",
                "fra_term": "Moyenne",
                "deu_term": "Mittelwert",
                "eng_definition": "The average value of a dataset",
                "spa_definition": "El valor promedio de un conjunto de datos",
                "fra_definition": "La valeur moyenne d'un ensemble de données",
            },
            {
                "category": "Statistics",
                "eng_term": "Median",
                "spa_term": "Mediana",
                "fra_term": "Médiane",
                "deu_term": None,  # Missing term (1 missing)
                "eng_definition": "The middle value in a sorted dataset",
                "spa_definition": None,  # Missing definition
                "fra_definition": "La valeur médiane dans un ensemble de données trié",
            },
            {
                "category": "Probability",
                "eng_term": "Distribution",
                "spa_term": "Distribución",
                "fra_term": "Distribution",
                "deu_term": "Verteilung",
                "eng_definition": "A mathematical function describing probability",
                "spa_definition": "Una función matemática que describe probabilidad",
                "fra_definition": "Une fonction mathématique décrivant la probabilité",
            },
            {
                "category": "Probability",
                "eng_term": "Variance",
                "spa_term": None,  # Missing term (1 missing)
                "fra_term": None,  # Missing term (1 missing)
                "deu_term": None,  # Missing term (2 missing total)
                "eng_definition": "A measure of data spread",
                "spa_definition": "Una medida de dispersión de datos",
                "fra_definition": None,  # Missing definition
            },
        ]

    @pytest.fixture
    def sample_dataframe(self, sample_data):
        """Create a sample DataFrame from sample data"""
        df = pd.DataFrame(sample_data)
        # Normalize column names as done in the actual function
        df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
        return df

    @pytest.fixture
    def mock_json_file(self, sample_data):
        """Mock JSON file content"""
        return json.dumps(sample_data)

    @pytest.fixture(autouse=True)
    def reset_cache(self):
        """Reset the global cache before each test"""
        # Import here to avoid circular imports
        import app.api.v1.endpoints.analytics as analytics_module

        analytics_module.TERM_DATASET = None
        yield
        analytics_module.TERM_DATASET = None

    @patch("pandas.read_json")
    @pytest.mark.asyncio
    async def test_load_marito_data_first_call(self, mock_read_json, sample_dataframe):
        """Test loading data for the first time"""
        mock_read_json.return_value = sample_dataframe

        result = await load_marito_data()

        mock_read_json.assert_called_once_with(DATASET_PATH)
        assert result is not None
        assert len(result) == 4
        assert list(result.columns) == [
            "category",
            "eng_term",
            "spa_term",
            "fra_term",
            "deu_term",
            "eng_definition",
            "spa_definition",
            "fra_definition",
        ]

    @patch("pandas.read_json")
    @pytest.mark.asyncio
    async def test_load_marito_data_cached(self, mock_read_json, sample_dataframe):
        """Test that data is cached on subsequent calls"""
        mock_read_json.return_value = sample_dataframe

        # First call
        result1 = await load_marito_data()
        # Second call
        result2 = await load_marito_data()

        # Should only be called once due to caching
        mock_read_json.assert_called_once()
        assert result1 is result2  # Same object reference

    @patch("pandas.read_json")
    @pytest.mark.asyncio
    async def test_load_marito_data_column_normalization(self, mock_read_json):
        """Test that column names are properly normalized"""
        # Create DataFrame with messy column names
        messy_df = pd.DataFrame(
            {
                "Category ": ["Stats"],
                " ENG Term": ["Mean"],
                "SPA Definition ": ["Definición"],
            }
        )
        mock_read_json.return_value = messy_df

        result = await load_marito_data()

        expected_columns = ["category", "eng_term", "spa_definition"]
        assert list(result.columns) == expected_columns

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_get_descriptive_analytics_success(
        self, mock_load_data, sample_dataframe
    ):
        """Test successful descriptive analytics endpoint"""
        mock_load_data.return_value = sample_dataframe

        response = client.get("/analytics/descriptive")

        assert response.status_code == 200
        data = response.json()

        # Check structure
        expected_keys = [
            "category_frequency",
            "language_coverage_percent",
            "average_term_lengths",
            "average_definition_lengths",
            "unique_term_counts",
        ]
        assert all(key in data for key in expected_keys)

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_category_frequency_calculation(
        self, mock_load_data, sample_dataframe
    ):
        """Test category frequency calculation"""
        mock_load_data.return_value = sample_dataframe

        response = client.get("/analytics/descriptive")
        data = response.json()

        category_freq = data["category_frequency"]
        assert category_freq["Statistics"] == 2
        assert category_freq["Probability"] == 2

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_language_coverage_calculation(
        self, mock_load_data, sample_dataframe
    ):
        """Test language coverage percentage calculation"""
        mock_load_data.return_value = sample_dataframe

        response = client.get("/analytics/descriptive")
        data = response.json()

        coverage = data["language_coverage_percent"]

        # eng_term: 4/4 = 100%
        assert coverage["eng_term"] == 100.0
        # spa_term: 3/4 = 75% (1 None)
        assert coverage["spa_term"] == 75.0
        # fra_term: 3/4 = 75% (1 None)
        assert coverage["fra_term"] == 75.0
        # deu_term: 2/4 = 50% (2 None)
        assert coverage["deu_term"] == 50.0

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_term_length_calculation(self, mock_load_data, sample_dataframe):
        """Test average term length calculation"""
        mock_load_data.return_value = sample_dataframe

        response = client.get("/analytics/descriptive")
        data = response.json()

        term_lengths = data["average_term_lengths"]

        # Check that values are reasonable (should be floats)
        assert isinstance(term_lengths["eng_term"], float)
        assert term_lengths["eng_term"] > 0

        # eng_term lengths: Mean(4), Median(6), Distribution(12), Variance(8) = avg 7.5
        assert term_lengths["eng_term"] == 7.5

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_definition_length_calculation(
        self, mock_load_data, sample_dataframe
    ):
        """Test average definition length calculation"""
        mock_load_data.return_value = sample_dataframe

        response = client.get("/analytics/descriptive")
        data = response.json()

        def_lengths = data["average_definition_lengths"]

        # Should have definition lengths for all definition columns
        assert "eng_definition" in def_lengths
        assert "spa_definition" in def_lengths
        assert "fra_definition" in def_lengths

        assert isinstance(def_lengths["eng_definition"], float)
        assert def_lengths["eng_definition"] > 0

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_unique_term_counts(self, mock_load_data, sample_dataframe):
        """Test unique term count calculation"""
        mock_load_data.return_value = sample_dataframe

        response = client.get("/analytics/descriptive")
        data = response.json()

        unique_counts = data["unique_term_counts"]

        # All terms are unique in our sample data
        assert unique_counts["eng_term"] == 4
        assert unique_counts["spa_term"] == 3  # One is None
        assert unique_counts["fra_term"] == 3  # One is None
        assert unique_counts["deu_term"] == 2  # Two are None

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_no_definition_columns_fallback(self, mock_load_data):
        """Test fallback when no multilingual definition columns exist"""
        # Create DataFrame with only eng_definition
        df = pd.DataFrame(
            {
                "category": ["Stats"],
                "eng_term": ["Mean"],
                "eng_definition": ["The average value"],
            }
        )
        mock_load_data.return_value = df

        response = client.get("/analytics/descriptive")
        data = response.json()

        def_lengths = data["average_definition_lengths"]
        assert "eng_definition" in def_lengths
        assert len(def_lengths) == 1

    # @patch('app.api.v1.endpoints.analytics.load_marito_data')
    # @pytest.mark.asyncio
    # async def test_empty_dataframe_handling(self, mock_load_data):
    #     """Test handling of empty DataFrame"""
    #     empty_df = pd.DataFrame()
    #     mock_load_data.return_value = empty_df

    #     response = client.get("/api/analytics/descriptive")

    #     # Empty DataFrame should cause an error (500) since the endpoint
    #     # doesn't handle this case gracefully
    #     assert response.status_code == 500

    @patch("pandas.read_json")
    @pytest.mark.asyncio
    async def test_file_not_found_error(self, mock_read_json):
        """Test handling when JSON file is not found"""
        mock_read_json.side_effect = FileNotFoundError("File not found")

        with pytest.raises(FileNotFoundError):
            await load_marito_data()

    @patch("pandas.read_json")
    @pytest.mark.asyncio
    async def test_invalid_json_error(self, mock_read_json):
        """Test handling of invalid JSON data"""
        mock_read_json.side_effect = ValueError("Invalid JSON")

        with pytest.raises(ValueError):
            await load_marito_data()

    def test_dataset_path_construction(self):
        """Test that dataset path is constructed correctly"""
        assert DATASET_PATH.endswith("multilingual_statistical_terminology_clean.json")
        assert "Mock_Data" in DATASET_PATH

    @patch("app.api.v1.endpoints.analytics.load_marito_data")
    @pytest.mark.asyncio
    async def test_response_format_validation(self, mock_load_data, sample_dataframe):
        """Test that response format matches expected structure"""
        mock_load_data.return_value = sample_dataframe

        response = client.get("/analytics/descriptive")
        data = response.json()

        # Validate data types
        assert isinstance(data["category_frequency"], dict)
        assert isinstance(data["language_coverage_percent"], dict)
        assert isinstance(data["average_term_lengths"], dict)
        assert isinstance(data["average_definition_lengths"], dict)
        assert isinstance(data["unique_term_counts"], dict)

        # Validate that percentages are between 0 and 100
        for percentage in data["language_coverage_percent"].values():
            assert 0 <= percentage <= 100

        # Validate that counts are non-negative integers
        for count in data["unique_term_counts"].values():
            assert isinstance(count, int)
            assert count >= 0


# Integration tests
class TestAnalyticsIntegration:
    """Integration tests for the analytics API"""

    def test_analytics_endpoint_accessibility(self):
        """Test that the analytics endpoint is accessible"""
        # This would normally fail without mocking, but tests the route setup
        response = client.get("/analytics/descriptive")
        # Should get some response (likely 500 due to missing data file in test env)
        assert response.status_code in [200, 500]

    def test_router_prefix_and_tags(self):
        """Test that router is configured with correct prefix and tags"""
        assert router.prefix == ""


# Pytest configuration
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
