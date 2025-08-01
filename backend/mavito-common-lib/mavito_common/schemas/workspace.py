# mavito-common-lib/mavito_common/schemas/workspace.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from mavito_common.models.workspace import GroupType, ItemType


# ========== BookmarkedTerm Schemas ==========


class BookmarkedTermBase(BaseModel):
    """Base schema for bookmarked terms"""
    term_id: uuid.UUID
    notes: Optional[str] = None


class BookmarkedTermCreate(BookmarkedTermBase):
    """Schema for creating a bookmarked term"""
    pass


class BookmarkedTermUpdate(BaseModel):
    """Schema for updating a bookmarked term"""
    notes: Optional[str] = None


class BookmarkedTermResponse(BaseModel):
    """Schema for bookmarked term response"""
    id: uuid.UUID
    user_id: uuid.UUID
    term_id: uuid.UUID
    notes: Optional[str]
    bookmarked_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookmarkedTermWithDetails(BookmarkedTermResponse):
    """Enriched response with term details for frontend"""
    term: Optional[str] = None
    definition: Optional[str] = None
    domain: Optional[str] = None
    language: Optional[str] = None
    example: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ========== BookmarkedGlossary Schemas ==========


class BookmarkedGlossaryBase(BaseModel):
    """Base schema for bookmarked glossaries"""
    domain: str
    notes: Optional[str] = None


class BookmarkedGlossaryCreate(BookmarkedGlossaryBase):
    """Schema for creating a bookmarked glossary"""
    pass


class BookmarkedGlossaryUpdate(BaseModel):
    """Schema for updating a bookmarked glossary"""
    notes: Optional[str] = None


class BookmarkedGlossaryResponse(BookmarkedGlossaryBase):
    """Schema for bookmarked glossary response"""
    id: uuid.UUID
    user_id: uuid.UUID
    bookmarked_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ========== WorkspaceGroup Schemas ==========

class WorkspaceGroupBase(BaseModel):
    """Base schema for workspace groups"""
    name: str
    description: Optional[str] = None
    group_type: GroupType
    color: Optional[str] = None  # Hex color code


class WorkspaceGroupCreate(WorkspaceGroupBase):
    """Schema for creating a workspace group"""
    pass


class WorkspaceGroupUpdate(BaseModel):
    """Schema for updating a workspace group"""
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class WorkspaceGroupResponse(WorkspaceGroupBase):
    """Schema for workspace group response"""
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    items: List["WorkspaceGroupItemResponse"] = []

    model_config = ConfigDict(from_attributes=True)


# ========== WorkspaceGroupItem Schemas ==========

class WorkspaceGroupItemBase(BaseModel):
    """Base schema for workspace group items"""
    item_type: ItemType
    term_id: Optional[uuid.UUID] = None
    domain: Optional[str] = None


class WorkspaceGroupItemCreate(WorkspaceGroupItemBase):
    """Schema for creating a workspace group item"""
    group_id: uuid.UUID


class WorkspaceGroupItemUpdate(BaseModel):
    """Schema for updating a workspace group item"""
    notes: Optional[str] = None


class WorkspaceGroupItemBulkCreate(BaseModel):
    """Schema for bulk creating workspace group items"""
    term_ids: List[uuid.UUID]


class WorkspaceGroupItemResponse(WorkspaceGroupItemBase):
    """Schema for workspace group item response"""
    id: uuid.UUID
    group_id: uuid.UUID
    added_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ========== Search Schemas ==========

class SearchTermsRequest(BaseModel):
    """Schema for searching terms"""
    query: str
    category: Optional[str] = None


class SearchTermsResponse(BaseModel):
    """Schema for search terms response"""
    results: List[Dict[str, Any]]
    total: int

    model_config = ConfigDict(from_attributes=True)


# ========== Bulk Operations ==========

class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete operations"""
    ids: List[uuid.UUID]


# ========== Overview Response ==========

class WorkspaceOverviewResponse(BaseModel):
    """Schema for workspace overview"""
    bookmarked_terms_count: int
    bookmarked_glossaries_count: int
    groups_count: int
    recent_bookmarks: List[BookmarkedTermWithDetails]
    recent_groups: List[WorkspaceGroupResponse]

    model_config = ConfigDict(from_attributes=True)
