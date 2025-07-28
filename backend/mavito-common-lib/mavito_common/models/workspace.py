# mavito-common-lib/mavito_common/models/workspace.py
import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, Enum as SaEnum
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

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    term_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("terms.id", ondelete="CASCADE"), primary_key=True
    )
    bookmarked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="bookmarked_terms")
    term: Mapped["Term"] = relationship("Term", back_populates="bookmarked_by_users")


class BookmarkedGlossary(Base):
    """Model for user's bookmarked glossaries (domains)"""

    __tablename__ = "bookmarked_glossaries"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    domain: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    bookmarked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="bookmarked_glossaries")


class WorkspaceGroup(Base):
    """Model for user's workspace groups for organizing bookmarks"""

    __tablename__ = "workspace_groups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    group_type: Mapped[GroupType] = mapped_column(
        SaEnum(GroupType, name="group_type_enum"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="workspace_groups")
    items: Mapped[list["WorkspaceGroupItem"]] = relationship(
        "WorkspaceGroupItem", back_populates="group", cascade="all, delete-orphan"
    )


class WorkspaceGroupItem(Base):
    """Model for items within workspace groups"""

    __tablename__ = "workspace_group_items"

    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspace_groups.id", ondelete="CASCADE"),
        primary_key=True,
    )
    item_id: Mapped[str] = mapped_column(
        String(255), primary_key=True
    )  # Can be UUID string for terms or domain string for glossaries
    item_type: Mapped[ItemType] = mapped_column(
        SaEnum(ItemType, name="item_type_enum"), nullable=False
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    group: Mapped["WorkspaceGroup"] = relationship(
        "WorkspaceGroup", back_populates="items"
    )
