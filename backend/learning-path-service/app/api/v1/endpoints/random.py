from fastapi import APIRouter, Depends
from typing import List
from uuid import UUID  # noqa: F401

from app import deps
from app.crud.crud_learning import crud_learning
from mavito_common.schemas.learning_path import Word

router = APIRouter()


@router.get(
    "/languages/{language_name}/random-terms",
    response_model=List[Word],
    summary="Get random terms for a language",
)
async def get_random_terms(
    language_name: str,
    db: deps.AsyncSession = Depends(deps.get_db),
):
    """
    Retrieves a list of random terms for a given language.
    """
    terms = await crud_learning.get_random_terms_for_language(
        db=db, language_name=language_name
    )
    return terms
