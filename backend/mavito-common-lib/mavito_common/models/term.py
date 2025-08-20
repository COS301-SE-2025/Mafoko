# mavito-common-lib/mavito_common/models/term.py

from __future__ import annotations
import uuid
from sqlalchemy import Column, DateTime, Table, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from mavito_common.db.base_class import Base
from typing import List, TYPE_CHECKING
from mavito_common.models.term_status import TermStatus
from sqlalchemy import Enum as SAEnum

if TYPE_CHECKING:
    from mavito_common.models.comment import Comment
    from mavito_common.models.bookmark import TermBookmark
    from mavito_common.models.group_term import GroupTerm
    from mavito_common.models.workspace_note import WorkspaceNote
    from mavito_common.models.user import User
    from mavito_common.models.term_application import TermApplication

# Association table for the many-to-many relationship (translations)
term_translations = Table(
    "term_translations",
    Base.metadata,
    Column(
        "term_id",
        UUID(as_uuid=True),
        ForeignKey("terms.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "translation_id",
        UUID(as_uuid=True),
        ForeignKey("terms.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Term(Base):

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Original fields
    term: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    example: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TermStatus] = mapped_column(
        SAEnum(TermStatus, name="term_status_enum"),
        default=TermStatus.PENDING_VERIFICATION,
        nullable=False,
        index=True,
    )

    # Multilingual fields
    eng: Mapped[str | None] = mapped_column(Text, nullable=True)
    afr: Mapped[str | None] = mapped_column(Text, nullable=True)
    nbl: Mapped[str | None] = mapped_column(Text, nullable=True)
    xho: Mapped[str | None] = mapped_column(Text, nullable=True)
    zul: Mapped[str | None] = mapped_column(Text, nullable=True)
    nso: Mapped[str | None] = mapped_column(Text, nullable=True)
    sot: Mapped[str | None] = mapped_column(Text, nullable=True)
    tsn: Mapped[str | None] = mapped_column(Text, nullable=True)
    ssw: Mapped[str | None] = mapped_column(Text, nullable=True)
    ven: Mapped[str | None] = mapped_column(Text, nullable=True)
    tso: Mapped[str | None] = mapped_column(Text, nullable=True)

    # POS/Descriptor fields
    eng_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eng_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    afr_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    afr_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    nbl_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    nbl_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    xho_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    xho_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    zul_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    zul_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    nso_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    nso_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    sot_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sot_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    tsn_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tsn_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    ssw_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ssw_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    ven_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ven_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    tso_pos_or_descriptor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tso_pos_or_descriptor_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    owner: Mapped["User"] = relationship(
        "User", back_populates="owned_terms", lazy="selectin"
    )
    term_applications: Mapped[List["TermApplication"]] = relationship(
        "TermApplication",
        back_populates="term",
        cascade="save-update",
        foreign_keys="[TermApplication.term_id]",
        lazy="selectin",
    )

    # Self-referential relationship for translations
    # Defines the "outgoing" side of the relationship
    translations: Mapped[List["Term"]] = relationship(
        "Term",
        secondary=term_translations,
        primaryjoin=id == term_translations.c.term_id,
        secondaryjoin=id == term_translations.c.translation_id,
        back_populates="translations_from",
        lazy="selectin",
    )

    # Defines the "incoming" side of the relationship
    translations_from: Mapped[List["Term"]] = relationship(
        "Term",
        secondary=term_translations,
        primaryjoin=id == term_translations.c.translation_id,
        secondaryjoin=id == term_translations.c.term_id,
        back_populates="translations",
        lazy="selectin",
    )

    # Other relationships
    comments: Mapped[List["Comment"]] = relationship(
        "Comment", back_populates="term", lazy="selectin"
    )
    bookmarks: Mapped[List["TermBookmark"]] = relationship(
        "TermBookmark",
        back_populates="term",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    group_terms: Mapped[List["GroupTerm"]] = relationship(
        "GroupTerm",
        back_populates="term",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    workspace_notes: Mapped[List["WorkspaceNote"]] = relationship(
        "WorkspaceNote",
        back_populates="term",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
