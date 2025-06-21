import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    ForeignKey,
    String,
    DateTime,
    Enum as SaEnum,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from mavito_common.db.base_class import Base
from mavito_common.models.user import User  # Import the User model

class ApplicationStatus(str, enum.Enum):
    """Enum for the status of a linguist application."""
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class LinguistApplication(Base):
    """Database model for linguist applications."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        SaEnum(ApplicationStatus, name="application_status_enum"),
        default=ApplicationStatus.pending,
        nullable=False
    )
    
    id_document_url: Mapped[str] = mapped_column(String, nullable=False)
    cv_document_url: Mapped[str] = mapped_column(String, nullable=False)
    certifications_document_url: Mapped[str | None] = mapped_column(String, nullable=True)
    research_papers_document_url: Mapped[str | None] = mapped_column(String, nullable=True)

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    # Define the many-to-one relationship back to the User
    user: Mapped["User"] = relationship(back_populates="linguist_application")
