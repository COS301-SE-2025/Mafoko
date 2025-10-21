"""Merge multiple head revisions

Revision ID: merge_multiple_heads
Revises: ce4b344c2399_fixed, a1b2c3d4e5f6, c4fed89bf6d6
Create Date: 2025-10-21 11:00:00.000000

"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "merge_multiple_heads"
down_revision: Union[str, Sequence[str], None] = (
    "ce4b344c2399_fixed",
    "a1b2c3d4e5f6",
    "c4fed89bf6d6",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge multiple heads."""
    # This is a merge migration, no schema changes needed
    pass


def downgrade() -> None:
    """Downgrade to multiple heads."""
    # This is a merge migration no schema changes needed
    pass
