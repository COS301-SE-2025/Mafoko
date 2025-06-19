"""
Unit test module for the suggest endpoint.
This test ensures the /api/v1/suggest route responds correctly and returns a list of suggestions.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_suggest_endpoint():
    """
    Test the /api/v1/suggest endpoint with a partial query.

    Steps:
    - Sends a GET request to /api/v1/suggest with a 'query' parameter.
    - Asserts that the response status code is 200 (OK).
    - Asserts that the response body is a list.
    - If the list is non-empty, checks that each item contains 'id' and 'label' fields.

    This test helps ensure:
    - The suggest endpoint works without requiring authentication (if unprotected).
    - Partial queries are accepted and processed.
    - The returned data structure matches the expected format.
    """
    response = client.get(
        "/api/v1/suggest",
        params={"query": "ser"},
    )
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    data = response.json()
    assert isinstance(data, list), "Expected response to be a list"
    if data:
        first_item = data[0]
        assert "id" in first_item, "Expected each item to contain an 'id' key"
        assert "label" in first_item, "Expected each item to contain a 'label' key"
