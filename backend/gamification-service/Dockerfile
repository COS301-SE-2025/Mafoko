FROM python:3.11-slim

WORKDIR /app

COPY ./mavito-common-lib /app/mavito-common-lib
RUN pip install --no-cache-dir -e /app/mavito-common-lib


COPY ./gamification-service/requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt


COPY ./gamification-service/app /app/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]