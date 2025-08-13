import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, String, DateTime, Enum as SaEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.user import User


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LinguistApplication(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        SaEnum(ApplicationStatus, name="application_status_enum"),
        default=ApplicationStatus.pending,
        nullable=False,
    )
    google_scholar_url: Mapped[str] = mapped_column(String, nullable=False)
    research_papers_gcs_keys: Mapped[List[str]] = mapped_column(
        ARRAY(String), nullable=False
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="linguist_application")
