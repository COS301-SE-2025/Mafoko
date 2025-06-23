# alembic-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy and install dependencies first
COPY ./alembic-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entrypoint script into the image
COPY ./alembic-service/entrypoint.sh /app/entrypoint.sh
# Make it executable inside the container
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint for the container
ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["sleep", "infinity"]