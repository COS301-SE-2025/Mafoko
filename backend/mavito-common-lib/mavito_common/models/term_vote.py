# mavito-common-lib/mavito_common/models/term_vote.py
import uuid
import enum
from sqlalchemy import ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from mavito_common.db.base_class import Base


class VoteType(str, enum.Enum):
    upvote = "upvote"
    downvote = "downvote"


class TermVote(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    term_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("terms.id"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    vote: Mapped[VoteType] = mapped_column(
        SAEnum(VoteType, name="vote_type_enum"), nullable=False
    )
