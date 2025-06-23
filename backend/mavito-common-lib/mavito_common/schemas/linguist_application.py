from pydantic import BaseModel
from typing import Optional


class LinguistApplicationCreate(BaseModel):
    """
    Schema for the data required to create a new linguist application.
    This is what the frontend will send inside the registration payload.
    """

    id_document_url: str
    cv_document_url: str
    certifications_document_url: Optional[str] = None
    research_papers_document_url: Optional[str] = None


# We can add other schemas here later, e.g., for API responses.
# class LinguistApplication(LinguistApplicationCreate):
#     id: uuid.UUID
#     status: str
#     user_id: uuid.UUID
#     model_config = ConfigDict(from_attributes=True)
