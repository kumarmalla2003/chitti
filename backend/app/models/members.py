# backend/app/models/members.py

from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.assignments import ChitAssignment
    from app.models.collections import Collection
    from app.models.payouts import Payout

class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(index=True, max_length=100)
    phone_number: str = Field(unique=True, index=True, max_length=15)

    assignments: List["ChitAssignment"] = Relationship(back_populates="member")
    collections: List["Collection"] = Relationship(back_populates="member")
    payouts: List["Payout"] = Relationship(back_populates="member")