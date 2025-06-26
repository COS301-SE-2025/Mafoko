#!/bin/sh
# alembic-service/entrypoint.sh

set -e

echo "Entrypoint: Installing/updating editable common library..."
# CHANGE THE PATH IN THE LINE BELOW
pip install -e /mavito-common-lib-src

# Now, execute the command passed to the container
exec "$@"