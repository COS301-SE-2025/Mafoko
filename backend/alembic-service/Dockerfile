FROM python:3.11-slim

WORKDIR /app

# Add these system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (optimizes layer caching)
COPY ./alembic-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the essential files (not the whole backend)
COPY ./migrations/alembic.ini .
COPY ./migrations/alembic /app/alembic
COPY ./alembic-service/entrypoint.sh .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]