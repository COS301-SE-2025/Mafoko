import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from mavito_common.db.base_class import Base

if TYPE_CHECKING:
    from mavito_common.models.user import User


class UserLevel(Base):
    """User level tracking based on total XP"""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
        unique=True,
    )
    current_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    total_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="level")


def calculate_level_from_xp(total_xp: int) -> int:
    """
    Calculate user level based on total XP.
    Level progression: Level 1 = 0-99 XP, Level 2 = 100-299 XP, etc.
    Formula: Each level requires 100 + (level-1) * 100 additional XP
    """
    if total_xp < 0:
        return 1

    level = 1
    xp_required = 0

    while total_xp >= xp_required:
        xp_for_next_level = 100 * level
        if total_xp < xp_required + xp_for_next_level:
            break
        xp_required += xp_for_next_level
        level += 1

    return level


def calculate_xp_for_level(level: int) -> int:
    """
    Calculate total XP required to reach a specific level.
    """
    if level <= 1:
        return 0

    total_xp = 0
    for current_level in range(1, level):
        total_xp += 100 * current_level

    return total_xp


def calculate_xp_for_next_level(current_level: int) -> int:
    """
    Calculate XP required for the next level.
    """
    return 100 * (current_level + 1)
