"""
Unit tests for individual functions in the glossary module.
These tests cover the business logic without needing a database.
"""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import uuid


class TestGlossaryFunctions:
    """Test individual functions from the glossary module."""

    @pytest_asyncio.fixture
    async def mock_db(self):
        """Create a properly configured mock database session."""
        db = AsyncMock()
        return db

    @pytest_asyncio.fixture
    def mock_term(self):
        """Create a mock term object."""
        term = MagicMock()
        term.id = uuid.uuid4()
        term.term = "hello"
        term.definition = "A greeting"
        term.domain = "Common"
        term.language = "English"
        return term

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_get_all_categories_function(self, mock_db):
        """Test the get_all_categories function directly."""
        from app.api.v1.endpoints.glossary import get_all_categories

        # Setup mocks
        mock_result = MagicMock()
        mock_result.all.return_value = [("Common",), ("Science",), ("Geography",)]
        mock_db.execute.return_value = mock_result

        # Call the function
        result = await get_all_categories(mock_db)

        # Assertions
        assert result == ["Common", "Science", "Geography"]
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_terms_by_category_function(self, mock_db, mock_term):
        """Test the get_terms_by_category function directly."""
        from app.api.v1.endpoints.glossary import get_terms_by_category

        # Setup mocks
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Call the function
        result = await get_terms_by_category(mock_db, "Common")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "hello"
        assert result[0]["category"] == "Common"
        assert result[0]["language"] == "English"
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_term_translations_function_with_uuid(self, mock_db):
        """Test the get_term_translations function with UUID and translations."""
        from app.api.v1.endpoints.glossary import get_term_translations

        # Create mock term with translations to cover line 87
        mock_translation = MagicMock()
        mock_translation.language = "Afrikaans"
        mock_translation.term = "hallo"

        mock_term = MagicMock()
        mock_term.term = "hello"
        mock_term.definition = "A greeting"
        mock_term.translations = [mock_translation]  # Has translations

        # Setup mocks
        mock_scalars = MagicMock()
        mock_scalars.first.return_value = mock_term
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Call the function with valid UUID
        term_uuid = str(uuid.uuid4())
        result = await get_term_translations(mock_db, term_uuid)

        # Assertions
        assert result["term"] == "hello"
        assert result["definition"] == "A greeting"
        assert result["translations"]["Afrikaans"] == "hallo"
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_term_translations_function_with_name(self, mock_db, mock_term):
        """Test the get_term_translations function with term name."""
        from app.api.v1.endpoints.glossary import get_term_translations

        # Setup mocks
        mock_scalars = MagicMock()
        mock_scalars.first.return_value = mock_term
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Call the function with term name (not UUID)
        result = await get_term_translations(mock_db, "hello")

        # Assertions
        assert result["term"] == "hello"
        assert result["definition"] == "A greeting"
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_term_translations_function_not_found(self, mock_db):
        """Test the get_term_translations function when term not found."""
        from app.api.v1.endpoints.glossary import get_term_translations

        # Setup mocks
        mock_scalars = MagicMock()
        mock_scalars.first.return_value = None
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Call the function
        result = await get_term_translations(mock_db, "nonexistent")

        # Assertions
        assert result is None
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_terms_function(self, mock_db, mock_term):
        """Test the search_terms function directly."""
        from app.api.v1.endpoints.glossary import search_terms

        # Setup mocks
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Call the function
        result = await search_terms(mock_db, "hello")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "hello"
        assert result[0]["language"] == "English"
        mock_db.execute.assert_called_once()

    def test_language_map_coverage(self):
        """Test the language map constant."""
        from app.api.v1.endpoints.glossary import LANGUAGE_MAP

        # Test that language map has expected languages
        assert "English" in LANGUAGE_MAP
        assert "Afrikaans" in LANGUAGE_MAP
        assert len(LANGUAGE_MAP) > 5  # Should have multiple languages


class TestGlossaryAPIEndpoints:
    """Test the actual FastAPI endpoint functions."""

    @pytest_asyncio.fixture
    async def mock_db(self):
        """Create a properly configured mock database session."""
        return AsyncMock()

    @pytest_asyncio.fixture
    def mock_term(self):
        """Create a mock term object."""
        term = MagicMock()
        term.id = uuid.uuid4()
        term.term = "hello"
        term.definition = "A greeting"
        term.domain = "Common"
        term.language = "English"
        return term

    @patch("app.api.v1.endpoints.glossary.get_all_categories")
    @pytest.mark.asyncio
    async def test_get_categories_endpoint(self, mock_get_categories, mock_db):
        """Test the get_categories endpoint."""
        from app.api.v1.endpoints.glossary import get_categories

        # Setup mock
        mock_get_categories.return_value = ["Common", "Science", "Geography"]

        # Call the endpoint
        result = await get_categories(mock_db)

        # Assertions
        assert result == ["Common", "Science", "Geography"]
        mock_get_categories.assert_called_once_with(mock_db)

    @patch("app.api.v1.endpoints.glossary.get_terms_by_category")
    @pytest.mark.asyncio
    async def test_get_terms_by_category_endpoint(self, mock_get_terms, mock_db):
        """Test the get_terms_by_category_api endpoint."""
        from app.api.v1.endpoints.glossary import get_terms_by_category_api

        # Setup mock
        mock_get_terms.return_value = [
            {"term": "hello", "definition": "A greeting", "language": "English"}
        ]

        # Call the endpoint
        result = await get_terms_by_category_api("Common", mock_db)

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "hello"
        mock_get_terms.assert_called_once_with(mock_db, "Common")

    @patch("app.api.v1.endpoints.glossary.search_terms")
    @pytest.mark.asyncio
    async def test_search_terms_endpoint(self, mock_search, mock_db):
        """Test the search_terms_api endpoint."""
        from app.api.v1.endpoints.glossary import search_terms_api

        # Setup mock - search_terms_api returns results directly, not wrapped
        mock_search.return_value = [
            {"term": "hello", "definition": "A greeting", "language": "English"}
        ]

        # Call the endpoint
        result = await search_terms_api("hello", mock_db)

        # Assertions - result should be the list directly
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["term"] == "hello"
        mock_search.assert_called_once_with(mock_db, "hello")

    @pytest.mark.asyncio
    async def test_get_available_languages_endpoint(self, mock_db):
        """Test the get_available_languages endpoint."""
        from app.api.v1.endpoints.glossary import get_available_languages

        # Setup mock
        mock_result = MagicMock()
        mock_result.all.return_value = [("English",), ("Afrikaans",)]
        mock_db.execute.return_value = mock_result

        # Call the endpoint
        result = await get_available_languages(mock_db)

        # Assertions
        assert "English" in result
        assert "Afrikaans" in result
        mock_db.execute.assert_called_once()

    @patch("app.api.v1.endpoints.glossary.get_all_categories")
    @pytest.mark.asyncio
    async def test_get_domains_endpoint(self, mock_get_categories, mock_db):
        """Test the get_domains endpoint."""
        from app.api.v1.endpoints.glossary import get_domains

        # Setup mock
        mock_get_categories.return_value = ["Common", "Science", "Geography"]

        # Call the endpoint
        result = await get_domains(mock_db)

        # Assertions
        assert result == ["Common", "Science", "Geography"]
        mock_get_categories.assert_called_once_with(mock_db)

    @patch("app.api.v1.endpoints.glossary.get_term_translations")
    @pytest.mark.asyncio
    async def test_get_term_translations_api_success(
        self, mock_get_translations, mock_db
    ):
        """Test the get_term_translations_api endpoint with existing term."""
        from app.api.v1.endpoints.glossary import get_term_translations_api

        # Setup mock
        mock_get_translations.return_value = {
            "term": "hello",
            "definition": "A greeting",
            "translations": {"Spanish": "hola"},
        }

        # Call the endpoint
        result = await get_term_translations_api("123", mock_db)

        # Assertions
        assert result["term"] == "hello"
        assert "translations" in result
        mock_get_translations.assert_called_once_with(mock_db, "123")

    @patch("app.api.v1.endpoints.glossary.get_term_translations")
    @pytest.mark.asyncio
    async def test_get_term_translations_api_not_found(
        self, mock_get_translations, mock_db
    ):
        """Test the get_term_translations_api endpoint with non-existing term."""
        from app.api.v1.endpoints.glossary import get_term_translations_api
        from fastapi import HTTPException

        # Setup mock
        mock_get_translations.return_value = None

        # Call the endpoint and expect exception
        with pytest.raises(HTTPException) as exc_info:
            await get_term_translations_api("nonexistent", mock_db)

        assert exc_info.value.status_code == 404
        mock_get_translations.assert_called_once_with(mock_db, "nonexistent")

    @pytest.mark.asyncio
    async def test_advanced_search_endpoint(self, mock_db, mock_term):
        """Test the advanced_search endpoint."""
        from app.api.v1.endpoints.glossary import advanced_search

        # Setup mocks
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result
        mock_db.scalar.return_value = 1

        # Call the endpoint
        result = await advanced_search("hello", "Common", "English", 1, 10, mock_db)

        # Assertions
        assert "results" in result
        assert "total" in result
        assert "page" in result
        assert "limit" in result
        assert result["page"] == 1
        assert result["limit"] == 10

    @pytest.mark.asyncio
    async def test_translate_terms_endpoint(self, mock_db, mock_term):
        """Test the translate_terms endpoint."""
        from app.api.v1.endpoints.glossary import translate_terms

        # Setup mocks
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Call the endpoint
        result = await translate_terms(
            terms=["hello"],
            source_language="English",
            target_languages=["Spanish"],
            domain=None,
            db=mock_db,
        )

        # Assertions
        assert "results" in result
        assert isinstance(result["results"], list)

    @pytest.mark.asyncio
    async def test_get_glossary_stats_endpoint(self, mock_db):
        """Test the get_glossary_stats endpoint."""
        from app.api.v1.endpoints.glossary import get_glossary_stats

        # Setup mocks for different queries
        mock_db.scalar.return_value = 100  # total terms

        mock_lang_result = MagicMock()
        mock_lang_result.all.return_value = [("English",), ("Afrikaans",)]

        mock_cat_result = MagicMock()
        mock_cat_result.all.return_value = [("Common",), ("Science",)]

        # Configure execute to return different results for different calls
        mock_db.execute.side_effect = [
            mock_lang_result,
            mock_cat_result,
            mock_lang_result,
        ]

        # Call the endpoint
        result = await get_glossary_stats(mock_db)

        # Assertions
        assert "total_terms" in result
        assert "languages_count" in result
        assert "categories_count" in result
        assert "languages" in result

    @pytest.mark.asyncio
    async def test_get_random_terms_endpoint(self, mock_db, mock_term):
        """Test the get_random_term endpoint."""
        from app.api.v1.endpoints.glossary import get_random_term

        # Setup mocks
        mock_db.scalar.return_value = 100  # total terms count

        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        # Call the endpoint (it takes count as first parameter)
        result = await get_random_term(1, mock_db)

        # Assertions
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["term"] == "hello"
        assert result[0]["category"] == "Common"
        assert result[0]["language"] == "English"

    @pytest.mark.asyncio
    async def test_get_term_translations_function_no_translations(self, mock_db):
        """Test get_term_translations when term has no translations."""
        from app.api.v1.endpoints.glossary import get_term_translations

        # Create a mock term with no translations
        mock_term = MagicMock()
        mock_term.term = "hello"
        mock_term.definition = "A greeting"
        mock_term.translations = None  # No translations

        mock_scalar = MagicMock()
        mock_scalar.first.return_value = mock_term
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalar
        mock_db.execute.return_value = mock_result

        result = await get_term_translations(mock_db, "hello")

        assert result["term"] == "hello"
        assert result["translations"] == {}

    @pytest.mark.asyncio
    async def test_get_terms_by_category_api_not_found(self, mock_db):
        """Test get_terms_by_category_api when no terms found."""
        from app.api.v1.endpoints.glossary import get_terms_by_category_api
        import pytest
        from fastapi import HTTPException

        # Mock empty result
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = []
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc_info:
            await get_terms_by_category_api("NonExistent", mock_db)

        assert exc_info.value.status_code == 404
        assert "No terms found for category: NonExistent" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_translate_terms_with_domain_filter(self, mock_db, mock_term):
        """Test translate_terms with domain filtering."""
        from app.api.v1.endpoints.glossary import translate_terms

        # Setup mock with translations
        mock_translation = MagicMock()
        mock_translation.language = "Afrikaans"
        mock_translation.term = "hallo"
        mock_term.translations = [mock_translation]

        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute.return_value = mock_result

        result = await translate_terms(
            ["hello"],
            source_language="English",
            target_languages=["Afrikaans"],
            domain="Common",
            db=mock_db,
        )

        assert "results" in result
        assert len(result["results"]) == 1
        assert result["results"][0]["translations"]["Afrikaans"] == "hallo"

    @pytest.mark.asyncio
    async def test_get_random_term_empty_database(self, mock_db):
        """Test get_random_term when database is empty."""
        from app.api.v1.endpoints.glossary import get_random_term

        # Mock empty database
        mock_db.scalar.return_value = 0  # No terms

        result = await get_random_term(1, mock_db)

        assert result == []
