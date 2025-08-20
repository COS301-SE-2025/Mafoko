from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    JSON,
)  # noqa: F401
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import Enum as SAEnum
from mavito_common.db.base_class import Base
from mavito_common.models.term_status import TermStatus


class TermApplicationVote(Base):
    """
    SQLAlchemy ORM model for votes on a TermApplication.
    Used for crowd-verification.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("termapplications.id"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    voted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    if TYPE_CHECKING:
        from mavito_common.models.user import User
        from mavito_common.models.term_application import TermApplication

    user: Mapped["User"] = relationship("User")
    application: Mapped["TermApplication"] = relationship(
        "TermApplication", back_populates="votes", foreign_keys=[application_id]
    )


class TermApplication(Base):
    """
    SQLAlchemy ORM model for term submissions/edit requests.
    Maps to the 'term_applications' table in the database.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    term_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("terms.id", ondelete="SET NULL"), index=True, nullable=True
    )
    submitted_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )

    proposed_content: Mapped[Dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=lambda: {}
    )

    status: Mapped[TermStatus] = mapped_column(
        SAEnum(TermStatus, name="term_status_enum_application"),
        default=TermStatus.PENDING_VERIFICATION,
        nullable=False,
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    linguist_verified_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    admin_approved_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    is_edit_for_term_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("terms.id"), nullable=True, index=True
    )

    if TYPE_CHECKING:
        from mavito_common.models.user import User
        from mavito_common.models.term import Term

    term: Mapped["Term"] = relationship(
        "Term", back_populates="term_applications", foreign_keys=[term_id]
    )
    submitted_by_user: Mapped["User"] = relationship(
        "User", foreign_keys=[submitted_by_user_id]
    )
    linguist_verifier: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[linguist_verified_by_user_id]
    )
    admin_approver: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[admin_approved_by_user_id]
    )

    votes: Mapped[List["TermApplicationVote"]] = relationship(
        "TermApplicationVote",
        back_populates="application",
        cascade="all, delete-orphan",
    )

    original_term_for_edit: Mapped[Optional["Term"]] = relationship(
        "Term", foreign_keys=[is_edit_for_term_id]
    )

    review: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
