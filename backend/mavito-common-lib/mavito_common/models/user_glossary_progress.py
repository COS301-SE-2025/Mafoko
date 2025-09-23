import uuid
from sqlalchemy import ARRAY, String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from mavito_common.db.base_class import Base


class UserGlossaryProgress(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    language_name: Mapped[str] = mapped_column(String(50), nullable=False)
    glossary_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_card_index: Mapped[int] = mapped_column(Integer, default=0)
    retry_pile_ids: Mapped[list] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=True, server_default="{}"
    )
    __table_args__ = (
        UniqueConstraint(
            "user_id", "language_name", "glossary_name", name="_user_lang_glossary_uc"
        ),
    )
