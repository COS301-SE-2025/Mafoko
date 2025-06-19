"""
Module: search.py

This module defines the search endpoint for the API v1 router.
It provides an HTTP GET route to search multilingual terms
with optional filters for language, domain, and part of speech,
and supports sorting by name or popularity, with optional pagination.

Dependencies:
- FastAPI
- app.schemas.term.Term (Pydantic response model)
- app.crud.crud_search.search_terms (search logic function)
"""

from fastapi import APIRouter, Query
from typing import Optional, Dict, Any

# from app.schemas.term import Term
from app.crud.crud_search import search_terms

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def search_endpoint(
    query: str = Query(..., description="Search term (required)"),
    language: Optional[str] = Query(None, description="Language filter"),
    domain: Optional[str] = Query(None, description="Domain filter"),
    part_of_speech: Optional[str] = Query(None, description="Part of speech filter"),
    sort_by: str = Query("name", description="Sort by 'name' or 'popularity'"),
    page: int = Query(1, description="Page number (default 1)"),
    page_size: int = Query(20, description="Page size (default 20)"),
):
    """
    Search endpoint to retrieve multilingual terms with optional pagination.

    Args:
        query (str): The search term (required).
        language (Optional[str]): Filter results by language.
        domain (Optional[str]): Filter results by domain.
        part_of_speech (Optional[str]): Filter results by part of speech.
        sort_by (str): Sorting criterion ('name' or 'popularity'). Defaults to 'name'.
        page (int): Page number. Defaults to 1.
        page_size (int): Number of items per page. Defaults to 20.

    Returns:
        Dict[str, Any]: A dictionary containing 'items' (list of terms) and 'total' (total result count).
    """
    results = await search_terms(query, language, domain, part_of_speech, sort_by)
    total = len(results)
    start = (page - 1) * page_size
    end = start + page_size
    paginated_results = results[start:end]
    return {"items": paginated_results, "total": total}
