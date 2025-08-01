import uuid
import enum
from sqlalchemy import ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from mavito_common.db.base_class import Base
from typing import TYPE_CHECKING


class VoteType(str, enum.Enum):
    upvote = "upvote"
    downvote = "downvote"


class CommentVote(Base):

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    comment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("comments.id"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    vote: Mapped[str] = mapped_column(
        SAEnum(VoteType, name="vote_type_enum"), nullable=False
    )

    if TYPE_CHECKING:
        from mavito_common.models.user import User
    user: Mapped["User"] = relationship(
        "User", back_populates="comment_votes", foreign_keys=[user_id]
    )

    if TYPE_CHECKING:
        from mavito_common.models.comment import Comment
    comment: Mapped["Comment"] = relationship(
        "Comment", back_populates="votes", foreign_keys=[comment_id]
    )
