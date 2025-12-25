# backend/app/models/auth.py

from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class AuthorizedPhone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone_number: str = Field(index=True, unique=True, max_length=15)
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Credential(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_pin: str
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)