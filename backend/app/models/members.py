# backend/app/models/members.py

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.assignments import ChitAssignment
    from app.models.collections import Collection
    from app.models.payouts import Payout
    from app.models.payments import Payment


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(index=True, min_length=3, max_length=100)
    phone_number: str = Field(unique=True, index=True, min_length=10, max_length=10)
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    # Relationships
    assignments: List["ChitAssignment"] = Relationship(back_populates="member")
    collections: List["Collection"] = Relationship(back_populates="member")
    payouts: List["Payout"] = Relationship(back_populates="member")
    payments: List["Payment"] = Relationship(back_populates="member")