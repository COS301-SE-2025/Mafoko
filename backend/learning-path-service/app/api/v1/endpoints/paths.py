from aiosqlite import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app import deps  # Assuming a dependency injection setup
from mavito_common.schemas.user import User as UserSchema
from app.crud.crud_learning import crud_learning
from mavito_common.schemas.learning_path import LearningPathCreate, LearningPathRead

router = APIRouter()


@router.get(
    "/paths",
    response_model=List[LearningPathRead],
    summary="Get all learning paths for the current user",
)
async def get_user_learning_paths(
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Retrieves all saved learning paths for the currently authenticated user.
    """
    paths = await crud_learning.get_learning_paths_for_user(
        db=db, user_id=current_user.id
    )
    return paths


@router.post(
    "/paths",
    response_model=LearningPathRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new learning path",
)
async def create_new_learning_path(
    path_in: LearningPathCreate,
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Creates a new persistent learning path for the current user.
    """
    try:
        new_path = await crud_learning.create_learning_path(
            db=db, user_id=current_user.id, obj_in=path_in
        )
        return new_path
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A learning path with this name already exists for your account.",
        )


@router.delete(
    "/paths/{path_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a learning path",
)
async def delete_a_learning_path(
    path_id: UUID,
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Deletes a specific learning path for the current user.
    """
    deleted_path = await crud_learning.delete_learning_path(db=db, path_id=path_id)

    if not deleted_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )
