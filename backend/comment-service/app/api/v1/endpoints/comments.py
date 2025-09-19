from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import List, Optional
from pydantic import BaseModel
from mavito_common.db.session import get_db
from mavito_common.models.user import (
    User as UserModel,
)
from app.api import deps


from app.crud.crud_comment import crud_comment
from mavito_common.schemas.comment import CommentCreate, CommentResponse, CommentUpdate

router = APIRouter(redirect_slashes=False)


class CommentCreateResponse(BaseModel):
    newComment: CommentResponse
    tempId: Optional[str] = None


@router.post(
    "", response_model=CommentCreateResponse, status_code=status.HTTP_201_CREATED
)
async def create_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_in: CommentCreate,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Create a new comment on a term.
    """
    comment_orm = await crud_comment.create_comment(
        db, obj_in=comment_in, user_id=current_user.id
    )

    comment_response = await crud_comment._build_comment_response(
        db, comment_orm, current_user.id
    )

    # 3. Return the new response structure, including the tempId
    return CommentCreateResponse(newComment=comment_response, tempId=comment_in.tempId)


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_id: uuid.UUID,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Retrieve a single comment by ID.
    - Includes vote counts and the current user's vote status.
    - Returns 404 if the comment is not found or is soft-deleted.
    """
    comment = await crud_comment.get_comment(db, comment_id=comment_id)
    if not comment or comment.tombstone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    return await crud_comment._build_comment_response(db, comment, current_user.id)


@router.get("/by_term/{term_id}", response_model=List[CommentResponse])
async def get_comments_by_term(
    *,
    db: AsyncSession = Depends(get_db),
    term_id: uuid.UUID,
    current_user: Optional[UserModel] = Depends(deps.get_current_active_user)
):
    """
    Retrieve all top-level comments for a specific term, including their replies and vote counts.
    - Comments are ordered by creation date (most recent first).
    - If a user is authenticated, their vote status on each comment is included.
    """

    user_id_for_votes = current_user.id if current_user else None
    return await crud_comment.get_comments_for_term(
        db, term_id=term_id, current_user_id=user_id_for_votes
    )


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_id: uuid.UUID,
    comment_in: CommentUpdate,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Update an existing comment.
    - Only the comment owner can update their comment.
    - Returns 404 if comment not found, 403 if not authorized.
    """
    comment = await crud_comment.get_comment(db, comment_id=comment_id)
    if not comment or comment.tombstone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment",
        )
    updated_comment = await crud_comment.update_comment(
        db, db_obj=comment, obj_in=comment_in
    )
    return await crud_comment._build_comment_response(
        db, updated_comment, current_user.id
    )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_id: uuid.UUID,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Soft delete a comment.
    - Only the comment owner or an administrator can delete a comment.
    - Returns 404 if comment not found, 403 if not authorized.
    """
    comment = await crud_comment.get_comment(db, comment_id=comment_id)
    if not comment or comment.tombstone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )

    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment",
        )

    await crud_comment.delete_comment(db, comment=comment)
    return
