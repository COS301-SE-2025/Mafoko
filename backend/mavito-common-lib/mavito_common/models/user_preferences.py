import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy import ForeignKey

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.user import User


class UserPreferences(Base):
    """
    SQLAlchemy ORM model for user preferences.
    Maps to the 'user_preferences' table in the database.
    """
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True, nullable=False
    )
    dark_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    offline_mode_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    ui_language: Mapped[str] = mapped_column(
        String(3), default="eng", nullable=False
    )  # References languages(code)
    text_size: Mapped[int] = mapped_column(Integer, default=16, nullable=False)
    text_spacing: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    high_contrast_mode: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="preferences")