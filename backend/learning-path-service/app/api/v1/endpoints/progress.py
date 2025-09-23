from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from uuid import UUID

from app import deps  # Assuming a dependency injection setup
from mavito_common.schemas.user import User as UserSchema
from app.crud.crud_learning import crud_learning

router = APIRouter()


class ProgressUpdate(BaseModel):
    term_id: UUID
    is_correct: bool


@router.post("/progress", status_code=status.HTTP_204_NO_CONTENT)
async def update_user_progress(
    progress_update: ProgressUpdate,
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Handles the API request to save a user's learning progress.
    """
    if not progress_update.is_correct:
        return

    await crud_learning.update_progress(
        db=db, user_id=current_user.id, term_id=progress_update.term_id
    )
