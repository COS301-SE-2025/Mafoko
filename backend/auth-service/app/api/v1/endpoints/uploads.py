import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from google.cloud import storage
from mavito_common.core.config import settings
from app.api import deps
from mavito_common.models.user import User as UserModel

import google.auth
import google.auth.transport.requests

router = APIRouter()


class SignedUrlRequest(BaseModel):
    content_type: str
    filename: str


class SignedUrlResponse(BaseModel):
    upload_url: str
    gcs_key: str


@router.post("/generate-signed-url", response_model=SignedUrlResponse)
def generate_signed_url(
    request_body: SignedUrlRequest,
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    try:
        storage_client = storage.Client()

        bucket_name = settings.GCS_BUCKET_NAME
        bucket = storage_client.bucket(bucket_name)

        unique_file_key = f"linguist-applications/{current_user.id}/{uuid.uuid4()}-{request_body.filename}"

        blob = bucket.blob(unique_file_key)

        credentials, project_id = google.auth.default()
        credentials.refresh(google.auth.transport.requests.Request())

        if hasattr(credentials, "service_account_email"):
            url = blob.generate_signed_url(
                version="v4",
                method="PUT",
                expiration=timedelta(minutes=15),
                content_type=request_body.content_type,
                service_account_email=credentials.service_account_email,
                access_token=credentials.token,
            )
        else:
            raise RuntimeError(
                "Service account email not available in credentials for signed URL generation."
            )

        return SignedUrlResponse(upload_url=url, gcs_key=unique_file_key)

    except Exception as e:
        print(f"Error generating signed URL: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating signed URL: {e}")
