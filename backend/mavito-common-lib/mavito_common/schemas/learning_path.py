from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID


class LearningPathCreate(BaseModel):
    path_name: str = Field(..., min_length=3, max_length=100)
    language_name: str
    glossary_names: List[str]


class LearningPathGlossaryRead(BaseModel):
    glossary_name: str

    class Config:
        orm_mode = True


class LearningPathRead(BaseModel):
    id: UUID
    path_name: str
    language_name: str
    selected_glossaries: List[LearningPathGlossaryRead]
    completedPercentage: int

    class Config:
        orm_mode = True


class Word(BaseModel):
    id: UUID
    term: str
    definition: str
    english_translation: Optional[str] = None  # Add this field

    class Config:
        orm_mode = True


class StudySession(BaseModel):
    words: List[Word]
    knownWordIds: List[UUID]
    lastCardIndex: int
    retryPileIds: List[UUID] = []

    class Config:
        orm_mode = True
