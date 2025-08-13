from pydantic import BaseModel
from typing import Optional, Dict


class CreateNoteRequest(BaseModel):
    term_id: str
    content: str


class UpdateNoteRequest(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: str
    term_id: str
    content: str
    created_at: str
    updated_at: str
    term_info: Optional[Dict] = None


class UpdateBookmarkNoteRequest(BaseModel):
    bookmark_id: str
    notes: str
    bookmark_type: str  # "term" or "glossary"
