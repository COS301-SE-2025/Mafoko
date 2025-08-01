# mavito-common-lib/mavito_common/models/workspace.py
import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import String, DateTime, ForeignKey, Enum as SaEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.user import User
    from mavito_common.models.term import Term


class GroupType(str, enum.Enum):
    """Enum for workspace group types"""

    TERMS = "terms"
    GLOSSARIES = "glossaries"
    MIXED = "mixed"


class ItemType(str, enum.Enum):
    """Enum for workspace group item types"""

    TERM = "term"
    GLOSSARY = "glossary"


class BookmarkedTerm(Base):
    """Model for user's bookmarked terms"""

    __tablename__ = "bookmarked_terms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    term_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("terms.id", ondelete="CASCADE"))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bookmarked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="bookmarked_terms")
    term: Mapped["Term"] = relationship("Term", backref="bookmarked_by")


class BookmarkedGlossary(Base):
    """Model for user's bookmarked glossaries"""

    __tablename__ = "bookmarked_glossaries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    domain: Mapped[str] = mapped_column(String(100))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bookmarked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="bookmarked_glossaries")


class WorkspaceGroup(Base):
    """Model for workspace groups"""

    __tablename__ = "workspace_groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    group_type: Mapped[GroupType] = mapped_column(SaEnum(GroupType))
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # Hex color code
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    items: Mapped[List["WorkspaceGroupItem"]] = relationship(
        "WorkspaceGroupItem", back_populates="group", cascade="all, delete-orphan"
    )
    user: Mapped["User"] = relationship("User", back_populates="workspace_groups")


class WorkspaceGroupItem(Base):
    """Model for workspace group items"""

    __tablename__ = "workspace_group_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspace_groups.id", ondelete="CASCADE"))
    item_type: Mapped[ItemType] = mapped_column(SaEnum(ItemType))
    term_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("terms.id", ondelete="CASCADE"), nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group: Mapped[WorkspaceGroup] = relationship("WorkspaceGroup", back_populates="items")
    term: Mapped[Optional["Term"]] = relationship("Term", backref="workspace_items")
