import enum
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List

from sqlalchemy import String, Boolean, DateTime, Enum as SaEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.linguist_application import LinguistApplication
    from mavito_common.models.comment import Comment
    from mavito_common.models.comment_vote import CommentVote
    from mavito_common.models.bookmark import TermBookmark, GlossaryBookmark
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.workspace_note import WorkspaceNote


class UserRole(str, enum.Enum):
    linguist = "linguist"
    contributor = "contributor"
    admin = "admin"


class User(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Optional[UserRole]] = mapped_column(
        SaEnum(UserRole, name="user_role_enum_type_sqla"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_pic_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password_reset_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    verification_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    account_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    linguist_application: Mapped[Optional["LinguistApplication"]] = relationship(
        "LinguistApplication", back_populates="user", uselist=False
    )
    comments: Mapped[List["Comment"]] = relationship("Comment", back_populates="user")
    comment_votes: Mapped[List["CommentVote"]] = relationship(
        "CommentVote", back_populates="user"
    )
    
    # Workspace relationships
    term_bookmarks: Mapped[List["TermBookmark"]] = relationship(
        "TermBookmark", back_populates="user", cascade="all, delete-orphan"
    )
    glossary_bookmarks: Mapped[List["GlossaryBookmark"]] = relationship(
        "GlossaryBookmark", back_populates="user", cascade="all, delete-orphan"
    )
    workspace_groups: Mapped[List["WorkspaceGroup"]] = relationship(
        "WorkspaceGroup", back_populates="user", cascade="all, delete-orphan"
    )
    workspace_notes: Mapped[List["WorkspaceNote"]] = relationship(
        "WorkspaceNote", back_populates="user", cascade="all, delete-orphan"
    )
