from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from mavito_common.db.session import get_db
from mavito_common.schemas.user import User as UserSchema
from mavito_common.schemas.user_level import UserLevelResponse
from app.api.deps import get_current_active_user
from app.crud.crud_user_level import crud_user_level

router = APIRouter()


@router.get("/user/{user_id}/level", response_model=UserLevelResponse)
async def get_user_level(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> UserLevelResponse:
    """
    Get user's current level with progress information.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    level_data = await crud_user_level.get_user_level_with_progress(
        db=db, user_id=user_uuid
    )
    return UserLevelResponse.model_validate(level_data)


@router.post("/user/{user_id}/recalculate-level", response_model=UserLevelResponse)
async def recalculate_user_level(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
) -> UserLevelResponse:
    """
    Manually recalculate and update user's level based on their total XP.
    """
    try:
        import uuid

        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    level_data = await crud_user_level.get_user_level_with_progress(
        db=db, user_id=user_uuid
    )
    return UserLevelResponse.model_validate(level_data)
