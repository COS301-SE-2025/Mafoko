import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.term import Term


class GroupTerm(Base):
    """
    Association table for many-to-many relationship between groups and terms.
    """

    __tablename__ = "group_terms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspace_groups.id"),
        nullable=False,
        index=True,
    )
    term_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("terms.id"), nullable=False, index=True
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    group: Mapped["WorkspaceGroup"] = relationship(
        "WorkspaceGroup", back_populates="group_terms"
    )
    term: Mapped["Term"] = relationship("Term", back_populates="group_terms")
