# workspace-service/Dockerfile
FROM python:3.11-slim

# Set the standard working directory to /app
WORKDIR /app

COPY ./workspace-service/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./workspace-service/ /app/

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]