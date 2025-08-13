import uuid
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from google.cloud import storage
from mavito_common.core.config import settings
from app.api import deps  # noqa: F401
from mavito_common.models.user import User as UserModel
from app.api.deps import get_current_active_user

router = APIRouter()


class SignedUrlRequest(BaseModel):
    content_type: str
    filename: str


class SignedUrlResponse(BaseModel):
    upload_url: str
    gcs_key: str


@router.post(
    "/generate-signed-url",
    response_model=SignedUrlResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a signed URL for a file upload",
    description="Generates a signed URL that allows a client to upload a file directly to Google Cloud Storage.",
)
async def generate_signed_url(
    request: SignedUrlRequest,
    current_user: UserModel = Depends(get_current_active_user),
):
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(settings.GCS_BUCKET_NAME)

        gcs_key = f"uploads/{current_user.id}/{uuid.uuid4()}-{request.filename}"
        blob = bucket.blob(gcs_key)

        expiration_time = datetime.now() + timedelta(minutes=15)
        upload_url = blob.generate_signed_url(
            version="v4",
            expiration=expiration_time,
            method="PUT",
            content_type=request.content_type,
        )

        return SignedUrlResponse(upload_url=upload_url, gcs_key=gcs_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating the signed URL: {e}",
        )
