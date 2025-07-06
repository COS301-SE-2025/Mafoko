FROM python:3.11-slim

# Install system deps
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y gettext-base && rm -rf /var/lib/apt/lists/*
RUN apt-get update && \
    apt-get install -y gcc git gettext-base && \
    rm -rf /var/lib/apt/lists/*

# Install common lib
COPY ./mavito-common-lib /mavito-common-lib
RUN pip install -e /mavito-common-lib

# Install requirements
COPY ./alembic-service/requirements.txt .
RUN pip install -r requirements.txt

# Copy migrations 
COPY ./migrations /app/migrations

WORKDIR /app
ENTRYPOINT ["alembic"]
CMD ["upgrade", "head"]