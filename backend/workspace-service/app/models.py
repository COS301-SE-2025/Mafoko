"""Simplified models for workspace service."""

from sqlalchemy import Column, String, Text, DateTime, UUID, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime
import enum

Base = declarative_base()


class Term(Base):
    __tablename__ = "terms"

    id = Column(UUID, primary_key=True, default=uuid4)
    term = Column(String(255), nullable=False)
    definition = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    domain = Column(String(100), nullable=False)
    example = Column(Text)


class BookmarkedTerm(Base):
    __tablename__ = "bookmarked_terms"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, nullable=False)
    term_id = Column(UUID, ForeignKey("terms.id"), nullable=False)
    notes = Column(Text)
    bookmarked_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    term = relationship("Term", backref="bookmarked_by")


class BookmarkedGlossary(Base):
    __tablename__ = "bookmarked_glossaries"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, nullable=False)
    domain = Column(String(100), nullable=False)
    notes = Column(Text)
    bookmarked_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class GroupType(enum.Enum):
    COLLECTION = "collection"
    STUDY_SET = "study_set"
    PROJECT = "project"


class ItemType(enum.Enum):
    TERM = "term"
    GLOSSARY = "glossary"


class WorkspaceGroup(Base):
    __tablename__ = "workspace_groups"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    group_type = Column(Enum(GroupType), nullable=False)
    color = Column(String(7))  # Hex color code
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship(
        "WorkspaceGroupItem", back_populates="group", cascade="all, delete-orphan"
    )


class WorkspaceGroupItem(Base):
    __tablename__ = "workspace_group_items"

    id = Column(UUID, primary_key=True, default=uuid4)
    group_id = Column(UUID, ForeignKey("workspace_groups.id"), nullable=False)
    item_type = Column(Enum(ItemType), nullable=False)
    term_id = Column(UUID, ForeignKey("terms.id"))
    domain = Column(String(100))
    added_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("WorkspaceGroup", back_populates="items")
    term = relationship("Term")
