from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app import deps  # Assuming a dependency injection setup
from mavito_common.schemas.user import User as UserSchema

# Import the new CRUD function
from app.crud.crud_learning import crud_learning

router = APIRouter()


class GlossaryProgress(BaseModel):
    id: str
    name: str
    words: int
    completedPercentage: int


@router.get(
    "/languages/{language_name}/glossaries", response_model=List[GlossaryProgress]
)
async def get_glossary_progress_for_language(
    language_name: str,
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Handles the API request for glossary progress, calling the CRUD layer for data.
    """
    glossary_data = await crud_learning.get_progress_for_glossaries(
        db=db, user_id=current_user.id, language_name=language_name
    )
    return glossary_data
