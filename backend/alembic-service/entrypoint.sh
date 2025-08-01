#!/bin/sh
set -e # Exit immediately if a command exits with a non-zero status

echo "Starting entrypoint script for Alembic (Cloud Run compatible)..."


# Execute the command (fallback to migrations if none provided)
if [ "$#" -eq 0 ]; then
    # Alembic.ini is at /app/migrations/alembic.ini
    exec python -m alembic -c migrations/alembic.ini upgrade head
else
    exec "$@"
fi
