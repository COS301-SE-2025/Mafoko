# alembic-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy and install dependencies first
COPY ./alembic-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the common library
COPY ./mavito-common-lib /app/mavito-common-lib-src

# Copy the entire migrations directory.
# This will place backend/migrations/alembic.ini at /app/migrations/alembic.ini
# and backend/migrations/alembic/ at /app/migrations/alembic/
COPY ./migrations /app/migrations

# Copy the entrypoint script into the image
COPY ./alembic-service/entrypoint.sh /app/entrypoint.sh
# Make it executable inside the container
RUN sed -i 's/\r$//' /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint for the container
ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["sleep", "infinity"]