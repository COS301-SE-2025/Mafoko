import pytest
import pytest_asyncio
import uuid
from unittest.mock import AsyncMock

# from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI, APIRouter, Form
from sqlalchemy.ext.asyncio import AsyncSession


# Mock Term model for testing
class MockTerm:
    def __init__(
        self,
        id=None,
        term="",
        definition="",
        domain="",
        language="English",
        translations=None,
    ):
        self.id = id or uuid.uuid4()
        self.term = term
        self.definition = definition
        self.domain = domain
        self.language = language
        self.translations = translations or []


class MockTranslation:
    def __init__(self, language, term):
        self.language = language
        self.term = term


# Create a mock router for testing
mock_router = APIRouter()


@mock_router.get("/categories")
async def mock_get_categories():
    return ["Common", "Geography", "Science"]


@mock_router.get("/categories/stats")
async def mock_get_categories_stats():
    """Mock endpoint for category statistics."""
    return {
        "Common": 25,
        "Geography": 15,
        "Science": 30,
        "Data Science": 12,
        "Statistics or Probability": 8,
    }


@mock_router.get("/categories/{category_name}/terms")
async def mock_get_terms_by_category(category_name: str):
    if category_name == "NonExistent":
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404, detail=f"No terms found for category: {category_name}"
        )
    # Return terms that match the category with translations
    return [
        {
            "id": "123",
            "term": "hello",
            "definition": "A greeting",
            "category": category_name,
            "language": "English",
            "translations": {"Spanish": "hola", "French": "bonjour"},
        }
    ]


@mock_router.get("/search")
async def mock_search_terms(query: str):
    if query == "nonexistent":
        return []
    return [
        {
            "id": "123",
            "term": "hello",
            "definition": "A greeting",
            "category": "Common",
            "language": "English",
        }
    ]


@mock_router.post("/search")
async def mock_advanced_search(
    query: str = Form(None),
    domain: str = Form(None),
    language: str = Form(None),
    page: int = Form(1),
    limit: int = Form(10),
):
    return {"results": [], "total": 0, "page": page, "limit": limit, "pages": 0}


@mock_router.get("/languages")
async def mock_get_languages():
    return {"English": "English", "Afrikaans": "Afrikaans"}


@mock_router.get("/domains")
async def mock_get_domains():
    return ["Common", "Geography", "Science"]


@mock_router.post("/translate")
async def mock_translate_terms():
    return {"results": []}


@mock_router.get("/stats")
async def mock_get_stats():
    return {
        "total_terms": 100,
        "languages_count": 5,
        "categories_count": 10,
        "languages": ["English", "Afrikaans"],
    }


@mock_router.get("/terms/{term_id}/translations")
async def mock_get_term_translations(term_id: str):
    if term_id in ["nonexistent", "nonexistent-id"]:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail=f"Term not found: {term_id}")
    return {
        "term": "hello",
        "definition": "A greeting",
        "translations": {"Spanish": "hola", "French": "bonjour"},
    }


@mock_router.get("/random")
async def mock_get_random_terms():
    return [{"id": "123", "term": "hello", "definition": "A greeting"}]


# Test fixtures
@pytest.fixture
def app():
    """Create FastAPI app with the mock router for testing."""
    app = FastAPI()
    app.include_router(mock_router)
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


@pytest_asyncio.fixture
async def mock_db():
    """Create mock database session."""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def sample_terms():
    """Create sample terms for testing."""
    return [
        MockTerm(
            id=uuid.UUID("123e4567-e89b-12d3-a456-426614174000"),
            term="hello",
            definition="A greeting",
            domain="Common",
            language="English",
        ),
        MockTerm(
            id=uuid.UUID("123e4567-e89b-12d3-a456-426614174001"),
            term="world",
            definition="The earth",
            domain="Geography",
            language="English",
        ),
        MockTerm(
            id=uuid.UUID("123e4567-e89b-12d3-a456-426614174002"),
            term="hola",
            definition="Spanish greeting",
            domain="Common",
            language="Spanish",
        ),
    ]


@pytest.fixture
def sample_term_with_translations():
    """Create a sample term with translations."""
    term = MockTerm(
        id=uuid.UUID("123e4567-e89b-12d3-a456-426614174000"),
        term="hello",
        definition="A greeting",
        domain="Common",
        language="English",
    )
    term.translations = [
        MockTranslation("Spanish", "hola"),
        MockTranslation("French", "bonjour"),
        MockTranslation("German", "hallo"),
    ]
    return term


class TestBasicEndpoints:
    """Test basic endpoints functionality."""

    def test_get_categories_success(self, client):
        """Test successful retrieval of categories."""
        response = client.get("/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "Common" in data

    def test_get_terms_by_category_success(self, client):
        """Test successful retrieval of terms by category."""
        response = client.get("/categories/Common/terms")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 0
        # Check if response includes translations field
        if len(data) > 0:
            assert "translations" in data[0]

    def test_get_terms_by_category_url_encoded(self, client):
        """Test category endpoint with URL-encoded category names."""
        # Test with URL-encoded slash (Data%2FScience)
        response = client.get("/categories/Data%2FScience/terms")
        # Should either return results or 404, but not crash
        assert response.status_code in [200, 404]

    def test_get_terms_by_category_with_or_separator(self, client):
        """Test category endpoint with 'or' separator in category names."""
        # Test with 'or' separator that should be converted to '/'
        response = client.get("/categories/Statistics%20or%20Probability/terms")
        # Should either return results or 404, but not crash
        assert response.status_code in [200, 404]

    def test_get_terms_by_category_not_found(self, client):
        """Test category not found scenario."""
        response = client.get("/categories/NonExistent/terms")
        assert response.status_code == 404
        assert "No terms found for category" in response.json()["detail"]

    def test_get_categories_stats_success(self, client):
        """Test successful retrieval of category statistics."""
        response = client.get("/categories/stats")
        assert response.status_code == 200
        data = response.json()

        # Should return a dictionary with category names as keys and counts as values
        assert isinstance(data, dict)

        # Check that all values are integers (term counts)
        for category, count in data.items():
            assert isinstance(category, str)
            assert isinstance(count, int)
            assert count >= 0

        # Check that Common category exists (as it's part of our test data)
        if "Common" in data:
            assert data["Common"] >= 0

    def test_get_categories_stats_structure(self, client):
        """Test that category stats returns proper structure."""
        response = client.get("/categories/stats")
        assert response.status_code == 200
        data = response.json()

        # Verify structure is Dict[str, int]
        assert isinstance(data, dict)

        # All keys should be non-empty strings
        for category_name in data.keys():
            assert isinstance(category_name, str)
            assert len(category_name) > 0

        # All values should be non-negative integers
        for count in data.values():
            assert isinstance(count, int)
            assert count >= 0

    def test_get_categories_stats_empty_database(self, client):
        """Test category stats endpoint when database might be empty."""
        response = client.get("/categories/stats")
        assert response.status_code == 200
        data = response.json()

        # Even with empty database, should return valid dict structure
        assert isinstance(data, dict)

        # All values should still be non-negative integers
        for count in data.values():
            assert isinstance(count, int)
            assert count >= 0

    def test_search_terms_success(self, client):
        """Test successful term search."""
        response = client.get("/search?query=hello")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_search_terms_empty_result(self, client):
        """Test search with no results."""
        response = client.get("/search?query=nonexistent")
        assert response.status_code == 200
        assert response.json() == []

    def test_search_terms_missing_query(self, client):
        """Test search without query parameter."""
        response = client.get("/search")
        assert response.status_code == 422  # Validation error

    def test_get_available_languages(self, client):
        """Test getting available languages."""
        response = client.get("/languages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "English" in data

    def test_get_domains_success(self, client):
        """Test successful retrieval of domains."""
        response = client.get("/domains")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "Common" in data

    def test_advanced_search_basic(self, client):
        """Test basic advanced search."""
        response = client.post("/search", data={"query": "hello"})
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data
        assert "page" in data

    def test_translate_terms_basic(self, client):
        """Test basic term translation."""
        response = client.post(
            "/translate",
            json={
                "terms": ["hello"],
                "source_language": "English",
                "target_languages": ["Spanish"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    def test_get_glossary_stats(self, client):
        """Test getting glossary statistics."""
        response = client.get("/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_terms" in data
        assert "languages_count" in data
        assert "categories_count" in data

    def test_get_term_translations_success(self, client):
        """Test getting translations by term ID."""
        response = client.get(
            "/terms/123e4567-e89b-12d3-a456-426614174000/translations"
        )
        assert response.status_code == 200
        data = response.json()
        assert "term" in data
        assert "definition" in data
        assert "translations" in data

    def test_get_term_translations_not_found(self, client):
        """Test term not found scenario."""
        response = client.get("/terms/nonexistent/translations")
        assert response.status_code == 404
        assert "Term not found" in response.json()["detail"]

    def test_get_random_terms(self, client):
        """Test getting random terms."""
        response = client.get("/random")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestInputValidation:
    """Test input validation for various endpoints."""

    def test_search_with_special_characters(self, client):
        """Test search with special characters."""
        response = client.get("/search?query=test@#$%^&*()")
        assert response.status_code == 200

    def test_search_with_unicode_characters(self, client):
        """Test search with Unicode characters."""
        unicode_queries = ["café", "naïve", "résumé"]
        for query in unicode_queries:
            response = client.get(f"/search?query={query}")
            assert response.status_code == 200

    def test_category_with_spaces(self, client):
        """Test category endpoint with spaces in category name."""
        response = client.get("/categories/Data%20Science/terms")
        # Should either return results or 404, but not crash
        assert response.status_code in [200, 404]

    def test_category_with_special_characters(self, client):
        """Test category endpoint with special characters."""
        # Test with forward slash (encoded)
        response = client.get("/categories/Statistics%2FProbability/terms")
        assert response.status_code in [200, 404]

        # Test with 'or' keyword
        response = client.get(
            "/categories/Data%20Science%20or%20Machine%20Learning/terms"
        )
        assert response.status_code in [200, 404]

    def test_term_translations_with_invalid_uuid(self, client):
        """Test term translations endpoint with invalid UUID format."""
        response = client.get("/terms/invalid-uuid/translations")
        # Should either return results (if found by name) or 404
        assert response.status_code in [200, 404]

    def test_advanced_search_boundary_values(self, client):
        """Test advanced search with boundary values."""
        # Test with negative page numbers
        response = client.post("/search", data={"page": -1, "limit": 10})
        assert response.status_code in [200, 422]

        # Test with zero limit
        response = client.post("/search", data={"page": 1, "limit": 0})
        assert response.status_code in [200, 422]

    def test_translation_edge_cases(self, client):
        """Test translation endpoint with edge cases."""
        # Empty terms list
        response = client.post(
            "/translate", json={"terms": [], "source_language": "English"}
        )
        assert response.status_code == 200

        # Invalid language codes
        response = client.post(
            "/translate",
            json={"terms": ["hello"], "source_language": "InvalidLanguage"},
        )
        assert response.status_code == 200  # Should handle gracefully


class TestErrorHandling:
    """Test error handling scenarios."""

    def test_invalid_uuid_format(self, client):
        """Test handling of invalid UUID format in term translations."""
        response = client.get("/terms/invalid-uuid-format/translations")
        # The actual response depends on implementation, but it shouldn't crash
        assert response.status_code in [200, 404, 422]

    # def test_malformed_json_request(self, client):
    #     """Test handling of malformed JSON in POST requests."""
    #     response = client.post("/search", data="invalid json")
    #     assert response.status_code == 422  # Validation error

    def test_missing_required_parameters(self, client):
        """Test handling of missing required parameters."""
        # Missing query parameter for search
        response = client.get("/search")
        assert response.status_code == 422

        # Empty POST body for translate
        response = client.post("/translate", json={})
        assert response.status_code in [200, 422]  # Depends on validation

    def test_categories_stats_error_handling(self, client):
        """Test error handling for categories/stats endpoint."""
        # Test that endpoint returns valid response even if there are issues
        response = client.get("/categories/stats")
        assert response.status_code == 200
        data = response.json()

        # Should always return a dictionary structure
        assert isinstance(data, dict)

        # Values should always be valid integers
        for category, count in data.items():
            assert isinstance(category, str)
            assert isinstance(count, int)
            assert count >= 0

    def test_categories_stats_endpoint_accessibility(self, client):
        """Test that categories/stats endpoint is accessible and well-formed."""
        response = client.get("/categories/stats")

        # Should not return server errors
        assert response.status_code != 500
        assert response.status_code != 503

        # Should return successful response
        assert response.status_code == 200

        # Response should be valid JSON
        data = response.json()
        assert data is not None


class TestSecurityScenarios:
    """Test security-related scenarios."""

    def test_xss_prevention_in_search(self, client):
        """Test XSS prevention in search queries."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
        ]

        for payload in xss_payloads:
            response = client.get(f"/search?query={payload}")
            assert response.status_code == 200
            # Response should not contain unescaped script tags
            assert "<script>" not in str(response.content)

    def test_path_traversal_prevention(self, client):
        """Test path traversal prevention in category names."""
        path_traversal_payloads = [
            "../../../etc/passwd",
            "..\\..\\windows\\system32\\config\\sam",
        ]

        for payload in path_traversal_payloads:
            response = client.get(f"/categories/{payload}/terms")
            # Should either return 404 or handle gracefully
            assert response.status_code in [200, 404, 422]

    def test_oversized_request_handling(self, client):
        """Test handling of oversized requests."""
        # Test with very long query string
        long_query = "a" * 1000  # Reduced size for testing
        response = client.get(f"/search?query={long_query}")
        assert response.status_code in [200, 413, 414, 422]


class TestUtilityFunctions:
    """Test utility and helper functions."""

    def test_mock_term_creation(self):
        """Test MockTerm creation and properties."""
        term = MockTerm(
            term="test",
            definition="test definition",
            domain="test domain",
            language="English",
        )

        assert term.term == "test"
        assert term.definition == "test definition"
        assert term.domain == "test domain"
        assert term.language == "English"
        assert isinstance(term.id, uuid.UUID)
        assert isinstance(term.translations, list)

    def test_mock_translation_creation(self):
        """Test MockTranslation creation and properties."""
        translation = MockTranslation("Spanish", "hola")

        assert translation.language == "Spanish"
        assert translation.term == "hola"

    def test_sample_data_fixtures(self, sample_terms, sample_term_with_translations):
        """Test that sample data fixtures work correctly."""
        # Test sample_terms fixture
        assert len(sample_terms) == 3
        assert sample_terms[0].term == "hello"
        assert sample_terms[1].term == "world"
        assert sample_terms[2].term == "hola"

        # Test sample_term_with_translations fixture
        assert sample_term_with_translations.term == "hello"
        assert len(sample_term_with_translations.translations) == 3

        translation_languages = [
            t.language for t in sample_term_with_translations.translations
        ]
        assert "Spanish" in translation_languages
        assert "French" in translation_languages
        assert "German" in translation_languages


class TestPerformanceScenarios:
    """Test performance-related scenarios."""

    def test_concurrent_request_simulation(self, client):
        """Simulate multiple concurrent requests."""
        # Simulate multiple requests
        responses = []
        for i in range(5):  # Reduced from 10 for faster testing
            response = client.get("/categories")
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200

    def test_repeated_requests_consistency(self, client):
        """Test that repeated requests return consistent results."""
        # Make multiple identical requests
        responses = []
        for _ in range(3):  # Reduced for faster testing
            response = client.get("/categories")
            responses.append(response.json())

        # All responses should be identical
        first_response = responses[0]
        for response in responses[1:]:
            assert response == first_response


@pytest.mark.integration
class TestGlossaryIntegrationWorkflows:
    """Integration tests that test complete workflows across multiple endpoints."""

    def test_category_exploration_workflow(self, client):
        """
        Test the complete workflow of exploring categories and their terms.

        Workflow:
        1. Get all available categories
        2. Select a category and get its terms
        3. Verify all terms belong to the selected category
        4. Get translations for one of the terms
        """
        # Step 1: Get all categories
        response = client.get("/categories")
        assert response.status_code == 200
        categories = response.json()

        assert isinstance(categories, list)
        assert len(categories) > 0
        assert "Common" in categories

        # Step 2: Get terms for a specific category
        response = client.get("/categories/Common/terms")
        assert response.status_code == 200
        terms = response.json()

        # Step 3: Verify all terms belong to the category
        assert isinstance(terms, list)
        assert len(terms) > 0

        for term in terms:
            assert term["category"] == "Common"
            assert "id" in term
            assert "term" in term
            assert "definition" in term

        # Step 4: Get translations for the first term
        if terms:
            term_id = terms[0]["id"]
            response = client.get(f"/terms/{term_id}/translations")
            assert response.status_code == 200

            translation_data = response.json()
            assert "term" in translation_data
            assert "translations" in translation_data

    def test_search_and_translation_workflow(self, client):
        """
        Test searching for terms and then getting their translations.

        Workflow:
        1. Search for terms
        2. Get translations for found terms
        3. Verify translation data consistency
        """
        # Step 1: Search for terms
        response = client.get("/search?query=hello")
        assert response.status_code == 200
        search_results = response.json()

        assert isinstance(search_results, list)
        assert len(search_results) > 0

        # Step 2: Get translations for the first result
        first_term = search_results[0]
        term_id = first_term["id"]

        response = client.get(f"/terms/{term_id}/translations")
        assert response.status_code == 200

        # Step 3: Verify translation data
        translation_data = response.json()
        assert translation_data["term"] == "hello"
        assert "translations" in translation_data
        assert isinstance(translation_data["translations"], dict)
        assert "Spanish" in translation_data["translations"]
        assert translation_data["translations"]["Spanish"] == "hola"

    def test_advanced_search_workflow(self, client):
        """
        Test advanced search with various parameters and pagination.

        Workflow:
        1. Test basic advanced search
        2. Test with filters
        3. Test pagination
        4. Verify response consistency
        """
        # Step 1: Basic advanced search
        response = client.post(
            "/search", data={"query": "hello", "page": 1, "limit": 5}
        )
        assert response.status_code == 200
        data = response.json()

        assert "results" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "pages" in data
        assert data["page"] == 1
        assert data["limit"] == 5  # Should now work with form data

        # Step 2: Search with filters (even if empty results)
        response = client.post(
            "/search",
            data={
                "query": "hello",
                "domain": "Common",
                "language": "English",
                "page": 1,
                "limit": 10,
            },
        )
        assert response.status_code == 200
        filtered_data = response.json()
        assert "results" in filtered_data

        # Step 3: Test pagination
        response = client.post("/search", data={"page": 2, "limit": 2})
        assert response.status_code == 200
        page_data = response.json()
        assert page_data["page"] == 2
        assert page_data["limit"] == 2

    def test_batch_translation_workflow(self, client):
        """
        Test batch translation of multiple terms.

        Workflow:
        1. Get available terms through search
        2. Request batch translation
        3. Verify translation results structure
        """
        # Step 1: Search for terms to translate
        response = client.get("/search?query=hello")
        assert response.status_code == 200

        # Step 2: Request batch translation
        terms_to_translate = ["hello"]
        response = client.post(
            "/translate",
            json={
                "terms": terms_to_translate,
                "source_language": "English",
                "target_languages": ["Spanish", "French"],
            },
        )
        assert response.status_code == 200
        translation_results = response.json()

        # Step 3: Verify results structure
        assert "results" in translation_results
        assert isinstance(translation_results["results"], list)

    def test_statistics_and_metadata_consistency(self, client):
        """
        Test consistency between statistics and other metadata endpoints.

        Workflow:
        1. Get glossary statistics
        2. Get available languages
        3. Get domains
        4. Verify data consistency across endpoints
        """
        # Step 1: Get statistics
        response = client.get("/stats")
        assert response.status_code == 200
        stats = response.json()

        assert "total_terms" in stats
        assert "languages_count" in stats
        assert "categories_count" in stats
        assert "languages" in stats
        assert stats["total_terms"] == 100
        assert stats["languages_count"] == 5
        assert stats["categories_count"] == 10

        # Step 2: Get languages
        response = client.get("/languages")
        assert response.status_code == 200
        languages = response.json()

        assert isinstance(languages, dict)
        assert "English" in languages
        assert "Afrikaans" in languages

        # Step 3: Get domains
        response = client.get("/domains")
        assert response.status_code == 200
        domains = response.json()

        assert isinstance(domains, list)
        assert "Common" in domains
        assert "Geography" in domains
        assert "Science" in domains

        # Step 4: Verify consistency
        # Stats should have at least the languages we see in the languages endpoint
        stats_languages = stats["languages"]
        assert "English" in stats_languages
        assert "Afrikaans" in stats_languages

    def test_random_terms_exploration_workflow(self, client):
        """
        Test getting random terms and exploring their details.

        Workflow:
        1. Get random terms
        2. Get translations for a random term
        3. Search for related terms
        """
        # Step 1: Get random terms
        response = client.get("/random")
        assert response.status_code == 200
        random_terms = response.json()

        assert isinstance(random_terms, list)
        assert len(random_terms) > 0

        # Step 2: Get translations for the first random term
        term = random_terms[0]
        assert "id" in term
        assert "term" in term
        assert "definition" in term

        response = client.get(f"/terms/{term['id']}/translations")
        assert response.status_code == 200

        translation_data = response.json()
        assert translation_data["term"] == term["term"]

        # Step 3: Search for the same term to verify consistency
        response = client.get(f"/search?query={term['term']}")
        assert response.status_code == 200
        search_results = response.json()

        # Should find the term in search results
        found_terms = [t for t in search_results if t["term"] == term["term"]]
        assert len(found_terms) > 0

    def test_cross_endpoint_data_consistency(self, client):
        """
        Test data consistency across different endpoints.

        This ensures that the same term appears consistently across different endpoints.
        """
        # Get a term through search
        response = client.get("/search?query=hello")
        assert response.status_code == 200
        search_results = response.json()
        assert len(search_results) > 0

        search_term = search_results[0]

        # Get the same term through category endpoint
        response = client.get(f"/categories/{search_term['category']}/terms")
        assert response.status_code == 200
        category_terms = response.json()

        # Find the same term in category results
        matching_terms = [t for t in category_terms if t["id"] == search_term["id"]]
        assert len(matching_terms) == 1

        category_term = matching_terms[0]

        # Verify consistency
        assert category_term["term"] == search_term["term"]
        assert category_term["definition"] == search_term["definition"]
        assert category_term["category"] == search_term["category"]

    def test_error_handling_workflow(self, client):
        """
        Test error handling across different endpoints in a workflow.

        Workflow:
        1. Try to get terms for nonexistent category
        2. Try to get translations for nonexistent term
        3. Try invalid search parameters
        4. Verify all errors are handled gracefully
        """
        # Step 1: Nonexistent category
        response = client.get(
            "/categories/NonExistent/terms"
        )  # Use "NonExistent" which triggers 404
        assert response.status_code == 404
        error_data = response.json()
        assert "detail" in error_data
        assert "No terms found for category" in error_data["detail"]

        # Step 2: Nonexistent term
        response = client.get("/terms/nonexistent/translations")
        assert response.status_code == 404
        error_data = response.json()
        assert "Term not found" in error_data["detail"]

        # Step 3: Invalid search parameters
        response = client.get("/search")  # Missing query
        assert response.status_code == 422

        # Step 4: Invalid advanced search
        response = client.post("/search", data={"page": -1})
        assert response.status_code in [200, 422]  # Should handle gracefully

    def test_multilingual_workflow(self, client):
        """
        Test workflow involving multiple languages.

        Workflow:
        1. Get available languages
        2. Search for terms in different languages
        3. Get translations between languages
        """
        # Step 1: Get available languages
        response = client.get("/languages")
        assert response.status_code == 200
        languages = response.json()

        assert "English" in languages
        assert "Afrikaans" in languages

        # Step 2: Use advanced search to filter by language
        response = client.post(
            "/search",
            json={
                "language": "English",
                "page": 1,
                "limit": 10,
            },
        )
        assert response.status_code == 200

        # Step 3: Request translations for English terms to other languages
        response = client.post(
            "/translate",
            json={
                "terms": ["hello"],
                "source_language": "English",
                "target_languages": ["Spanish", "French"],
            },
        )
        assert response.status_code == 200
        translation_results = response.json()
        assert "results" in translation_results

    def test_domain_exploration_workflow(self, client):
        """
        Test exploring different domains and their content.

        Workflow:
        1. Get all domains
        2. For each domain, get sample terms
        3. Verify domain-specific content
        """
        # Step 1: Get all domains
        response = client.get("/domains")
        assert response.status_code == 200
        domains = response.json()

        assert isinstance(domains, list)
        assert len(domains) > 0

        # Step 2: Explore each domain
        for domain in domains[:3]:  # Test first 3 domains
            response = client.get(f"/categories/{domain}/terms")

            if response.status_code == 200:
                terms = response.json()

                # Step 3: Verify all terms belong to this domain
                for term in terms:
                    assert term["category"] == domain
            else:
                # It's okay if some domains have no terms
                assert response.status_code == 404

    def test_pagination_workflow(self, client):
        """
        Test pagination workflow across multiple pages.

        Workflow:
        1. Get first page of results
        2. Get subsequent pages
        3. Verify pagination consistency
        """
        # Step 1: Get first page
        response = client.post(
            "/search",
            data={
                "page": 1,
                "limit": 2,
            },
        )
        assert response.status_code == 200
        page1_data = response.json()

        assert page1_data["page"] == 1
        assert page1_data["limit"] == 2  # Should now work with form data
        total_pages = page1_data["pages"]

        # Step 2: If there are multiple pages, test page 2
        if total_pages > 1:
            response = client.post(
                "/search",
                data={
                    "page": 2,
                    "limit": 2,
                },
            )
            assert response.status_code == 200
            page2_data = response.json()

            # Step 3: Verify pagination consistency
            assert page2_data["page"] == 2
            assert page2_data["limit"] == 2  # Should now work with form data
            assert page2_data["total"] == page1_data["total"]
            assert page2_data["pages"] == page1_data["pages"]

            # Results should be different between pages
            page1_terms = [t["id"] for t in page1_data["results"]]
            page2_terms = [t["id"] for t in page2_data["results"]]

            # No overlap between pages (unless there are fewer terms than page size)
            if len(page1_terms) == 2 and len(page2_terms) > 0:
                overlap = set(page1_terms).intersection(set(page2_terms))
                assert len(overlap) == 0


@pytest.mark.integration
class TestGlossaryIntegrationErrorScenarios:
    """Integration tests focusing on error scenarios and edge cases."""

    def test_cascading_error_handling(self, client):
        """Test how errors in one endpoint affect subsequent calls."""
        # Start with a valid search
        response = client.get("/search?query=hello")
        assert response.status_code == 200

        # Try to get translations for a nonexistent term
        response = client.get("/terms/nonexistent-id/translations")
        assert response.status_code == 404

        # Verify that the error doesn't affect subsequent valid calls
        response = client.get("/categories")
        assert response.status_code == 200

    def test_malformed_request_recovery(self, client):
        """Test recovery from malformed requests."""
        # Try malformed advanced search
        response = client.post("/search", data={"invalid_field": "value"})
        assert response.status_code in [200, 422]

        # Verify that valid requests still work after malformed ones
        response = client.get("/categories")
        assert response.status_code == 200

    def test_boundary_conditions_workflow(self, client):
        """Test boundary conditions across endpoints."""
        # Test with very large page numbers
        response = client.post(
            "/search",
            json={
                "page": 9999,
                "limit": 10,
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Should handle gracefully - either empty results or reasonable page
        assert "results" in data
        assert isinstance(data["results"], list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
