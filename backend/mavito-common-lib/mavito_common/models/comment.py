from __future__ import annotations
import uuid  # Must be the very first import

from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from mavito_common.db.base_class import Base
from sqlalchemy.sql import func


class CommentBase(BaseModel):
    """
    Base Pydantic model representing common attributes of a comment.
    Used for both input and as a base for response schemas.
    """

    id: UUID4
    user_id: UUID4
    content: str
    date_posted: datetime
    tombstone: bool = False
    term_id: UUID4
    parent_id: Optional[UUID4] = None


class Comment(Base):
    """
    SQLAlchemy ORM model for comments.
    Maps to the 'comments' table in the database.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    term_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("terms.id"), index=True, nullable=False
    )
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("comments.id"), nullable=True, index=True
    )
    content: Mapped[str] = mapped_column(String, nullable=False)
    date_posted: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    tombstone: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    if TYPE_CHECKING:
        from mavito_common.models.user import User
        from mavito_common.models.term import Term
        from mavito_common.models.comment_vote import CommentVote

    user: Mapped["User"] = relationship("User", back_populates="comments")
    term: Mapped["Term"] = relationship("Term", back_populates="comments")
    parent: Mapped[Optional["Comment"]] = relationship(
        "Comment", remote_side=[id], back_populates="replies"
    )
    replies: Mapped[List["Comment"]] = relationship("Comment", back_populates="parent")
    votes: Mapped[List["CommentVote"]] = relationship(
        "CommentVote", back_populates="comment"
    )


class CommentCreate(BaseModel):
    """
    Pydantic schema for creating a new comment.
    """

    user_id: UUID4
    content: str
    term_id: UUID4
    parent_id: Optional[UUID4] = None


class CommentResponse(CommentBase):
    """
    Pydantic schema for public-facing comment response, including nested user and replies.
    """

    user: dict
    replies: List[CommentResponse] = []
    votes_count: int = 0

    class Config:
        from_attributes = True
