# app/api/v1/endpoints/settings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from mavito_common.schemas.user_preferences import (
    UserPreferencesResponse,
    UserPreferencesUpdate,
)
from mavito_common.schemas.user import User as UserSchema
from mavito_common.db.session import get_db
from app.api import deps
from app.crud.crud_user_preferences import crud_user_preferences


router = APIRouter()


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: UserSchema = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current user's preferences.
    Creates default preferences if none exist.
    """
    try:
        preferences = await crud_user_preferences.get_or_create_user_preferences(
            db, user_id=current_user.id
        )
        return UserPreferencesResponse.model_validate(preferences)
    except Exception as e:
        print(f"Error getting user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve user preferences",
        )


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    current_user: UserSchema = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the current user's preferences.
    Creates default preferences if none exist and then updates them.
    """
    try:
        # Get or create preferences
        existing_preferences = await crud_user_preferences.get_or_create_user_preferences(
            db, user_id=current_user.id
        )
        
        # Update preferences
        updated_preferences = await crud_user_preferences.update_user_preferences(
            db, db_obj=existing_preferences, obj_in=preferences_update
        )
        
        return UserPreferencesResponse.model_validate(updated_preferences)
    except Exception as e:
        print(f"Error updating user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update user preferences",
        )


@router.post("/preferences/reset", response_model=UserPreferencesResponse)
async def reset_user_preferences(
    current_user: UserSchema = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset the current user's preferences to default values.
    """
    try:
        # Delete existing preferences if they exist
        await crud_user_preferences.delete_user_preferences(db, user_id=current_user.id)
        
        # Create new default preferences
        preferences = await crud_user_preferences.get_or_create_user_preferences(
            db, user_id=current_user.id
        )
        
        return UserPreferencesResponse.model_validate(preferences)
    except Exception as e:
        print(f"Error resetting user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not reset user preferences",
        )