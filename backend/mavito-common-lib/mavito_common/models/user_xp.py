import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from enum import Enum

from sqlalchemy import String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.user import User


class XPSource(str, Enum):
    """Sources of XP for tracking and achievements"""

    COMMENT = "comment"  # Creating a comment
    UPVOTE_RECEIVED = "upvote_received"  # Receiving an upvote
    DOWNVOTE_RECEIVED = "downvote_received"  # Receiving a downvote (negative XP)
    TERM_ADDITION = "term_addition"  # Adding a new term
    TERM_UPVOTE = "term_upvote"  # Upvoting a term
    FEEDBACK_SUBMISSION = "feedback_submission"  # Submitting feedback
    GOAL_COMPLETION = "goal_completion"  # Completing a goal/task
    LOGIN_STREAK = "login_streak"  # Daily login streak bonus
    ACHIEVEMENT_BONUS = "achievement_bonus"  # Bonus XP from achievements
    MANUAL_ADMIN = "manual_admin"  # Manually added by admin


class UserXP(Base):
    """Individual XP transaction records for detailed tracking"""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True
    )
    xp_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_source: Mapped[XPSource] = mapped_column(nullable=False, index=True)
    source_reference_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )  # Reference to the source object (comment_id, term_id, etc.)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="xp_records")
