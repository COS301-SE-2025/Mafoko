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
    async def test_get_terms_by_category_multiple_approaches(self):
        """Test get_terms_by_category with different SQL approaches."""
        from app.api.v1.endpoints.glossary import get_terms_by_category

        # Create a mock database session
        mock_db = AsyncMock()

        # Set up mock data for the first SQL approach (Approach 1: TRIM)
        mock_term_id = uuid.uuid4()
        mock_row1 = (
            mock_term_id,
            "Statistical Analysis",
            "The process of analyzing data",
            "Statistics",
            "English",
        )

        # Create a mock for the first approach that succeeds
        mock_result1 = MagicMock()
        mock_result1.fetchall.return_value = [mock_row1]

        # Set up the db.execute to return our mock result
        mock_db.execute.return_value = mock_result1

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"
        assert result[0]["category"] == "Statistics"
        assert result[0]["language"] == "English"
        assert result[0]["id"] == str(mock_term_id)

        # Test with trailing space issues - Approach 2
        # Reset the mock
        mock_db.execute.reset_mock()

        # First approach returns empty
        mock_empty_result = MagicMock()
        mock_empty_result.fetchall.return_value = []

        # Second approach returns results
        mock_result2 = MagicMock()
        mock_result2.fetchall.return_value = [mock_row1]

        # Set up sequence of mock returns
        mock_db.execute.side_effect = [mock_empty_result, mock_result2]

        # Call the function again
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"

        # Test with approach 3 - exact match including trailing space
        mock_db.execute.reset_mock()
        mock_db.execute.side_effect = [
            mock_empty_result,
            mock_empty_result,
            mock_result2,
        ]

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"

        # Test with approach 4 - adding trailing space explicitly
        mock_db.execute.reset_mock()
        mock_db.execute.side_effect = [
            mock_empty_result,
            mock_empty_result,
            mock_empty_result,
            mock_result2,
        ]

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"

        # Test with approach 5 - similar domains search
        mock_db.execute.reset_mock()

        # All previous approaches return empty
        mock_db.execute.side_effect = [
            mock_empty_result,  # First approach
            mock_empty_result,  # Second approach
            mock_empty_result,  # Third approach
            mock_empty_result,  # Fourth approach
            MagicMock(
                fetchall=lambda: [("Statistics/Probability",)]
            ),  # Similar domains
            MagicMock(fetchall=lambda: [mock_row1]),  # Final domain search
        ]

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"

    @pytest.mark.asyncio
    async def test_get_terms_by_category_exception_handling(self):
        """Test get_terms_by_category function's exception handling."""
        from app.api.v1.endpoints.glossary import get_terms_by_category

        # Create a mock database session
        mock_db = AsyncMock()

        # Set up db.execute to raise an exception
        mock_db.execute.side_effect = Exception("Database error")

        # Set up orm term for the final approach
        mock_term = MagicMock()
        mock_term.id = uuid.uuid4()
        mock_term.term = "Statistical Analysis"
        mock_term.definition = "The process of analyzing data"
        mock_term.domain = "Statistics"
        mock_term.language = "English"

        # Set up mock for the ORM query that runs after exception
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_term]
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        # After the exception, db.execute is called with the ORM query
        mock_db.execute.side_effect = [Exception("Database error"), mock_result]

        # Call the function
        result = await get_terms_by_category(mock_db, "Statistics")

        # Assertions - should still get results from ORM approach
        assert len(result) == 1
        assert result[0]["term"] == "Statistical Analysis"
        assert result[0]["category"] == "Statistics"

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
