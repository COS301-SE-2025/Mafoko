"""add workspace tables

Revision ID: 0a425e5ba233
Revises: 01b03f731961
Create Date: 2025-07-25 19:50:03.474428

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a425e5ba233'
down_revision: Union[str, Sequence[str], None] = '01b03f731961'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create bookmarked_terms table
    op.create_table(
        'bookmarked_terms',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('term_id', sa.UUID(), nullable=False),
        sa.Column('bookmarked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['term_id'], ['terms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'term_id', name='uq_user_term_bookmark')
    )
    op.create_index(op.f('ix_bookmarked_terms_id'), 'bookmarked_terms', ['id'], unique=False)
    op.create_index(op.f('ix_bookmarked_terms_user_id'), 'bookmarked_terms', ['user_id'], unique=False)
    op.create_index(op.f('ix_bookmarked_terms_term_id'), 'bookmarked_terms', ['term_id'], unique=False)

    # Create bookmarked_glossaries table
    op.create_table(
        'bookmarked_glossaries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=False),
        sa.Column('bookmarked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'domain', name='uq_user_domain_bookmark')
    )
    op.create_index(op.f('ix_bookmarked_glossaries_id'), 'bookmarked_glossaries', ['id'], unique=False)
    op.create_index(op.f('ix_bookmarked_glossaries_user_id'), 'bookmarked_glossaries', ['user_id'], unique=False)
    op.create_index(op.f('ix_bookmarked_glossaries_domain'), 'bookmarked_glossaries', ['domain'], unique=False)

    # Create workspace_groups table
    op.create_table(
        'workspace_groups',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('group_type', sa.Enum('TERMS', 'GLOSSARIES', 'MIXED', name='grouptype'), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workspace_groups_id'), 'workspace_groups', ['id'], unique=False)
    op.create_index(op.f('ix_workspace_groups_user_id'), 'workspace_groups', ['user_id'], unique=False)
    op.create_index(op.f('ix_workspace_groups_name'), 'workspace_groups', ['name'], unique=False)

    # Create workspace_group_items table
    op.create_table(
        'workspace_group_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('group_id', sa.UUID(), nullable=False),
        sa.Column('item_type', sa.Enum('TERM', 'GLOSSARY', name='itemtype'), nullable=False),
        sa.Column('term_id', sa.UUID(), nullable=True),
        sa.Column('domain', sa.String(length=255), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "(item_type = 'TERM' AND term_id IS NOT NULL AND domain IS NULL) OR "
            "(item_type = 'GLOSSARY' AND domain IS NOT NULL AND term_id IS NULL)",
            name='check_item_type_consistency'
        ),
        sa.ForeignKeyConstraint(['group_id'], ['workspace_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['term_id'], ['terms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'term_id', name='uq_group_term'),
        sa.UniqueConstraint('group_id', 'domain', name='uq_group_domain')
    )
    op.create_index(op.f('ix_workspace_group_items_id'), 'workspace_group_items', ['id'], unique=False)
    op.create_index(op.f('ix_workspace_group_items_group_id'), 'workspace_group_items', ['group_id'], unique=False)
    op.create_index(op.f('ix_workspace_group_items_term_id'), 'workspace_group_items', ['term_id'], unique=False)
    op.create_index(op.f('ix_workspace_group_items_domain'), 'workspace_group_items', ['domain'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order (due to foreign key constraints)
    op.drop_index(op.f('ix_workspace_group_items_domain'), table_name='workspace_group_items')
    op.drop_index(op.f('ix_workspace_group_items_term_id'), table_name='workspace_group_items')
    op.drop_index(op.f('ix_workspace_group_items_group_id'), table_name='workspace_group_items')
    op.drop_index(op.f('ix_workspace_group_items_id'), table_name='workspace_group_items')
    op.drop_table('workspace_group_items')
    
    op.drop_index(op.f('ix_workspace_groups_name'), table_name='workspace_groups')
    op.drop_index(op.f('ix_workspace_groups_user_id'), table_name='workspace_groups')
    op.drop_index(op.f('ix_workspace_groups_id'), table_name='workspace_groups')
    op.drop_table('workspace_groups')
    
    op.drop_index(op.f('ix_bookmarked_glossaries_domain'), table_name='bookmarked_glossaries')
    op.drop_index(op.f('ix_bookmarked_glossaries_user_id'), table_name='bookmarked_glossaries')
    op.drop_index(op.f('ix_bookmarked_glossaries_id'), table_name='bookmarked_glossaries')
    op.drop_table('bookmarked_glossaries')
    
    op.drop_index(op.f('ix_bookmarked_terms_term_id'), table_name='bookmarked_terms')
    op.drop_index(op.f('ix_bookmarked_terms_user_id'), table_name='bookmarked_terms')
    op.drop_index(op.f('ix_bookmarked_terms_id'), table_name='bookmarked_terms')
    op.drop_table('bookmarked_terms')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS itemtype')
    op.execute('DROP TYPE IF EXISTS grouptype')
