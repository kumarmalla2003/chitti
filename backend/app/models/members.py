# backend/app/models/members.py

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.slots import ChitSlot


class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(index=True, min_length=3, max_length=100)
    phone_number: str = Field(unique=True, index=True, min_length=10, max_length=10)
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    # Relationships
    # Payments are accessed via slots, not directly
    slots: List["ChitSlot"] = Relationship(back_populates="member")
