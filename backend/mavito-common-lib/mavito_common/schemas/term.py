# term.py
from __future__ import annotations
from pydantic import BaseModel, UUID4, ConfigDict, Field
from typing import TYPE_CHECKING, List, Optional
from datetime import datetime
from mavito_common.schemas.user import UserBase
from mavito_common.schemas.comment import CommentResponse

if TYPE_CHECKING:
    from mavito_common.schemas.term_application import TermApplicationRead  # noqa: F401


class TermVoteStats(BaseModel):
    upvotes: int = 0
    downvotes: int = 0
    user_vote: Optional[str] = None


class TermMultilingualFields(BaseModel):
    eng: Optional[str] = Field(None, max_length=4849)
    afr: Optional[str] = Field(None, max_length=2539)
    nbl: Optional[str] = Field(None, max_length=1630)
    xho: Optional[str] = Field(None, max_length=1526)
    zul: Optional[str] = Field(None, max_length=1527)
    nso: Optional[str] = Field(None, max_length=1628)
    sot: Optional[str] = Field(None, max_length=1324)
    tsn: Optional[str] = Field(None, max_length=1630)
    ssw: Optional[str] = Field(None, max_length=1224)
    ven: Optional[str] = Field(None, max_length=1224)
    tso: Optional[str] = Field(None, max_length=869)

    eng_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    eng_pos_or_descriptor_info: Optional[str] = Field(None)
    afr_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    afr_pos_or_descriptor_info: Optional[str] = Field(None)
    nbl_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    nbl_pos_or_descriptor_info: Optional[str] = Field(None)
    xho_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    xho_pos_or_descriptor_info: Optional[str] = Field(None)
    zul_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    zul_pos_or_descriptor_info: Optional[str] = Field(None)
    nso_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    nso_pos_or_descriptor_info: Optional[str] = Field(None)
    sot_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    sot_pos_or_descriptor_info: Optional[str] = Field(None)
    tsn_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    tsn_pos_or_descriptor_info: Optional[str] = Field(None)
    ssw_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    ssw_pos_or_descriptor_info: Optional[str] = Field(None)
    ven_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    ven_pos_or_descriptor_info: Optional[str] = Field(None)
    tso_pos_or_descriptor: Optional[str] = Field(None, max_length=50)
    tso_pos_or_descriptor_info: Optional[str] = Field(None)
    model_config = ConfigDict(from_attributes=True)


class TermBase(BaseModel):
    id: UUID4
    term: str
    definition: str
    language: str
    domain: str
    example: Optional[str] = None
    status: str  # From TermStatus enum
    created_at: datetime
    multilingual: TermMultilingualFields = Field(default_factory=TermMultilingualFields)


class TermCreate(BaseModel):
    term: str = Field(..., min_length=1, max_length=255)
    definition: str = Field(..., min_length=1)
    language: str = Field(..., min_length=2, max_length=50)
    domain: str = Field(..., min_length=1, max_length=100)
    example: Optional[str] = Field(None, max_length=1000)
    translations: List[UUID4] = []
    related_terms: List[UUID4] = []
    multilingual: Optional[TermMultilingualFields] = Field(None)


class Term(TermBase):
    owner: UserBase
    translations: List["Term"] = []
    related_terms: List["Term"] = []
    comments: List[CommentResponse] = []
    model_config = ConfigDict(from_attributes=True)


class TermDropdown(BaseModel):
    """
    A simplified schema for displaying a term in a dropdown list.
    """

    id: UUID4
    term: str
    language: str
    domain: str

    model_config = ConfigDict(from_attributes=True)


class TermRead(TermBase):
    """
    Pydantic model for reading a Term, breaking the recursion.
    """

    owner: UserBase
    translations: List[TermDropdown] = []
    related_terms: List[TermDropdown] = []
    comments: List[CommentResponse] = []

    model_config = ConfigDict(from_attributes=True)


Term.model_rebuild()
