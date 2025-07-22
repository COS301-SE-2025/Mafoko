    FROM python:3.11-slim

    WORKDIR /app

    # Copy and install dependencies first
    COPY ./alembic-service/requirements.txt /app/requirements.txt
    RUN pip install --no-cache-dir -r requirements.txt

    # Copy the common library into the image for Cloud Run
    COPY ./mavito-common-lib /app/mavito-common-lib
    # Install the common library in editable mode during the build process
    RUN pip install --no-cache-dir -e /app/mavito-common-lib

    # Copy the entire migrations directory (includes alembic.ini and migration scripts)
    COPY ./migrations /app/migrations

    # Copy the entrypoint script
    COPY ./alembic-service/entrypoint.sh /app/entrypoint.sh
    # Make it executable inside the container
    RUN sed -i 's/\r$//' /app/entrypoint.sh
    RUN chmod +x /app/entrypoint.sh

    # Set the entrypoint for the container
    ENTRYPOINT ["/app/entrypoint.sh"]

    # CMD can be removed if the entrypoint handles all actions, or kept for default behavior
    CMD ["sleep", "infinity"]
    