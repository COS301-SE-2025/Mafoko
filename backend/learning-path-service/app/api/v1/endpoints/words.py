from fastapi import APIRouter, Depends
from uuid import UUID  # noqa: F401

from app import deps
from mavito_common.schemas.user import User as UserSchema
from app.crud.crud_learning import crud_learning

# Import the schemas from the central file
from mavito_common.schemas.learning_path import StudySession

router = APIRouter()


@router.get(
    "/languages/{language_name}/glossaries/{glossary_name:path}/words",
    response_model=StudySession,
)
async def get_words_for_study_session(
    language_name: str,
    glossary_name: str,
    db: deps.AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Provides the words for a study session, including which ones the user already knows.
    """
    session_data = await crud_learning.get_words_for_glossary(
        db=db,
        user_id=current_user.id,
        language_name=language_name,
        glossary_name=glossary_name,
    )
    return session_data
