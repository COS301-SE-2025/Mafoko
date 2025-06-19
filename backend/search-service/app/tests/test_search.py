"""
Unit test module for the /api/v1/search endpoint.

Validates:
- Basic search functionality with filters
- Pagination response structure
- Edge cases: empty result sets, invalid pages, and large page sizes
- Response structure and content integrity
"""

import pytest
from app.crud.crud_search import detect_part_of_speech
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_search_with_filters_and_pagination():
    """
    Test /api/v1/search with full filters and pagination.
    """
    response = client.get(
        "/api/v1/search",
        params={
            "query": "grain",
            "language": "English",
            "domain": "Agriculture",
            "part_of_speech": "noun",
            "sort_by": "popularity",
            "page": 1,
            "page_size": 10,
        },
    )
    assert response.status_code == 200
    json = response.json()
    assert isinstance(json, dict)
    assert "items" in json and "total" in json
    items = json["items"]
    total = json["total"]
    assert isinstance(items, list)
    assert isinstance(total, int)
    if items:
        assert "term" in items[0]


def test_search_empty_result():
    """
    Test /api/v1/search with a query that returns no results.
    """
    response = client.get(
        "/api/v1/search",
        params={
            "query": "nonexistentqueryterm",
            "page": 1,
            "page_size": 10,
        },
    )
    assert response.status_code == 200
    json = response.json()
    assert isinstance(json["items"], list)
    assert json["total"] == 0


def test_search_invalid_page():
    """
    Test /api/v1/search with an invalid (too high) page number.
    """
    response = client.get(
        "/api/v1/search",
        params={
            "query": "grain",
            "page": 999,
            "page_size": 10,
        },
    )
    assert response.status_code == 200
    json = response.json()
    assert isinstance(json["items"], list)
    assert len(json["items"]) == 0 or (json["total"] < (999 - 1) * 10)


def test_search_large_page_size():
    """
    Test /api/v1/search with an excessively large page size.
    """
    response = client.get(
        "/api/v1/search",
        params={
            "query": "grain",
            "page": 1,
            "page_size": 1000,
        },
    )
    assert response.status_code == 200
    json = response.json()
    assert isinstance(json["items"], list)
    assert isinstance(json["total"], int)
    assert len(json["items"]) <= 1000


@pytest.mark.parametrize(
    "word,expected",
    [
        ("run", "verb"),
        ("beautiful", "adjective"),
        ("quickly", "adverb"),
        ("cat", "noun"),
        ("randomwordthatdoesnotexist", "noun"),
    ],
)
def test_detect_part_of_speech(word, expected):
    result = detect_part_of_speech(word)
    assert (
        result == expected
    ), f"For word '{word}', expected '{expected}' but got '{result}'"


def test_detect_part_of_speech_empty_string():
    result = detect_part_of_speech("")
    assert result == "unknown", "Empty string should return 'unknown'"


def test_detect_part_of_speech_non_english():
    result = detect_part_of_speech("走る")  # Japanese for 'run'
    assert result == "unknown", "Non-English input should return 'unknown'"
