# backend/app/models/collections.py

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint
import enum

if TYPE_CHECKING:
    from app.models.assignments import ChitAssignment
    from app.models.members import Member
    from app.models.chits import Chit
    from app.models.payments import Payment


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class CollectionStatus(str, enum.Enum):
    """Status of a collection schedule."""
    SCHEDULED = "scheduled"  # Not yet collected
    PARTIAL = "partial"      # Partially collected
    COLLECTED = "collected"  # Fully collected
    OVERDUE = "overdue"      # Past due date, not fully collected


class Collection(SQLModel, table=True):
    """
    Collection schedule - what we expect to collect from a member for a specific month.
    Actual payments are tracked in the Payment model.
    """
    __table_args__ = (
        UniqueConstraint('chit_id', 'month', name='uq_collection_chit_month'),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    month: int = Field(ge=1)  # Which month number (1, 2, 3...)
    
    # Scheduled/Expected Data (in rupees)
    expected_amount: int = Field(default=0, ge=0)
    
    # Status (computed from payments, but stored for query efficiency)
    status: CollectionStatus = Field(default=CollectionStatus.SCHEDULED)

    # Foreign keys
    chit_id: int = Field(foreign_key="chit.id", ge=1)
    member_id: Optional[int] = Field(default=None, foreign_key="member.id")  # Optional: assigned later
    chit_assignment_id: Optional[int] = Field(default=None, foreign_key="chitassignment.id")
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    # Relationships
    assignment: "ChitAssignment" = Relationship(back_populates="collections")
    member: "Member" = Relationship(back_populates="collections")
    chit: "Chit" = Relationship(back_populates="collections")
    payments: List["Payment"] = Relationship(back_populates="collection")