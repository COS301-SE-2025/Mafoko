"""Add guest role to user enum

Revision ID: a1b2c3d4e5f6
Revises: fbe53acc59ce
Create Date: 2025-01-27 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "fbe53acc59ce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_role_enum_type_sqla ADD VALUE 'guest'")


def downgrade() -> None:
    raise RuntimeError(
        "Cannot downgrade: PostgreSQL doesn't support removing enum values. "
        "Manual intervention required if rollback is needed."
    )
