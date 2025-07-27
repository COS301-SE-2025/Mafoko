"""
Module: search.py

This module defines the search endpoint for the API v1 router.
It provides an HTTP GET route to search multilingual terms
with optional filters for language and domain
and supports sorting by name or popularity, with optional pagination.

Dependencies:
- FastAPI
- app.schemas.term.Term (Pydantic response model)
- app.crud.crud_search.search_terms (search logic function)
"""

# search-service/app/api/v1/endpoints/search.py
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
from app.crud.crud_search import search_terms_in_db
from mavito_common.db.session import get_db

router = APIRouter(redirect_slashes=False)


@router.get("", response_model=Dict[str, Any])
async def search_endpoint(
    db: AsyncSession = Depends(get_db),
    query: str = Query("", description="Search term"),
    language: Optional[str] = Query(None, description="Language filter"),
    domain: Optional[str] = Query(None, description="Domain filter"),
    sort_by: str = Query("name", description="Sort by 'name' or 'popularity'"),
    page: int = Query(1, description="Page number"),
    page_size: int = Query(20, description="Page size"),
    fuzzy: bool = Query(False, description="Enable fuzzy search"),
):
    # This now returns a list of tuples: (Term, upvotes, downvotes)
    results = await search_terms_in_db(
        db, query, language, domain, sort_by, fuzzy=fuzzy
    )

    total = len(results)
    start = (page - 1) * page_size
    end = start + page_size
    paginated_results = results[start:end]

    # --- NEW: Unpack the tuple and build the response ---
    response_items = []
    for term, upvotes, downvotes in paginated_results:
        response_items.append(
            {
                "id": str(term.id),
                "term": term.term,
                "language": term.language,
                "domain": term.domain,
                "definition": term.definition,
                "upvotes": upvotes or 0,  # Use the real count, defaulting to 0 if NULL
                "downvotes": downvotes
                or 0,  # Use the real count, defaulting to 0 if NULL
            }
        )

    return {"items": response_items, "total": total}
