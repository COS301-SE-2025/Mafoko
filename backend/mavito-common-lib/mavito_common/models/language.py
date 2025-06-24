# app/models/language.py
from sqlalchemy import String, Boolean, CHAR
from sqlalchemy.orm import Mapped, mapped_column
from mavito_common.db.base_class import Base
from typing import Optional  # For nullable fields


class Language(Base):
    # __tablename__ will be 'languages' due to Base class logic

    code: Mapped[str] = mapped_column(CHAR(3), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    native_name: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # Optional since nullable=True
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
