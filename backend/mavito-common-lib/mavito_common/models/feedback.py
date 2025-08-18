import enum
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Enum as SaEnum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.user import User


class FeedbackType(str, enum.Enum):
    suggestion = "suggestion"
    complaint = "complaint"
    compliment = "compliment"


class FeedbackStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class Feedback(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    type: Mapped[FeedbackType] = mapped_column(
        SaEnum(FeedbackType, name="feedback_type_enum"), nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    status: Mapped[FeedbackStatus] = mapped_column(
        SaEnum(FeedbackStatus, name="feedback_status_enum"),
        nullable=False,
        default=FeedbackStatus.open,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    admin_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[user_id], back_populates="feedback_submitted"
    )
    resolved_by: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[resolved_by_user_id], back_populates="feedback_resolved"
    )
