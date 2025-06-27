import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from google.cloud import storage
from mavito_common.core.config import settings
from app.api import deps
from mavito_common.models.user import User as UserModel

router = APIRouter()


class SignedUrlRequest(BaseModel):
    content_type: str
    filename: str


class SignedUrlResponse(BaseModel):
    upload_url: str
    gcs_key: str  # The unique path where the file will be stored


@router.post("/generate-signed-url", response_model=SignedUrlResponse)
def generate_signed_url(
    request_body: SignedUrlRequest,
    # This dependency now protects the endpoint and provides the current user model.
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Generates a temporary, secure URL that allows an authenticated user to upload
    a file directly to a private Google Cloud Storage bucket.
    """
    try:
        # NOTE: For this to work in production, your Cloud Run service must have
        # the "Storage Object Admin" role for your GCS bucket.
        storage_client = storage.Client()

        # This GCS_BUCKET_NAME should be set as an environment variable in production
        bucket_name = settings.GCS_BUCKET_NAME
        bucket = storage_client.bucket(bucket_name)

        # Create a unique key (path) for the file in the bucket,
        # associating it with the user's ID for organization and security.
        unique_file_key = f"linguist-applications/{current_user.id}/{uuid.uuid4()}-{request_body.filename}"

        blob = bucket.blob(unique_file_key)

        url = blob.generate_signed_url(
            version="v4",
            method="PUT",
            expiration=timedelta(minutes=15),
            content_type=request_body.content_type,
        )

        return SignedUrlResponse(upload_url=url, gcs_key=unique_file_key)

    except Exception as e:
        # Log the full error for debugging
        print(f"Error generating signed URL: {e}")
        raise HTTPException(status_code=500, detail="Could not generate upload URL.")
