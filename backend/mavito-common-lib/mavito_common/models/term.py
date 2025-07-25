# mavito-common-lib/mavito_common/models/term.py
import uuid
from sqlalchemy import Column, Table, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from mavito_common.db.base_class import Base
from typing import List, TYPE_CHECKING

# Association Table for the many-to-many relationship between terms (translations)
term_translations = Table(
    "term_translations",
    Base.metadata,
    Column("term_id", UUID(as_uuid=True), ForeignKey("terms.id"), primary_key=True),
    Column(
        "translation_id", UUID(as_uuid=True), ForeignKey("terms.id"), primary_key=True
    ),
)

if TYPE_CHECKING:
    from mavito_common.models.workspace import BookmarkedTerm


class Term(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    term: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    example: Mapped[str | None] = mapped_column(Text)

    # This relationship will automatically handle the linking of translations
    translations: Mapped[List["Term"]] = relationship(
        "Term",
        secondary=term_translations,
        primaryjoin=id == term_translations.c.term_id,
        secondaryjoin=id == term_translations.c.translation_id,
        backref="related_from",  # helps in bi-directional linking
    )

    # Workspace relationship
    bookmarked_by_users: Mapped[List["BookmarkedTerm"]] = relationship(
        "BookmarkedTerm", back_populates="term", cascade="all, delete-orphan"
    )
