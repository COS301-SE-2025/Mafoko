# backend/migrations/alembic/env.py

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Import the centralized settings from your common library
from mavito_common.core.config import settings
from mavito_common.db.base_class import Base
import mavito_common.models.user  # noqa: F401
import mavito_common.models.term  # noqa: F401
import mavito_common.models.comment  # noqa: F401
import mavito_common.models.comment_vote  # noqa: F401
import mavito_common.models.term_vote  # noqa: F401
import mavito_common.models.linguist_application  # noqa: F401
import mavito_common.models.bookmark  # noqa: F401
import mavito_common.models.workspace_group  # noqa: F401
import mavito_common.models.group_term  # noqa: F401
import mavito_common.models.workspace_note  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = settings.SQLALCHEMY_DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Use the URL from the centralized settings
    connectable = create_async_engine(
        settings.SQLALCHEMY_DATABASE_URL,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
