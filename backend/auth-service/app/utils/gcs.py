import google.auth
import google.auth.transport.requests
from google.cloud import storage
from datetime import timedelta
from mavito_common.core.config import settings


def list_user_uploads(user_id: str) -> list[str]:
    storage_client = storage.Client()
    bucket = storage_client.bucket(settings.GCS_BUCKET_NAME)
    prefix = f"linguist-applications/{user_id}/"
    blobs = list(bucket.list_blobs(prefix=prefix))
    return [blob.name for blob in blobs]


def generate_download_url(gcs_key: str, expiration_minutes=15) -> str:
    storage_client = storage.Client()
    bucket = storage_client.bucket(settings.GCS_BUCKET_NAME)
    blob = bucket.blob(gcs_key)

    credentials, project_id = google.auth.default()
    credentials.refresh(google.auth.transport.requests.Request())

    if hasattr(credentials, "service_account_email"):
        return blob.generate_signed_url(
            version="v4",
            method="GET",
            expiration=timedelta(minutes=expiration_minutes),
            service_account_email=credentials.service_account_email,
            access_token=credentials.token,
        )
    else:
        raise RuntimeError(
            "Service account email not available in credentials for signed URL generation."
        )
