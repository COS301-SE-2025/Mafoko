from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import List, Optional


class CommentBase(BaseModel):
    """
    Base model representing a comment on a term.

    Attributes:
        id (UUID4): Unique identifier for the comment.
        user_id (UUID4): ID of the user who posted the comment.
        content (str): The text content of the comment.
        date_posted (datetime): Timestamp when the comment was created.
        tombstone (bool): Marks the comment as soft-deleted if True.
        replies (List[UUID4]): List of UUIDs of comments that are replies to this one.
        term_id (UUID4): ID of the term this comment is associated with.
        parent_id (Optional[UUID4]): ID of the parent comment if this is a reply.
    """

    id: UUID4
    user_id: UUID4
    content: str
    date_posted: datetime
    tombstone: bool = False
    term_id: UUID4
    parent_id: Optional[UUID4] = None


class Comment(CommentBase):
    """
    Public-facing response model for a comment.

    Inherits all fields from CommentBase.
    """

    pass


class CommentCreate(BaseModel):
    """
    Schema for creating a new comment.

    Attributes:
        user_id (UUID4): ID of the user posting the comment.
        content (str): Text content of the comment.
        term_id (UUID4): ID of the term the comment is attached to.
        parent_id (Optional[UUID4]): ID of a parent comment if this is a reply.
    """

    user_id: UUID4
    content: str
    term_id: UUID4
    parent_id: Optional[UUID4] = None


class CommentResponse(CommentBase):
    """
    Comment response schema with nested replies expanded.
    """

    replies: List["CommentResponse"] = []
    """List of fully expanded replies (recursive)."""

    class Config:
        orm_mode = True


CommentResponse.update_forward_refs()
