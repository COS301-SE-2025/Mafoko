# Use a slim Python image as the base
FROM python:3.11-slim

WORKDIR /app

COPY ./mavito-common-lib /app/mavito-common-lib

RUN pip install --no-cache-dir -e /app/mavito-common-lib

COPY ./workspace-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ./workspace-service/app /app/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]



