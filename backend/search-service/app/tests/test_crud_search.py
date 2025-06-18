import pytest
from unittest.mock import patch
from app.crud import crud_search
from mavito_common.schemas.term import Term
from uuid import uuid4


@pytest.mark.asyncio
async def test_load_terms_basic():
    terms = await crud_search.load_terms()

    # Ensure terms loaded
    assert len(terms) > 0, "No terms loaded from dataset"

    # Check that we have multiple languages
    languages = {term.language for term in terms}
    assert "English" in languages
    assert "Afrikaans" in languages
    assert "isiZulu" in languages

    # Check that translation links exist
    first_term = terms[0]
    assert isinstance(first_term.translations, list)
    assert all(isinstance(tid, type(first_term.id)) for tid in first_term.translations)

    # Check that each translation UUID is in the terms list
    term_ids = {term.id for term in terms}
    for tid in first_term.translations:
        assert tid in term_ids, f"Translation UUID {tid} not found among loaded terms"


@pytest.mark.asyncio
async def test_search_terms_query_match():
    query = "agricultural"
    results = await crud_search.search_terms(query)
    assert len(results) > 0, "No results found for query"

    # Check that all results contain the query
    for term in results:
        assert query.lower() in term.term.lower()


@pytest.mark.asyncio
async def test_search_terms_language_filter():
    query = "agricultural"
    language = "English"
    results = await crud_search.search_terms(query, language=language)
    assert len(results) > 0, f"No results found for language {language}"

    # Check that all results match the language
    for term in results:
        assert term.language == language


@pytest.mark.asyncio
async def test_search_terms_domain_filter():
    query = ""
    domain = "Agriculture"
    results = await crud_search.search_terms(query, domain=domain)
    assert len(results) > 0, f"No results found for domain {domain}"

    # Check that all results match the domain
    for term in results:
        assert term.domain == domain


@pytest.mark.asyncio
async def test_search_terms_sort_by_name():
    query = ""
    results = await crud_search.search_terms(query, sort_by="name")
    sorted_terms = sorted(results, key=lambda t: t.term.lower())
    assert results == sorted_terms, "Results not sorted by name"


@pytest.mark.asyncio
async def test_search_terms_sort_by_popularity():
    query = ""
    results = await crud_search.search_terms(query, sort_by="popularity")
    sorted_terms = sorted(results, key=lambda t: t.upvotes - t.downvotes, reverse=True)
    assert results == sorted_terms, "Results not sorted by popularity"


@pytest.mark.asyncio
async def test_search_terms_no_results():
    results = await crud_search.search_terms("nonexistentwordxyz")
    assert results == [], "Expected no results"


@pytest.mark.asyncio
async def test_search_terms_invalid_language():
    results = await crud_search.search_terms("", language="FakeLanguage")
    assert results == [], "Expected no results for invalid language"


@pytest.mark.asyncio
async def test_search_terms_invalid_sort():
    results = await crud_search.search_terms("", sort_by="invalid_sort")
    # Should return unsorted, but still valid results
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_load_terms_mocked():
    mock_terms = [
        Term(
            id=uuid4(),
            term="Mock Term",
            definition="Mock Definition",
            language="English",
            domain="Mock Domain",
            part_of_speech="noun",
            translations=[],
            example="",
            related_terms=[],
            upvotes=10,
            downvotes=2,
            comments=[],
        )
    ]

    with patch("app.crud.crud_search.load_terms", return_value=mock_terms):
        results = await crud_search.load_terms()
        assert len(results) == 1
        assert results[0].term == "Mock Term"
