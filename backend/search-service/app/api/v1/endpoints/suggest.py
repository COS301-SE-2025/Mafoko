"""
Module: suggest.py

This module defines the suggestion endpoint for the API v1 router.
It provides an HTTP GET route to retrieve lightweight autocomplete suggestions
for multilingual terms, returning up to 10 matches where the term starts
with the provided query string.

Dependencies:
- FastAPI
- app.schemas.term.Term (Pydantic base model)
- app.crud.crud_search.search_terms (search logic function)
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List
from app.crud.crud_search import search_terms

router = APIRouter()


class Suggestion(BaseModel):
    """
    Represents a lightweight suggestion result for autocomplete.

    Attributes:
        id (str): The unique identifier of the term.
        label (str): The display label or term name.
    """

    id: str
    label: str


@router.get("/", response_model=List[Suggestion])
async def suggest_endpoint(query: str = Query(..., description="Partial search term")):
    """
    Suggestion endpoint to retrieve autocomplete suggestions.

    Args:
        query (str): The partial search term provided by the frontend.

    Returns:
        List[Suggestion]: A list of up to 10 suggestion objects where
                          the term starts with the provided query.
    """
    terms = await search_terms(query)
    suggestions = [
        {"id": str(t.id), "label": t.term}
        for t in terms
        if t.term.lower().startswith(query.lower())
    ][:10]
    return suggestions
