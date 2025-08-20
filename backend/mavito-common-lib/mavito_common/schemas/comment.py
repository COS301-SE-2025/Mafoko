import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from mavito_common.schemas.user import UserBase


class CommentBase(BaseModel):
    """
    Base schema for comment content and parent relationship.
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="The textual content of the comment.",
    )
    parent_id: Optional[uuid.UUID] = Field(
        None, description="The ID of the parent comment if this is a reply."
    )


class CommentCreate(CommentBase):
    """
    Schema for creating a new comment.
    Requires term_id as it's a new comment on a specific term.
    """

    term_id: uuid.UUID = Field(
        ..., description="The ID of the term this comment belongs to."
    )


class CommentUpdate(CommentBase):
    """
    Schema for updating an existing comment.
    Content can be updated. parent_id is typically not changed after creation.
    """

    pass


class CommentVoteStats(BaseModel):
    upvotes: int = 0
    downvotes: int = 0
    user_vote: Optional[str] = None


class CommentResponse(CommentBase):
    """
    Public-facing response schema for a comment.
    Includes all fields from the database model, plus aggregated vote counts
    and nested user/reply information.
    """

    id: uuid.UUID
    term_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    user: UserBase
    upvotes: int = Field(0, description="Total number of upvotes for this comment.")
    downvotes: int = Field(0, description="Total number of downvotes for this comment.")
    user_vote: Optional[str] = Field(
        None,
        description="The current authenticated user's vote ('upvote', 'downvote', or null).",
    )
    replies: List["CommentResponse"] = Field(
        [], description="List of replies to this comment."
    )

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        json_encoders = {uuid.UUID: lambda v: str(v), datetime: lambda v: v.isoformat()}


CommentResponse.model_rebuild()
