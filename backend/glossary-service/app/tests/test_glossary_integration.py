"""
Integration tests for the glossary service.
These tests focus on the functions with lower coverage in glossary.py.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
import uuid


class TestGlossaryIntegration:
    """Integration tests focusing on the glossary API functions with lower coverage."""

    @pytest.mark.asyncio
    async def test_transform_category_name(self):
        """Test category name transformation between display and storage formats."""
        from app.api.v1.endpoints.glossary import transform_category_name

        # Test display format transformation (storage -> display)
        assert (
            transform_category_name("Statistics/Probability", for_display=True)
            == "Statistics or Probability"
        )
        assert (
            transform_category_name("Data Science/Machine Learning", for_display=True)
            == "Data Science or Machine Learning"
        )
        assert (
            transform_category_name("Simple Category", for_display=True)
            == "Simple Category"
        )

        # Test storage format transformation (display -> storage)
        assert (
            transform_category_name("Statistics or Probability", for_display=False)
            == "Statistics/Probability"
        )
        assert (
            transform_category_name(
                "Data Science OR Machine Learning", for_display=False
            )
            == "Data Science/Machine Learning"
        )
        assert (
            transform_category_name("Simple Category", for_display=False)
            == "Simple Category"
        )

        # Test edge cases
        assert transform_category_name("A / B / C", for_display=False) == "A/B/C"
        assert transform_category_name("A or B or C", for_display=False) == "A/B/C"

    @pytest.mark.asyncio
    async def test_get_terms_by_category_url_decoding(self):
        """Test get_terms_by_category with URL-encoded category names."""
        from app.api.v1.endpoints.glossary import get_terms_by_category

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock Term
        mock_term_id = uuid.uuid4()
        mock_term = MagicMock()
        mock_term.id = mock_term_id
        mock_term.term = "Statistical Analysis"
        mock_term.definition = "The process of analyzing data"
        mock_term.domain = "Statistics/Probability"  # Storage format with slash
        mock_term.language = "English"
        mock_term.translations = []

        # Mock the ORM query result
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]

        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        # Set up the db.execute to return our mock result
        mock_db.execute.return_value = mock_result

        # Test with URL-encoded category (Statistics%2FProbability -> Statistics/Probability)
        result = await get_terms_by_category(mock_db, "Statistics%2FProbability")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"
        assert (
            result[0]["category"] == "Statistics/Probability"
        )  # Should preserve storage format

    @pytest.mark.asyncio
    async def test_get_term_translations_by_uuid(self):
        """Test get_term_translations function with UUID lookup."""
        from app.api.v1.endpoints.glossary import get_term_translations

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock term with translations
        mock_term_id = uuid.uuid4()
        mock_term = MagicMock()
        mock_term.term = "Hello"
        mock_term.definition = "A greeting"

        # Mock translations
        mock_translation_es = MagicMock()
        mock_translation_es.language = "Spanish"
        mock_translation_es.term = "Hola"

        mock_translation_fr = MagicMock()
        mock_translation_fr.language = "French"
        mock_translation_fr.term = "Bonjour"

        mock_term.translations = [mock_translation_es, mock_translation_fr]

        # Mock the database query result
        mock_scalars = MagicMock()
        mock_scalars.first.return_value = mock_term

        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        mock_db.execute.return_value = mock_result

        # Call the function with UUID
        result = await get_term_translations(mock_db, str(mock_term_id))

        # Assertions
        assert result is not None
        assert result["term"] == "Hello"
        assert result["definition"] == "A greeting"
        assert "translations" in result
        assert result["translations"]["Spanish"] == "Hola"
        assert result["translations"]["French"] == "Bonjour"

    @pytest.mark.asyncio
    async def test_get_term_translations_by_name(self):
        """Test get_term_translations function with term name lookup."""
        from app.api.v1.endpoints.glossary import get_term_translations

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock term with translations
        mock_term = MagicMock()
        mock_term.term = "Hello"
        mock_term.definition = "A greeting"
        mock_term.translations = []  # No translations

        # Mock the database query result
        mock_scalars = MagicMock()
        mock_scalars.first.return_value = mock_term

        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        mock_db.execute.return_value = mock_result

        # Call the function with term name (not UUID)
        result = await get_term_translations(mock_db, "hello")

        # Assertions
        assert result is not None
        assert result["term"] == "Hello"
        assert result["definition"] == "A greeting"
        assert "translations" in result
        assert result["translations"] == {}  # Empty translations

    @pytest.mark.asyncio
    async def test_get_term_translations_not_found(self):
        """Test get_term_translations function when term is not found."""
        from app.api.v1.endpoints.glossary import get_term_translations

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock empty query result
        mock_scalars = MagicMock()
        mock_scalars.first.return_value = None

        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        mock_db.execute.return_value = mock_result

        # Call the function with non-existent term
        result = await get_term_translations(mock_db, "nonexistent")

        # Assertions
        assert result is None

    @pytest.mark.asyncio
    async def test_get_terms_by_category_orm_approach(self):
        """Test get_terms_by_category with ORM approach (new implementation)."""
        from app.api.v1.endpoints.glossary import get_terms_by_category

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock Term with translations
        mock_term_id = uuid.uuid4()
        mock_term = MagicMock()
        mock_term.id = mock_term_id
        mock_term.term = "Statistical Analysis"
        mock_term.definition = "The process of analyzing data"
        mock_term.domain = "Statistics"
        mock_term.language = "English"

        # Mock translations
        mock_translation_es = MagicMock()
        mock_translation_es.language = "Spanish"
        mock_translation_es.term = "Análisis Estadístico"

        mock_translation_fr = MagicMock()
        mock_translation_fr.language = "French"
        mock_translation_fr.term = "Analyse Statistique"

        mock_term.translations = [mock_translation_es, mock_translation_fr]

        # Mock the ORM query result
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]

        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        # Set up the db.execute to return our mock result
        mock_db.execute.return_value = mock_result

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"
        assert result[0]["category"] == "Statistics"
        assert result[0]["language"] == "English"
        assert result[0]["id"] == str(mock_term_id)
        assert "translations" in result[0]
        assert result[0]["translations"]["Spanish"] == "Análisis Estadístico"
        assert result[0]["translations"]["French"] == "Analyse Statistique"

    @pytest.mark.asyncio
    async def test_get_terms_by_category_fallback_sql(self):
        """Test get_terms_by_category fallback to SQL when ORM returns empty."""
        from app.api.v1.endpoints.glossary import get_terms_by_category

        # Create a mock database session
        mock_db = AsyncMock()

        # Set up mock data for SQL fallback
        mock_term_id = uuid.uuid4()
        mock_row1 = (
            mock_term_id,
            "Statistical Analysis",
            "The process of analyzing data",
            "Statistics",
            "English",
        )

        # Mock empty ORM result
        mock_empty_scalars = MagicMock()
        mock_empty_scalars.all.return_value = []
        mock_empty_result = MagicMock()
        mock_empty_result.scalars.return_value = mock_empty_scalars

        # Mock SQL fallback result
        mock_sql_result = MagicMock()
        mock_sql_result.fetchall.return_value = [mock_row1]

        # Mock Term for second ORM query (to get translations)
        mock_term = MagicMock()
        mock_term.id = mock_term_id
        mock_term.term = "Statistical Analysis"
        mock_term.definition = "The process of analyzing data"
        mock_term.domain = "Statistics"
        mock_term.language = "English"
        mock_term.translations = []

        mock_fallback_scalars = MagicMock()
        mock_fallback_scalars.all.return_value = [mock_term]
        mock_fallback_result = MagicMock()
        mock_fallback_result.scalars.return_value = mock_fallback_scalars

        # Set up sequence: ORM empty -> SQL with results -> ORM for translations
        mock_db.execute.side_effect = [
            mock_empty_result,  # First ORM query returns empty
            mock_sql_result,  # SQL fallback returns results
            mock_fallback_result,  # Second ORM query for translations
        ]

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"
        assert result[0]["category"] == "Statistics"
        assert result[0]["language"] == "English"
        assert result[0]["id"] == str(mock_term_id)
        assert "translations" in result[0]

    @pytest.mark.asyncio
    async def test_get_terms_by_category_exception_handling(self):
        """Test get_terms_by_category function's fallback SQL approach."""
        from app.api.v1.endpoints.glossary import get_terms_by_category

        # Create a mock database session
        mock_db = AsyncMock()

        # Set up orm term for the final approach
        mock_term = MagicMock()
        mock_term.id = uuid.uuid4()
        mock_term.term = "Statistical Analysis"
        mock_term.definition = "The process of analyzing data"
        mock_term.domain = "Statistics"
        mock_term.language = "English"
        mock_term.translations = []  # Mock empty translations list

        # Set up mock for the ORM query (first call) - returns empty results
        mock_orm_scalars = MagicMock()
        mock_orm_scalars.all.return_value = []  # Empty results from ORM
        mock_orm_result = MagicMock()
        mock_orm_result.scalars.return_value = mock_orm_scalars

        # Set up mock for the SQL fallback query (second call) - returns data
        mock_sql_result = MagicMock()
        mock_sql_result.fetchall.return_value = [
            (
                str(mock_term.id),
                mock_term.term,
                mock_term.definition,
                mock_term.domain,
                mock_term.language,
            )
        ]

        # Set up mock for the final ORM query (third call) - returns the term with translations
        mock_final_scalars = MagicMock()
        mock_final_scalars.all.return_value = [mock_term]
        mock_final_result = MagicMock()
        mock_final_result.scalars.return_value = mock_final_scalars

        # Configure the sequence: ORM (empty) -> SQL (success) -> ORM (success)
        mock_db.execute.side_effect = [
            mock_orm_result,  # First ORM query returns empty
            mock_sql_result,  # SQL query returns data
            mock_final_result,  # Final ORM query returns results
        ]

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions - should get results from SQL fallback approach
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"
        assert result[0]["category"] == "Statistics"
        assert "translations" in result[0]

    @pytest.mark.asyncio
    async def test_advanced_search_pagination(self):
        """Test advanced_search function's pagination functionality."""
        from app.api.v1.endpoints.glossary import advanced_search

        # Create a mock database session
        mock_db = AsyncMock()

        # Set up mock terms
        mock_terms = []
        for i in range(5):
            mock_term = MagicMock()
            mock_term.id = uuid.uuid4()
            mock_term.term = f"Term {i+1}"
            mock_term.definition = f"Definition {i+1}"
            mock_term.domain = "Statistics"
            mock_term.language = "English"
            mock_terms.append(mock_term)

        # Mock for domain query
        mock_domain_result = MagicMock()
        mock_domain_result.fetchall.return_value = [("Statistics",)]

        # Mock for count query
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 20  # Total of 20 results

        # Mock for query results with page 1, limit 5
        mock_scalars1 = MagicMock()
        mock_scalars1.all.return_value = mock_terms[:5]  # First 5 terms
        mock_result1 = MagicMock()
        mock_result1.scalars.return_value = mock_scalars1

        # Set up sequence for page 1
        mock_db.execute.side_effect = [mock_domain_result, mock_result1]
        mock_db.scalar.return_value = 20

        # Call function with page 1
        result1 = await advanced_search("stat", "Statistics", "English", 1, 5, mock_db)

        # Assertions for page 1
        assert result1["page"] == 1
        assert result1["limit"] == 5
        assert result1["total"] == 20
        assert len(result1["results"]) == 5
        assert result1["results"][0]["term"] == "Term 1"
        assert result1["results"][4]["term"] == "Term 5"

        # Reset mocks for page 2
        mock_db.execute.reset_mock()
        mock_db.scalar.reset_mock()

        # Mock for query results with page 2, limit 5
        mock_scalars2 = MagicMock()
        mock_scalars2.all.return_value = mock_terms  # Simulate next 5 terms
        mock_result2 = MagicMock()
        mock_result2.scalars.return_value = mock_scalars2

        # Set up sequence for page 2
        mock_db.execute.side_effect = [mock_domain_result, mock_result2]
        mock_db.scalar.return_value = 20

        # Call function with page 2
        result2 = await advanced_search("stat", "Statistics", "English", 2, 5, mock_db)

        # Assertions for page 2
        assert result2["page"] == 2
        assert result2["limit"] == 5
        assert result2["total"] == 20
        assert len(result2["results"]) == 5

    @pytest.mark.asyncio
    async def test_handle_domain_filter_exact_match(self):
        """Test domain filtering with exact matches in advanced_search."""
        from app.api.v1.endpoints.glossary import advanced_search

        # Create a mock database session
        mock_db = AsyncMock()

        # Mock the term results
        mock_term = MagicMock()
        mock_term.id = uuid.uuid4()
        mock_term.term = "Statistical Analysis"
        mock_term.definition = "The process of analyzing data"
        mock_term.domain = "Statistics"
        mock_term.language = "English"

        # Create a mock for exact domain query
        mock_exact_result = MagicMock()
        mock_exact_result.fetchall.return_value = [("Statistics",)]

        # Mock the term results
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        # Set up side effects
        mock_db.execute.side_effect = [
            mock_exact_result,  # Domain query
            mock_result,  # Term query
        ]
        mock_db.scalar.return_value = 5  # Count

        # Call the function with domain parameter
        await advanced_search("test", "Statistics", None, 1, 10, mock_db)

        # Check that db.execute was called at least twice
        assert mock_db.execute.call_count >= 2

    @pytest.mark.asyncio
    async def test_handle_domain_filter_trim_match(self):
        """Test domain filtering with TRIM matches in advanced_search."""
        from app.api.v1.endpoints.glossary import advanced_search

        # Mock Term class instead of importing it
        # Term = MagicMock()

        # Create a mock database session
        mock_db = AsyncMock()

        # Set up empty exact match but successful trim match
        mock_empty_result = MagicMock()
        mock_empty_result.fetchall.return_value = []

        mock_trim_result = MagicMock()
        mock_trim_result.fetchall.return_value = [
            ("Statistics ",)
        ]  # With trailing space

        # Mock the count and result queries
        mock_count = MagicMock()
        mock_count.scalar.return_value = 5

        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = []
        mock_result.scalars.return_value = mock_scalars

        # Set up sequence of responses
        mock_db.execute.side_effect = [
            mock_empty_result,  # Exact match fails
            mock_trim_result,  # Trim match succeeds
            mock_result,  # Results query
        ]
        mock_db.scalar.return_value = 5

        # Call the function with domain parameter
        await advanced_search("test", "Statistics", None, 1, 10, mock_db)

        # Check that db.execute was called the expected number of times
        assert mock_db.execute.call_count >= 3

    @pytest.mark.asyncio
    async def test_handle_domain_filter_similar_match(self):
        """Test domain filtering with similar matches in advanced_search."""
        from app.api.v1.endpoints.glossary import advanced_search

        # Create a mock database session
        mock_db = AsyncMock()

        # Set up multiple failures then similar match
        mock_empty_result = MagicMock()
        mock_empty_result.fetchall.return_value = []

        mock_similar_result = MagicMock()
        mock_similar_result.fetchall.return_value = [
            ("Basic Statistics",),
            ("Applied Statistics",),
        ]

        # Mock the term count result
        mock_term_count = MagicMock()
        mock_term_count.scalar.return_value = 50

        # Mock result after finding the domain
        mock_term = MagicMock()
        mock_term.id = uuid.uuid4()
        mock_term.term = "Statistical Analysis"
        mock_term.definition = "The process of analyzing data"
        mock_term.domain = "Basic Statistics"
        mock_term.language = "English"

        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        # Configure the sequence of responses for db.execute
        mock_db.execute.side_effect = [
            mock_empty_result,  # Exact match fails
            mock_empty_result,  # Trim match fails
            mock_similar_result,  # Similar match succeeds
            mock_result,  # Final results
        ]

        # Just return a constant value for all scalar calls to avoid StopAsyncIteration
        mock_db.scalar.return_value = 1

        # Call the function with domain parameter
        await advanced_search("test", "Statistics", None, 1, 10, mock_db)

        # Check that db.execute was called the expected number of times
        assert mock_db.execute.call_count >= 4
