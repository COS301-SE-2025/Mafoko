import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from enum import Enum

from sqlalchemy import String, DateTime, Integer, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    pass


class AchievementType(str, Enum):
    """Types of achievements"""

    XP_MILESTONE = "xp_milestone"  # Reach X total XP
    LEVEL_MILESTONE = "level_milestone"  # Reach level X
    COMMENT_COUNT = "comment_count"  # Create X comments
    UPVOTE_COUNT = "upvote_count"  # Receive X upvotes
    TERM_COUNT = "term_count"  # Add X terms
    LOGIN_STREAK = "login_streak"  # Login X days in a row
    FEEDBACK_COUNT = "feedback_count"  # Submit X feedback items


class Achievement(Base):
    """Achievement definitions"""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    achievement_type: Mapped[AchievementType] = mapped_column(
        nullable=False, index=True
    )
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
