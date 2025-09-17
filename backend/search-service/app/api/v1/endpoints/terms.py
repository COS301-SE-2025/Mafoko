from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from app.crud.crud_search import get_all_terms_for_offline
from mavito_common.db.session import get_db

router = APIRouter(redirect_slashes=False)


@router.get("/all-for-offline", response_model=Dict[str, Any])
async def get_all_terms_for_pwa(db: AsyncSession = Depends(get_db)):
    """
    Provides a single, unpaginated list of all terms for PWA caching.
    """
    results = await get_all_terms_for_offline(db)

    response_items = []
    for term, upvotes, downvotes in results:
        response_items.append(
            {
                "id": str(term.id),
                "term": term.term,
                "language": term.language,
                "domain": term.domain,
                "definition": term.definition,
                "upvotes": upvotes or 0,
                "downvotes": downvotes or 0,
            }
        )

    return {"items": response_items, "total": len(response_items)}
