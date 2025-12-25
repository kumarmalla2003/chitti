# backend/app/models/assignments.py

from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint
from datetime import date, datetime, timezone
from app.models.members import Member

if TYPE_CHECKING:
    from app.models.chits import Chit
    from app.models.collections import Collection
    from app.models.payouts import Payout


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class ChitAssignment(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint('member_id', 'chit_id', 'chit_month', name='uq_assignment_member_chit_month'),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    chit_month: date

    member_id: int = Field(foreign_key="member.id", ge=1)
    member: Member = Relationship(back_populates="assignments")

    chit_id: int = Field(foreign_key="chit.id", ge=1)
    chit: "Chit" = Relationship(back_populates="assignments")

    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    collections: List["Collection"] = Relationship(back_populates="assignment")
    payouts: List["Payout"] = Relationship(back_populates="assignment")