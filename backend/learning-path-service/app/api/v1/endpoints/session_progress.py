from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from typing import List
from uuid import UUID

from app import deps
from mavito_common.schemas.user import User as UserSchema
from app.crud.crud_learning import crud_learning

router = APIRouter()


class SessionProgressUpdate(BaseModel):
    language_name: str
    glossary_name: str
    last_card_index: int
    retry_pile_ids: List[UUID]


@router.post(
    "/session-progress",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Save flashcard session progress",
)
async def save_session_progress(
    progress_data: SessionProgressUpdate,
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """Saves the user's last card index and retry pile for a specific glossary."""
    await crud_learning.update_session_progress(
        db=db,
        user_id=current_user.id,
        language_name=progress_data.language_name,
        glossary_name=progress_data.glossary_name,
        last_card_index=progress_data.last_card_index,
        retry_pile_ids=progress_data.retry_pile_ids,
    )
