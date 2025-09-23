from typing import List, Optional
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


@router.get("/user/{user_id}/weekly", response_model=List[dict])
async def get_user_weekly_goals(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> List[dict]:
    """
    Get current week's goals for a user with lazy generation.

    This endpoint will automatically generate weekly goals if they don't exist
    for the current week when first accessed. Always returns current week's goals.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    from app.services.weekly_goal_generator import ensure_weekly_goals_exist

    # Always use current week, don't allow accessing previous weeks
    await ensure_weekly_goals_exist(db, week_id=None)

    weekly_goals = await crud_achievement.get_user_weekly_goals(
        db=db, user_id=user_uuid, week_id=None
    )

    return weekly_goals


@router.post(
    "/user/{user_id}/weekly/check", response_model=List[UserAchievementResponse]
)
async def check_user_weekly_achievements(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    week_id: Optional[str] = None,
    current_user: UserSchema = Depends(get_current_active_user),
) -> List[UserAchievementResponse]:
    """
    Check user progress and grant any newly completed weekly goals.
    Returns list of newly completed weekly achievements.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    from app.services.weekly_goal_generator import ensure_weekly_goals_exist

    await ensure_weekly_goals_exist(db, week_id)

    newly_earned = await crud_achievement.check_and_grant_weekly_achievements(
        db=db, user_id=user_uuid, week_id=week_id
    )

    return [UserAchievementResponse.model_validate(ua) for ua in newly_earned]


@router.post("/admin/generate-weekly-goals")
async def generate_weekly_goals_admin(
    *,
    db: AsyncSession = Depends(get_db),
    week_id: Optional[str] = None,
    current_user: UserSchema = Depends(get_current_active_user),
):
    """
    Manually generate weekly goals for a specific week.
    """

    from app.services.weekly_goal_generator import (
        generate_random_weekly_goals,
        get_current_week_id,
    )

    if not week_id:
        week_id = get_current_week_id()

    try:
        goals = await generate_random_weekly_goals(db=db, num_goals=3, week_id=week_id)

        return {
            "success": True,
            "message": f"Generated {len(goals)} weekly goals for {week_id}",
            "week_id": week_id,
            "goals": (
                [
                    {
                        "name": goal["achievement"].name,
                        "description": goal["achievement"].description,
                        "target_value": goal["achievement"].target_value,
                        "xp_reward": goal["xp_reward"],
                    }
                    for goal in goals
                ]
                if goals
                else []
            ),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate weekly goals: {str(e)}",
        )
