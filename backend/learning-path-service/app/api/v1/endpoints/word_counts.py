from fastapi import APIRouter, Depends
from typing import List, Dict
from pydantic import BaseModel

from app import deps
from app.crud.crud_learning import crud_learning

router = APIRouter()


class WordCountRequest(BaseModel):
    language_name: str
    glossary_names: List[str]


@router.post(
    "/glossaries/word-counts",
    response_model=Dict[str, int],
    summary="Get word counts for multiple glossaries",
)
async def get_glossary_word_counts(
    request_data: WordCountRequest,
    db: deps.AsyncSession = Depends(deps.get_db),
):
    """
    Accepts a list of glossary names and returns a dictionary
    mapping each name to its total word count for the specified language.
    """
    counts = await crud_learning.get_word_counts_for_glossaries(
        db=db,
        language_name=request_data.language_name,
        glossary_names=request_data.glossary_names,
    )
    return counts
