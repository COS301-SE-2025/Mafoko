# app/schemas/token.py
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str  # Typically "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = (
        None  # "sub" (subject) is a standard JWT claim, typically user ID or email
    )
