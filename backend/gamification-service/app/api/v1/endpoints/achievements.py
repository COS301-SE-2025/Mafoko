from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from mavito_common.db.session import get_db
from mavito_common.schemas.user import User as UserSchema
from mavito_common.schemas.user_achievement import UserAchievementResponse
from app.api.deps import get_current_active_user
from app.crud.crud_achievement import crud_achievement

router = APIRouter()


@router.get("/user/{user_id}", response_model=List[UserAchievementResponse])
async def get_user_achievements(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> List[UserAchievementResponse]:
    """
    Get all achievements earned by a specific user.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    user_achievements = await crud_achievement.get_user_achievements(
        db=db, user_id=user_uuid
    )
    return [UserAchievementResponse.model_validate(ua) for ua in user_achievements]


@router.post("/user/{user_id}/check", response_model=List[UserAchievementResponse])
async def check_user_achievements(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> List[UserAchievementResponse]:
    """
    Check user progress and grant any newly earned achievements.
    Returns list of newly earned achievements.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    newly_earned = await crud_achievement.check_and_grant_achievements(
        db=db, user_id=user_uuid
    )
    return [UserAchievementResponse.model_validate(ua) for ua in newly_earned]


@router.get("/user/{user_id}/progress", response_model=List[dict])
async def get_user_achievement_progress(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> List[dict]:
    """
    Get all achievements with current progress for a specific user.
    Returns achievement status, current progress, and percentage completion.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    progress = await crud_achievement.get_user_achievement_progress(
        db=db, user_id=user_uuid
    )
    return progress
