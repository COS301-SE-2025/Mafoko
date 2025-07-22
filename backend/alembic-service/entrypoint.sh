#!/bin/sh
set -e

echo "Installing common library..."
pip install -e /mavito-common-lib-src

# Execute the command (fallback to migrations if none provided)
if [ "$#" -eq 0 ]; then
    exec python -m alembic upgrade head
else
    exec "$@"
fi