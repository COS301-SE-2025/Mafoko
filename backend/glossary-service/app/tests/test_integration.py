"""
Integration tests for the glossary API endpoints.
These tests verify the actual workflow and integration between components.
"""

import pytest
import pytest_asyncio  # noqa: F401
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from uuid import uuid4

from app.main import app


class TestGlossaryAPIIntegration:
    """Integration tests for glossary API workflows."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_complete_search_workflow(self, mock_get_db, client):
        """Test complete search workflow: categories -> search -> translations."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        # Step 1: Get categories
        mock_result = AsyncMock()
        mock_result.all.return_value = [("Statistics",), ("Technology",)]
        mock_db.execute.return_value = mock_result

        response = client.get("/categories")
        assert response.status_code == 200
        categories = response.json()
        assert "Statistics" in categories

        # Step 2: Search for terms
        mock_result.scalars.return_value.all.return_value = [
            type(
                "Term",
                (),
                {
                    "id": uuid4(),
                    "term": "Statistical Analysis",
                    "definition": "Data analysis",
                    "language": "English",
                    "domain": "Statistics",
                },
            )()
        ]

        response = client.get("/search?query=statistical")
        assert response.status_code == 200
        search_results = response.json()
        assert len(search_results) == 1

        # Step 3: Get translations for found term
        with patch(
            "app.api.v1.endpoints.glossary.get_term_translations"
        ) as mock_translations:
            mock_translations.return_value = {
                "term": "Statistical Analysis",
                "translations": {
                    "Afrikaans": "Statistiese Analise",
                    "Zulu": "Ukuhlaziya kwezibalo",
                },
            }

            term_id = str(search_results[0]["id"])
            response = client.get(f"/terms/{term_id}/translations")
            assert response.status_code == 200
            translations = response.json()
            assert "Afrikaans" in translations["translations"]

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_advanced_search_with_filters_workflow(self, mock_get_db, client):
        """Test advanced search with filters workflow."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        # Mock count and results
        mock_db.scalar.return_value = 2
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = [
            type(
                "Term",
                (),
                {
                    "id": uuid4(),
                    "term": "Data Science",
                    "definition": "Science of data",
                    "language": "English",
                    "domain": "Technology",
                },
            )(),
            type(
                "Term",
                (),
                {
                    "id": uuid4(),
                    "term": "Machine Learning",
                    "definition": "AI subset",
                    "language": "English",
                    "domain": "Technology",
                },
            )(),
        ]
        mock_db.execute.return_value = mock_result

        # Test advanced search with filters
        response = client.post(
            "/search",
            json={
                "query": "data",
                "domain": "Technology",
                "language": "English",
                "page": 1,
                "limit": 10,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["page"] == 1
        assert len(data["results"]) == 2

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_translation_workflow(self, mock_get_db, client):
        """Test translation workflow."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        # Create mock term with translations
        mock_translation1 = AsyncMock()
        mock_translation1.language = "Afrikaans"
        mock_translation1.term = "Data Wetenskap"

        mock_translation2 = AsyncMock()
        mock_translation2.language = "Zulu"
        mock_translation2.term = "Isayensi yedatha"

        mock_term = AsyncMock()
        mock_term.id = uuid4()
        mock_term.term = "Data Science"
        mock_term.definition = "Science of data"
        mock_term.translations = [mock_translation1, mock_translation2]

        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = [mock_term]
        mock_db.execute.return_value = mock_result

        # Test translation
        response = client.post(
            "/translate",
            json={
                "terms": ["Data Science"],
                "source_language": "English",
                "target_languages": ["Afrikaans", "Zulu"],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 1
        result = data["results"][0]
        assert result["term"] == "Data Science"
        assert "Afrikaans" in result["translations"]
        assert "Zulu" in result["translations"]

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_stats_and_languages_workflow(self, mock_get_db, client):
        """Test getting stats and available languages."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        # Test languages endpoint
        mock_result = AsyncMock()
        mock_result.all.return_value = [("English",), ("Afrikaans",), ("Zulu",)]
        mock_db.execute.return_value = mock_result

        response = client.get("/languages")
        assert response.status_code == 200
        languages = response.json()
        assert "English" in languages

        # Test stats endpoint
        mock_db.scalar.side_effect = [100, 3, 5]  # total_terms, languages, categories

        response = client.get("/stats")
        assert response.status_code == 200
        stats = response.json()
        assert "total_terms" in stats

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_error_handling_workflow(self, mock_get_db, client):
        """Test error handling in various scenarios."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        # Test database error
        mock_db.execute.side_effect = Exception("Database error")
        response = client.get("/categories")
        assert response.status_code == 500

        # Reset mock for next test
        mock_db.execute.side_effect = None
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result

        # Test not found scenarios
        response = client.get("/categories/NonExistent/terms")
        assert response.status_code == 404

        # Test invalid input
        response = client.get("/search")  # Missing query parameter
        assert response.status_code == 422


class TestGlossaryAPIPerformance:
    """Performance and edge case tests for glossary API."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_large_search_results(self, mock_get_db, client):
        """Test handling of large search results."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        # Mock large result set
        large_results = []
        for i in range(100):
            large_results.append(
                type(
                    "Term",
                    (),
                    {
                        "id": uuid4(),
                        "term": f"Term {i}",
                        "definition": f"Definition {i}",
                        "language": "English",
                        "domain": "Test",
                    },
                )()
            )

        mock_db.scalar.return_value = 100
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = large_results[
            :10
        ]  # Paginated
        mock_db.execute.return_value = mock_result

        response = client.post(
            "/search", json={"query": "term", "page": 1, "limit": 10}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 100
        assert len(data["results"]) == 10
        assert data["pages"] == 10

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_special_characters_in_search(self, mock_get_db, client):
        """Test search with special characters and unicode."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result

        # Test various special characters
        special_queries = [
            "résumé",  # Accents
            "naïve",  # Diaeresis
            "café",  # Acute accent
            "piñata",  # Tilde
            "Москва",  # Cyrillic
            "北京",  # Chinese characters
            "test@#$%^&*()",  # Special symbols
        ]

        for query in special_queries:
            response = client.get(f"/search?query={query}")
            assert response.status_code == 200

    @patch("app.api.v1.endpoints.glossary.get_db")
    async def test_concurrent_request_simulation(self, mock_get_db, client):
        """Simulate concurrent requests to test thread safety."""
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db

        mock_result = AsyncMock()
        mock_result.all.return_value = [("Statistics",), ("Technology",)]
        mock_db.execute.return_value = mock_result

        # Simulate multiple concurrent requests
        responses = []
        for i in range(10):
            response = client.get("/categories")
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200
            assert len(response.json()) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
