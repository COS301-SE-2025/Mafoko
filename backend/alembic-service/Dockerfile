# alembic-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY ./alembic-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ./mavito-common-lib /app/mavito-common-lib-src


COPY ./migrations /app/migrations
COPY ./migrations/alembic.ini /app/alembic.ini

COPY ./alembic-service/entrypoint.sh /app/entrypoint.sh

RUN sed -i 's/\r$//' /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh


ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["sleep", "infinity"]
