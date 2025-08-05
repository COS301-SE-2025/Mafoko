from pydantic import BaseModel
from typing import List, Optional, Dict


class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None


class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class AddTermsToGroupRequest(BaseModel):
    term_ids: List[str]


class GroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    term_count: int
    items: Optional[List[Dict]] = None


class GroupWithTermsResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    terms: List[Dict]


class BulkDeleteRequest(BaseModel):
    group_ids: List[str]
