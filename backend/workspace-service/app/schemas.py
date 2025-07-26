"""Simplified schemas for workspace service."""

from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models import GroupType, ItemType


# Bookmark Term Schemas
class BookmarkedTermCreate(BaseModel):
    term_id: UUID
    notes: Optional[str] = None


class BookmarkedTermResponse(BaseModel):
    id: UUID
    user_id: UUID
    term_id: UUID
    notes: Optional[str]
    bookmarked_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Enriched response with term details for frontend
class BookmarkedTermWithDetails(BaseModel):
    id: UUID
    user_id: UUID
    term_id: UUID
    notes: Optional[str]
    bookmarked_at: datetime
    created_at: datetime
    # Term details
    term: Optional[str] = None
    definition: Optional[str] = None
    domain: Optional[str] = None
    language: Optional[str] = None
    example: Optional[str] = None

    class Config:
        from_attributes = True


# Bookmark Glossary Schemas
class BookmarkedGlossaryCreate(BaseModel):
    domain: str
    notes: Optional[str] = None


class BookmarkedGlossaryResponse(BaseModel):
    id: UUID
    user_id: UUID
    domain: str
    notes: Optional[str]
    bookmarked_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Workspace Group Schemas
class WorkspaceGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    group_type: GroupType
    color: Optional[str] = None


class WorkspaceGroupItemCreate(BaseModel):
    item_type: ItemType
    term_id: Optional[UUID] = None
    domain: Optional[str] = None


class WorkspaceGroupItemResponse(BaseModel):
    id: UUID
    group_id: UUID
    item_type: ItemType
    term_id: Optional[UUID]
    domain: Optional[str]
    added_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class WorkspaceGroupResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    group_type: GroupType
    color: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[WorkspaceGroupItemResponse] = []

    class Config:
        from_attributes = True


# Search Schemas
class SearchTermsRequest(BaseModel):
    query: Optional[str] = None
    domain: Optional[str] = None
    language: Optional[str] = None
    page: int = 1
    limit: int = 20


class SearchTermsResponse(BaseModel):
    terms: List[dict]
    total: int
    page: int
    limit: int
    pages: int


# Bulk Operations
class BulkDeleteRequest(BaseModel):
    bookmark_ids: Optional[List[UUID]] = None
    group_ids: Optional[List[UUID]] = None


# Overview
class WorkspaceOverviewResponse(BaseModel):
    total_bookmarked_terms: int
    total_bookmarked_glossaries: int
    total_groups: int
    recent_terms: List[dict]
