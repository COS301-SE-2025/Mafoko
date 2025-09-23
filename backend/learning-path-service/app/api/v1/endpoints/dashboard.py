from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app import deps  # Assuming a dependency injection setup
from mavito_common.schemas.user import User as UserSchema
from app.crud.crud_learning import crud_learning

router = APIRouter()


class LanguageProgress(BaseModel):
    code: str
    name: str
    totalWords: int
    completedPercentage: int


@router.get("/dashboard", response_model=List[LanguageProgress])
async def get_learning_dashboard(
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Handles the API request for the learning dashboard.
    """
    dashboard_data = await crud_learning.get_dashboard_progress(
        db=db, user_id=current_user.id
    )
    return dashboard_data
