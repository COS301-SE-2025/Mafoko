# mavito-common-lib/mavito_common/schemas/workspace.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

from mavito_common.models.workspace import GroupType, ItemType


# ========== BookmarkedTerm Schemas ==========


class BookmarkedTermBase(BaseModel):
    """Base schema for bookmarked terms"""

    term_id: uuid.UUID


class BookmarkedTermCreate(BookmarkedTermBase):
    """Schema for creating a bookmarked term"""

    pass


class BookmarkedTermResponse(BookmarkedTermBase):
    """Schema for bookmarked term response"""

    user_id: uuid.UUID
    bookmarked_at: datetime

    # Include term details for convenience
    term_name: Optional[str] = None
    term_definition: Optional[str] = None
    term_language: Optional[str] = None
    term_domain: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ========== BookmarkedGlossary Schemas ==========


class BookmarkedGlossaryBase(BaseModel):
    """Base schema for bookmarked glossaries"""

    domain: str


class BookmarkedGlossaryCreate(BookmarkedGlossaryBase):
    """Schema for creating a bookmarked glossary"""

    pass


class BookmarkedGlossaryResponse(BookmarkedGlossaryBase):
    """Schema for bookmarked glossary response"""

    user_id: uuid.UUID
    bookmarked_at: datetime

    # Include glossary metadata for convenience
    term_count: Optional[int] = None
    languages: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)


# ========== WorkspaceGroup Schemas ==========


class WorkspaceGroupBase(BaseModel):
    """Base schema for workspace groups"""

    name: str
    group_type: GroupType


class WorkspaceGroupCreate(WorkspaceGroupBase):
    """Schema for creating a workspace group"""

    pass


class WorkspaceGroupUpdate(BaseModel):
    """Schema for updating a workspace group"""

    name: Optional[str] = None
    group_type: Optional[GroupType] = None


class WorkspaceGroupResponse(WorkspaceGroupBase):
    """Schema for workspace group response"""

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    item_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ========== WorkspaceGroupItem Schemas ==========


class WorkspaceGroupItemBase(BaseModel):
    """Base schema for workspace group items"""

    item_id: str
    item_type: ItemType


class WorkspaceGroupItemCreate(WorkspaceGroupItemBase):
    """Schema for creating a workspace group item"""

    pass


class WorkspaceGroupItemResponse(WorkspaceGroupItemBase):
    """Schema for workspace group item response"""

    group_id: uuid.UUID
    added_at: datetime

    # Include item details for convenience
    item_name: Optional[str] = None
    item_details: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


# ========== Bulk Operations Schemas ==========


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete operations"""

    term_ids: Optional[List[uuid.UUID]] = None
    glossary_domains: Optional[List[str]] = None
    group_ids: Optional[List[uuid.UUID]] = None


class BulkDeleteResponse(BaseModel):
    """Schema for bulk delete response"""

    deleted_terms: int
    deleted_glossaries: int
    deleted_groups: int
    success: bool
    message: str


# ========== Search and Filter Schemas ==========


class SearchTermsRequest(BaseModel):
    """Schema for searching saved terms"""

    search_query: Optional[str] = None
    category: Optional[str] = None
    page: Optional[int] = 1
    limit: Optional[int] = 50


class SearchTermsResponse(BaseModel):
    """Schema for search terms response"""

    terms: List[BookmarkedTermResponse]
    total: int
    page: int
    limit: int
    pages: int


# ========== Workspace Overview Schemas ==========


class WorkspaceOverviewResponse(BaseModel):
    """Schema for complete workspace overview"""

    bookmarked_terms: List[BookmarkedTermResponse]
    bookmarked_glossaries: List[BookmarkedGlossaryResponse]
    workspace_groups: List[WorkspaceGroupResponse]
    total_terms: int
    total_glossaries: int
    total_groups: int
    categories: List[str]  # Unique categories from bookmarked terms


# ========== Category Schemas ==========


class CategoriesResponse(BaseModel):
    """Schema for categories response"""

    categories: List[str]
    total: int
