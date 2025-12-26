# backend/app/models/auth.py

from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

from app.core.utils import utc_now


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