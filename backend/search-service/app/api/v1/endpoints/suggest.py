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

# search-service/app/api/v1/endpoints/suggest.py
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List
from app.crud.crud_search import suggest_terms_in_db
from mavito_common.db.session import get_db

router = APIRouter(redirect_slashes=False)


class Suggestion(BaseModel):
    id: str
    label: str


@router.get("", response_model=List[Suggestion])
async def suggest_endpoint(
    db: AsyncSession = Depends(get_db),
    query: str = Query(..., description="Partial search term"),
):
    terms = await suggest_terms_in_db(db, query)
    return [{"id": str(t.id), "label": t.term} for t in terms]
