import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app


class MockTerm:
    """Mock Term model for testing without real database."""

    def __init__(self, id, term, definition, domain="Common", language="English"):
        self.id = id
        self.term = term
        self.definition = definition
        self.domain = domain
        self.language = language


@pytest.fixture
def client():
    """Create test client for the real FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_db_session():
    """Mock database session."""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def sample_terms():
    """Sample terms for testing."""
    return [
        MockTerm("1", "hello", "A greeting", "Common", "English"),
        MockTerm("2", "world", "The earth", "Geography", "English"),
        MockTerm("3", "science", "Study of natural phenomena", "Science", "English"),
    ]


class TestRealGlossaryEndpoints:
    """Test the actual glossary endpoints with mocked database calls."""

    @patch("mavito_common.db.session.get_db")
    @patch("app.api.v1.endpoints.glossary.get_all_categories")
    def test_get_categories_real_endpoint(
        self, mock_get_categories, mock_get_db, client, mock_db_session
    ):
        """Test the real /categories endpoint."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_categories.return_value = ["Common", "Geography", "Science"]

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/categories")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "Common" in data
        assert "Geography" in data
        assert "Science" in data

        # Verify mocks were called
        mock_get_categories.assert_called_once()

    @patch("mavito_common.db.session.get_db")
    @patch("app.api.v1.endpoints.glossary.get_terms_by_category")
    def test_get_terms_by_category_real_endpoint(
        self, mock_get_terms, mock_get_db, client, mock_db_session, sample_terms
    ):
        """Test the real /categories/{category} endpoint."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_terms.return_value = [
            {
                "id": "1",
                "term": "hello",
                "definition": "A greeting",
                "domain": "Common",
                "language": "English",
            }
        ]

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/categories/Common")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["term"] == "hello"
        assert data[0]["domain"] == "Common"

        # Verify mocks were called
        mock_get_terms.assert_called_once()

    @patch("mavito_common.db.session.get_db")
    def test_search_terms_real_endpoint(self, mock_get_db, client, mock_db_session):
        """Test the real /search endpoint."""
        # Setup mock database response
        mock_get_db.return_value = mock_db_session
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute.return_value = mock_result

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/search?query=hello")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)

    @patch("mavito_common.db.session.get_db")
    def test_advanced_search_real_endpoint(self, mock_get_db, client, mock_db_session):
        """Test the real /search POST endpoint."""
        # Setup mock database response
        mock_get_db.return_value = mock_db_session
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute.return_value = mock_result

        # Make request to real endpoint
        response = client.post(
            "/api/v1/glossary/search",
            data={"query": "hello", "domain": "Common", "page": 1, "limit": 10},
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data

    @patch("mavito_common.db.session.get_db")
    def test_get_languages_real_endpoint(self, mock_get_db, client, mock_db_session):
        """Test the real /languages endpoint."""
        # Setup mock
        mock_get_db.return_value = mock_db_session

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/languages")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "English" in data
        assert "Afrikaans" in data

    @patch("mavito_common.db.session.get_db")
    def test_get_domains_real_endpoint(self, mock_get_db, client, mock_db_session):
        """Test the real /domains endpoint."""
        # Setup mock database response
        mock_get_db.return_value = mock_db_session
        mock_result = AsyncMock()
        mock_result.all.return_value = [("Common",), ("Geography",), ("Science",)]
        mock_db_session.execute.return_value = mock_result

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/domains")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @patch("mavito_common.db.session.get_db")
    def test_translate_terms_real_endpoint(self, mock_get_db, client, mock_db_session):
        """Test the real /translate endpoint."""
        # Setup mock
        mock_get_db.return_value = mock_db_session
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute.return_value = mock_result

        # Make request to real endpoint
        response = client.post(
            "/api/v1/glossary/translate",
            json={"terms": ["hello", "world"], "target_language": "Afrikaans"},
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    @patch("mavito_common.db.session.get_db")
    def test_get_stats_real_endpoint(self, mock_get_db, client, mock_db_session):
        """Test the real /stats endpoint."""
        # Setup mock database responses
        mock_get_db.return_value = mock_db_session

        # Mock total terms count
        mock_total_result = AsyncMock()
        mock_total_result.scalar.return_value = 100

        # Mock languages count
        mock_lang_result = AsyncMock()
        mock_lang_result.all.return_value = [("English",), ("Afrikaans",)]

        # Mock categories count
        mock_cat_result = AsyncMock()
        mock_cat_result.all.return_value = [("Common",), ("Science",)]

        # Configure the mock to return different results for different queries
        mock_db_session.execute.side_effect = [
            mock_total_result,  # Total terms query
            mock_lang_result,  # Languages query
            mock_cat_result,  # Categories query
            mock_lang_result,  # Languages list query
        ]

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/stats")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "total_terms" in data
        assert "languages_count" in data
        assert "categories_count" in data
        assert "languages" in data

    @patch("mavito_common.db.session.get_db")
    def test_get_random_terms_real_endpoint(self, mock_get_db, client, mock_db_session):
        """Test the real /random endpoint."""
        # Setup mock database response
        mock_get_db.return_value = mock_db_session
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute.return_value = mock_result

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/random")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @patch("mavito_common.db.session.get_db")
    def test_get_term_translations_real_endpoint(
        self, mock_get_db, client, mock_db_session
    ):
        """Test the real /terms/{term_id}/translations endpoint."""
        # Setup mock database response
        mock_get_db.return_value = mock_db_session
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute.return_value = mock_result

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/terms/123/translations")

        # Assertions
        assert response.status_code == 404  # Term not found

    @patch("mavito_common.db.session.get_db")
    def test_get_term_translations_success_real_endpoint(
        self, mock_get_db, client, mock_db_session
    ):
        """Test the real /terms/{term_id}/translations endpoint with existing term."""
        # Setup mock database response
        mock_get_db.return_value = mock_db_session
        mock_term = MockTerm("123", "hello", "A greeting")
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_term
        mock_db_session.execute.return_value = mock_result

        # Make request to real endpoint
        response = client.get("/api/v1/glossary/terms/123/translations")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "term" in data


class TestRealGlossaryEndpointsErrorHandling:
    """Test error handling in real endpoints."""

    def test_invalid_endpoint(self, client):
        """Test calling a non-existent endpoint."""
        response = client.get("/api/v1/glossary/nonexistent")
        assert response.status_code == 404

    @patch("mavito_common.db.session.get_db")
    def test_database_error_handling(self, mock_get_db, client):
        """Test handling of database errors."""
        # Setup mock to raise an exception
        mock_get_db.side_effect = Exception("Database connection failed")

        # Make request that should trigger the error
        response = client.get("/api/v1/glossary/categories")

        # Should return 500 or handle gracefully
        assert response.status_code in [500, 422]
