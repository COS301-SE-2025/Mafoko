# app/schemas/term.py
from pydantic import BaseModel, UUID4
from typing import List


class TermBase(BaseModel):
    id: UUID4
    term: str
    definition: str
    language: str
    domain: str
    part_of_speech: str
    translations: List[UUID4]
    example: str
    related_terms: List[UUID4]
    upvotes: int
    downvotes: int
    comments: List[str]


# Response model for GET requests
class Term(TermBase):
    pass


# Model used for creating a new term
class TermCreate(BaseModel):
    term: str
    definition: str
    language: str
    domain: str
    part_of_speech: str
    # IDs to the other terms (UUID)
    translations: List[UUID4] = []
    example: str = ""
    # Also a list of at most 3 UUIDs
    related_terms: List[UUID4] = []
    comments: List[str] = []
