from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from mavito_common.db.session import get_db
from mavito_common.schemas.feedback import (
    FeedbackCreate,
    FeedbackUpdate,
    Feedback,
    FeedbackAdmin,
    FeedbackStats,
)
from mavito_common.schemas.user import User as UserSchema
from mavito_common.models.feedback import FeedbackType, FeedbackStatus
from mavito_common.models.user import User as UserModel
from app.crud.crud_feedback import crud_feedback
from app.api import deps

router = APIRouter()


@router.post("/", response_model=Feedback, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    *,
    db: AsyncSession = Depends(get_db),
    feedback_in: FeedbackCreate,
    current_user: Optional[UserModel] = Depends(deps.get_current_user_optional)
):
    """
    Submit feedback. Can be submitted by authenticated users or anonymously.
    If user is authenticated, feedback will be linked to their account.
    """
    user_id = current_user.id if current_user else None

    # Create feedback entry
    feedback = await crud_feedback.create(db, obj_in=feedback_in, user_id=user_id)

    return feedback


@router.get("/my-feedback", response_model=List[Feedback])
async def get_my_feedback(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[FeedbackStatus] = Query(None),
    feedback_type: Optional[FeedbackType] = Query(None)
):
    """
    Get current user's feedback submissions with optional filters.
    """
    feedback_list = await crud_feedback.get_multi(
        db,
        skip=skip,
        limit=limit,
        status=status,
        feedback_type=feedback_type,
        user_id=current_user.id,
    )

    return feedback_list


@router.get("/{feedback_id}", response_model=Feedback)
async def get_feedback(
    *,
    db: AsyncSession = Depends(get_db),
    feedback_id: uuid.UUID,
    current_user: UserSchema = Depends(deps.get_current_active_user)
):
    """
    Get specific feedback by ID. Users can only access their own feedback,
    admins can access any feedback.
    """
    feedback = await crud_feedback.get(db, id=feedback_id)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found"
        )

    # Check permissions - user can only see their own feedback unless they're admin
    if feedback.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this feedback",
        )

    return feedback


@router.get("/", response_model=List[FeedbackAdmin])
async def get_all_feedback(
    *,
    db: AsyncSession = Depends(get_db),
    admin_user: UserSchema = Depends(deps.get_current_active_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[FeedbackStatus] = Query(None),
    feedback_type: Optional[FeedbackType] = Query(None)
):
    """
    Get all feedback entries (admin only) with optional filters.
    """
    feedback_list = await crud_feedback.get_multi(
        db, skip=skip, limit=limit, status=status, feedback_type=feedback_type
    )

    # Convert to admin schema with additional user details
    admin_feedback = []
    for feedback in feedback_list:
        feedback_data = FeedbackAdmin.model_validate(feedback)
        if feedback.user:
            feedback_data.user_email = feedback.user.email
        if feedback.resolved_by:
            feedback_data.resolved_by_email = feedback.resolved_by.email
        admin_feedback.append(feedback_data)

    return admin_feedback


@router.put("/{feedback_id}", response_model=Feedback)
async def update_feedback(
    *,
    db: AsyncSession = Depends(get_db),
    feedback_id: uuid.UUID,
    feedback_update: FeedbackUpdate,
    admin_user: UserSchema = Depends(deps.get_current_active_admin)
):
    """
    Update feedback (admin only). Can update status and add admin response.
    """
    feedback = await crud_feedback.get(db, id=feedback_id)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found"
        )

    updated_feedback = await crud_feedback.update(
        db, db_obj=feedback, obj_in=feedback_update, admin_user_id=admin_user.id
    )

    return updated_feedback


@router.delete("/{feedback_id}")
async def delete_feedback(
    *,
    db: AsyncSession = Depends(get_db),
    feedback_id: uuid.UUID,
    admin_user: UserSchema = Depends(deps.get_current_active_admin)
):
    """
    Delete feedback (admin only).
    """
    feedback = await crud_feedback.delete(db, id=feedback_id)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found"
        )

    return {"message": "Feedback deleted successfully"}


@router.get("/admin/stats", response_model=FeedbackStats)
async def get_feedback_stats(
    *,
    db: AsyncSession = Depends(get_db),
    admin_user: UserSchema = Depends(deps.get_current_active_admin)
):
    """
    Get comprehensive feedback statistics for admin dashboard.
    """
    stats = await crud_feedback.get_stats(db)
    return FeedbackStats(**stats)


@router.get("/search/", response_model=List[Feedback])
async def search_feedback(
    *,
    db: AsyncSession = Depends(get_db),
    q: str = Query(..., min_length=1, max_length=100),
    admin_user: UserSchema = Depends(deps.get_current_active_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Search feedback by content (admin only).
    """
    if len(q.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 3 characters long",
        )

    feedback_list = await crud_feedback.search(
        db, query=q.strip(), skip=skip, limit=limit
    )

    return feedback_list
