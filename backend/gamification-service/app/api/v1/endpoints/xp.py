from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import date

from mavito_common.db.session import get_db
from mavito_common.schemas.user import User as UserSchema
from mavito_common.schemas.user_xp import (
    UserXPCreate,
    UserXPResponse,
    AddXPRequest,
)
from app.api.deps import get_current_active_user
from app.crud.crud_user_xp import crud_user_xp


class LoginStreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_login_date: Optional[date]


router = APIRouter()


@router.post("/add-xp", response_model=UserXPResponse)
async def add_xp_to_user(
    *,
    db: AsyncSession = Depends(get_db),
    xp_request: AddXPRequest,
    current_user: UserSchema = Depends(get_current_active_user),
) -> UserXPResponse:
    """
    Add XP to a user and automatically check for weekly goal completions.
    """
    xp_create = UserXPCreate(
        user_id=xp_request.user_id,
        xp_amount=xp_request.xp_amount,
        xp_source=xp_request.xp_source,
        source_reference_id=xp_request.source_reference_id,
        description=xp_request.description,
    )

    xp_record = await crud_user_xp.create_xp_record(db=db, obj_in=xp_create)

    # Automatically check and complete weekly goals after awarding XP
    try:
        from app.services.weekly_goal_generator import ensure_weekly_goals_exist
        from app.crud.crud_achievement import crud_achievement

        await ensure_weekly_goals_exist(db)

        newly_earned = await crud_achievement.check_and_grant_weekly_achievements(
            db=db, user_id=xp_request.user_id
        )

        if newly_earned:
            import logging

            logger = logging.getLogger(__name__)
            goal_names = [ua.achievement.name for ua in newly_earned if ua.achievement]
            logger.info(
                f"User {xp_request.user_id} completed weekly goals: {goal_names}"
            )

    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.warning(
            f"Failed to check weekly achievements for user {xp_request.user_id}: {e}"
        )

    return UserXPResponse.model_validate(xp_record)


@router.get("/user/{user_id}/xp-records", response_model=List[UserXPResponse])
async def get_user_xp_records(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> List[UserXPResponse]:
    """
    Get XP records for a specific user.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    xp_records = await crud_user_xp.get_user_xp_records(db=db, user_id=user_uuid)
    return [UserXPResponse.model_validate(record) for record in xp_records]


@router.get("/user/{user_id}/login-streak", response_model=LoginStreakResponse)
async def get_user_login_streak(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> LoginStreakResponse:
    """
    Get user's login streak calculated from LOGIN_STREAK XP records.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    streak_data = await crud_user_xp.get_user_login_streak(db=db, user_id=user_uuid)
    return LoginStreakResponse(**streak_data)
