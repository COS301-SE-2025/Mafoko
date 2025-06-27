"""
Unit tests to achieve 100% coverage for analytics endpoints.
These tests specifically target edge cases and missing coverage areas.
"""

import pytest
import pandas as pd
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

from app.api.v1.endpoints.analytics import router


class TestAnalyticsCoverageCompletion:
    """Tests to complete 100% coverage for analytics endpoints."""

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
    def dataset_no_explicit_definition_columns(self):
        """Create a dataset with no columns ending with '_definition' to trigger fallback."""
        # Create dataset with column names that DON'T end with "_definition"
        # but still have eng_definition for fallback
        data = {
            "category": ["Agriculture", "Education"],
            "eng_term": ["Farming", "Teaching"],
            "afr_term": ["Boerdery", "Onderrig"],
            "eng_description": [
                "The practice of cultivating crops",
                "The process of instruction",
            ],  # Note: not _definition
            "eng_definition": [
                "The practice of cultivating crops",
                "The process of instruction",
            ],  # For fallback
        }
        df = pd.DataFrame(data)
        # Normalize column names as done in the actual function
        df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
        return df

    @pytest.fixture(autouse=True)
    def reset_cache(self):
        """Reset global cache before each test."""
        import app.api.v1.endpoints.analytics as analytics_module

        analytics_module.TERM_DATASET = None
        yield
        analytics_module.TERM_DATASET = None

    def test_definition_length_fallback_to_eng_definition(self, client):
        """Test the fallback case when no explicit definition columns exist (line 105)."""
        # Create a DataFrame that has eng_definition but no columns ending with "_definition"
        # We'll patch get_dataset_columns to return empty definition_columns

        test_df = pd.DataFrame(
            {
                "category": ["Agriculture", "Education"],
                "eng_term": ["Farming", "Teaching"],
                "afr_term": ["Boerdery", "Onderrig"],
                "eng_definition": [
                    "The practice of cultivating crops",
                    "The process of instruction",
                ],
            }
        )

        with patch(
            "app.api.v1.endpoints.analytics.get_dataset_columns"
        ) as mock_get_columns:
            # Return empty definition_columns to trigger the else clause
            mock_get_columns.return_value = (
                test_df,  # df
                ["eng_term", "afr_term"],  # language_columns
                [],  # definition_columns (empty to trigger fallback)
                "category",  # category_column
            )

            # This should trigger the fallback to eng_definition (line 105-107)
            response = client.get("/api/v1/analytics/descriptive/definition-length")
            assert response.status_code == 200
            data = response.json()

            # Should contain eng_definition key only (fallback case)
            assert "eng_definition" in data
            assert isinstance(data["eng_definition"], (int, float))
            assert data["eng_definition"] > 0

            # Should be exactly one key (the fallback)
            assert len(data) == 1

    def test_complete_coverage_workflow_with_fallback(self, client):
        """Test complete workflow that includes the fallback scenario."""
        # Create a DataFrame for testing
        test_df = pd.DataFrame(
            {
                "category": ["Agriculture", "Education"],
                "eng_term": ["Farming", "Teaching"],
                "afr_term": ["Boerdery", "Onderrig"],
                "eng_definition": [
                    "The practice of cultivating crops",
                    "The process of instruction",
                ],
            }
        )

        with patch(
            "app.api.v1.endpoints.analytics.get_dataset_columns"
        ) as mock_get_columns:
            # Return empty definition_columns to trigger the else clause
            mock_get_columns.return_value = (
                test_df,  # df
                ["eng_term", "afr_term"],  # language_columns
                [],  # definition_columns (empty to trigger fallback)
                "category",  # category_column
            )

            # Test the main descriptive endpoint which calls all sub-functions
            response = client.get("/api/v1/analytics/descriptive")
            assert response.status_code == 200
            data = response.json()

            # Verify all components are present
            assert "category_frequency" in data
            assert "language_coverage_percent" in data
            assert "average_term_lengths" in data
            assert "average_definition_lengths" in data
            assert "unique_term_counts" in data

            # The definition lengths should use the fallback
            def_lengths = data["average_definition_lengths"]
            assert "eng_definition" in def_lengths
            assert isinstance(def_lengths["eng_definition"], (int, float))
            assert def_lengths["eng_definition"] > 0
            # Should be exactly one key (the fallback)
            assert len(def_lengths) == 1
