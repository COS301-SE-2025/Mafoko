"""Added term applications with multilingual support

Revision ID: 8c929b111572
Revises: f01636d83e8d
Create Date: 2025-08-17 11:39:50.596845

"""

from typing import Sequence, Union
from datetime import datetime
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision: str = "8c929b111572"
down_revision: Union[str, Sequence[str], None] = "f01636d83e8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# DSFSI user details
DSFSI_USER_EMAIL = "dsfsi@example.com"
DSFSI_USER_FIRST_NAME = "DSFSI"
DSFSI_USER_LAST_NAME = "System"
DSFSI_USER_PASSWORD_HASH = (
    "$2b$12$placeholderhash"  # Replace with actual hash if needed
)


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create term applications tables first
    op.create_table(
        "termapplications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("term_id", sa.UUID(), nullable=False),
        sa.Column("submitted_by_user_id", sa.UUID(), nullable=False),
        sa.Column("proposed_content", sa.JSON(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING_VERIFICATION",
                "CROWD_VERIFIED",
                "LINGUIST_VERIFIED",
                "ADMIN_APPROVED",
                "REJECTED",
                "DRAFT",
                name="term_status_enum_application",
            ),
            nullable=False,
        ),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("linguist_verified_by_user_id", sa.UUID(), nullable=True),
        sa.Column("admin_approved_by_user_id", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_edit_for_term_id", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(
            ["admin_approved_by_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["is_edit_for_term_id"],
            ["terms.id"],
        ),
        sa.ForeignKeyConstraint(
            ["linguist_verified_by_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["submitted_by_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["term_id"],
            ["terms.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_termapplications_is_edit_for_term_id"),
        "termapplications",
        ["is_edit_for_term_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_termapplications_submitted_by_user_id"),
        "termapplications",
        ["submitted_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_termapplications_term_id"),
        "termapplications",
        ["term_id"],
        unique=False,
    )

    op.create_table(
        "termapplicationvotes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("application_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "voted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["termapplications.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_termapplicationvotes_application_id"),
        "termapplicationvotes",
        ["application_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_termapplicationvotes_user_id"),
        "termapplicationvotes",
        ["user_id"],
        unique=False,
    )

    # 2. Create the term_status_enum type
    term_status_enum = sa.Enum(
        "PENDING_VERIFICATION",
        "CROWD_VERIFIED",
        "LINGUIST_VERIFIED",
        "ADMIN_APPROVED",
        "REJECTED",
        "DRAFT",
        name="term_status_enum",
    )
    term_status_enum.create(op.get_bind(), checkfirst=True)

    # 3. Add status column as nullable first
    op.add_column("terms", sa.Column("status", term_status_enum, nullable=True))

    # 4. Update existing terms with default status
    op.execute(
        sa.text("UPDATE terms SET status = 'ADMIN_APPROVED' WHERE status IS NULL")
    )

    # 5. Alter status column to be NOT NULL
    op.alter_column("terms", "status", nullable=False)

    # 6. Add all multilingual fields (these can be nullable)
    op.add_column("terms", sa.Column("eng", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("afr", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("nbl", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("xho", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("zul", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("nso", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("sot", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("tsn", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("ssw", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("ven", sa.Text(), nullable=True))
    op.add_column("terms", sa.Column("tso", sa.Text(), nullable=True))

    # Add POS/descriptor fields
    op.add_column(
        "terms", sa.Column("eng_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("eng_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("afr_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("afr_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("nbl_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("nbl_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("xho_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("xho_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("zul_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("zul_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("nso_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("nso_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("sot_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("sot_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("tsn_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("tsn_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("ssw_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("ssw_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("ven_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("ven_pos_or_descriptor_info", sa.Text(), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("tso_pos_or_descriptor", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "terms", sa.Column("tso_pos_or_descriptor_info", sa.Text(), nullable=True)
    )

    # 7. Create or get DSFSI user - with all required fields
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT id FROM users WHERE email = :email"),
        {"email": DSFSI_USER_EMAIL},
    ).fetchone()

    if result:
        dsfsi_user_id = result[0]
    else:
        dsfsi_user_id = str(uuid.uuid4())
        conn.execute(
            sa.text(
                """
                INSERT INTO users (
                    id, first_name, last_name, email, password_hash,
                    is_verified, is_active, created_at, account_locked,
                    failed_login_attempts, role, profile_pic_url,
                    verification_token, password_reset_token, last_login,
                    deleted_at
                ) VALUES (
                    :id, :first_name, :last_name, :email, :password_hash,
                    true, true, :created_at, false,
                    0, null, null,
                    null, null, null,
                    null
                )
            """
            ),
            {
                "id": dsfsi_user_id,
                "first_name": DSFSI_USER_FIRST_NAME,
                "last_name": DSFSI_USER_LAST_NAME,
                "email": DSFSI_USER_EMAIL,
                "password_hash": DSFSI_USER_PASSWORD_HASH,
                "created_at": datetime.utcnow(),
            },
        )

    # 8. Add owner_id column as nullable first
    op.add_column("terms", sa.Column("owner_id", sa.UUID(), nullable=True))

    # 9. Set all existing terms to be owned by DSFSI user
    op.execute(
        sa.text(
            "UPDATE terms SET owner_id = CAST(:owner_id AS UUID) WHERE owner_id IS NULL"
        ).bindparams(owner_id=dsfsi_user_id)
    )

    # 10. Alter owner_id column to be NOT NULL
    op.alter_column("terms", "owner_id", nullable=False)

    # 11. Create foreign key and indexes
    op.create_foreign_key("fk_terms_owner_id", "terms", "users", ["owner_id"], ["id"])
    op.create_index(op.f("ix_terms_owner_id"), "terms", ["owner_id"])
    op.create_index(op.f("ix_terms_status"), "terms", ["status"])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key and indexes first
    op.drop_constraint("fk_terms_owner_id", "terms", type_="foreignkey")
    op.drop_index(op.f("ix_terms_status"), table_name="terms")
    op.drop_index(op.f("ix_terms_owner_id"), table_name="terms")

    # Drop owner_id column
    op.drop_column("terms", "owner_id")

    # Drop all multilingual fields
    op.drop_column("terms", "tso_pos_or_descriptor_info")
    op.drop_column("terms", "tso_pos_or_descriptor")
    op.drop_column("terms", "ven_pos_or_descriptor_info")
    op.drop_column("terms", "ven_pos_or_descriptor")
    op.drop_column("terms", "ssw_pos_or_descriptor_info")
    op.drop_column("terms", "ssw_pos_or_descriptor")
    op.drop_column("terms", "tsn_pos_or_descriptor_info")
    op.drop_column("terms", "tsn_pos_or_descriptor")
    op.drop_column("terms", "sot_pos_or_descriptor_info")
    op.drop_column("terms", "sot_pos_or_descriptor")
    op.drop_column("terms", "nso_pos_or_descriptor_info")
    op.drop_column("terms", "nso_pos_or_descriptor")
    op.drop_column("terms", "zul_pos_or_descriptor_info")
    op.drop_column("terms", "zul_pos_or_descriptor")
    op.drop_column("terms", "xho_pos_or_descriptor_info")
    op.drop_column("terms", "xho_pos_or_descriptor")
    op.drop_column("terms", "nbl_pos_or_descriptor_info")
    op.drop_column("terms", "nbl_pos_or_descriptor")
    op.drop_column("terms", "afr_pos_or_descriptor_info")
    op.drop_column("terms", "afr_pos_or_descriptor")
    op.drop_column("terms", "eng_pos_or_descriptor_info")
    op.drop_column("terms", "eng_pos_or_descriptor")
    op.drop_column("terms", "tso")
    op.drop_column("terms", "ven")
    op.drop_column("terms", "ssw")
    op.drop_column("terms", "tsn")
    op.drop_column("terms", "sot")
    op.drop_column("terms", "nso")
    op.drop_column("terms", "zul")
    op.drop_column("terms", "xho")
    op.drop_column("terms", "nbl")
    op.drop_column("terms", "afr")
    op.drop_column("terms", "eng")

    # Drop status column
    op.drop_column("terms", "status")

    # Drop term application tables
    op.drop_index(
        op.f("ix_termapplicationvotes_user_id"), table_name="termapplicationvotes"
    )
    op.drop_index(
        op.f("ix_termapplicationvotes_application_id"),
        table_name="termapplicationvotes",
    )
    op.drop_table("termapplicationvotes")
    op.drop_index(op.f("ix_termapplications_term_id"), table_name="termapplications")
    op.drop_index(
        op.f("ix_termapplications_submitted_by_user_id"), table_name="termapplications"
    )
    op.drop_index(
        op.f("ix_termapplications_is_edit_for_term_id"), table_name="termapplications"
    )
    op.drop_table("termapplications")

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS term_status_enum")
    op.execute("DROP TYPE IF EXISTS term_status_enum_application")
