from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class BookmarkTermRequest(BaseModel):
    term_id: str


class BookmarkGlossaryRequest(BaseModel):
    domain: str
    description: Optional[str] = None


class BookmarkedTermResponse(BaseModel):
    id: str
    term_id: str
    term: str
    definition: str
    language: str
    domain: str
    bookmarked_at: str
    notes: Optional[str] = None


class BookmarkedGlossaryResponse(BaseModel):
    id: str
    domain: str
    term_count: int
    bookmarked_at: str
    description: Optional[str] = None
    notes: Optional[str] = None


class BookmarksResponse(BaseModel):
    terms: List[BookmarkedTermResponse]
    glossaries: List[BookmarkedGlossaryResponse]


class SearchBookmarksRequest(BaseModel):
    query: str
    type: Optional[str] = "all"  # "terms", "glossaries", or "all"
