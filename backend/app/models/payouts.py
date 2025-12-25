# backend/app/models/payouts.py

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint
import enum

if TYPE_CHECKING:
    from app.models.chits import Chit
    from app.models.members import Member
    from app.models.assignments import ChitAssignment
    from app.models.payments import Payment


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class PayoutStatus(str, enum.Enum):
    """Status of a payout schedule."""
    SCHEDULED = "scheduled"  # Not yet paid
    PARTIAL = "partial"      # Partially paid
    PAID = "paid"            # Fully paid
    OVERDUE = "overdue"      # Past due date, not fully paid


class Payout(SQLModel, table=True):
    """
    Payout schedule - what we plan to pay out to a member for a specific month.
    Actual payments are tracked in the Payment model.
    """
    __table_args__ = (
        UniqueConstraint('chit_id', 'month', name='uq_payout_chit_month'),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    month: int = Field(ge=1)  # Which month number (1, 2, 3...)
    
    # Scheduled/Planned Data (in rupees)
    planned_amount: int = Field(default=0, ge=0)
    bid_amount: Optional[int] = Field(default=None)  # Auction bid amount
    
    # Status (computed from payments, but stored for query efficiency)
    status: PayoutStatus = Field(default=PayoutStatus.SCHEDULED)
    
    # Foreign Keys
    chit_id: int = Field(foreign_key="chit.id", ge=1)
    member_id: Optional[int] = Field(default=None, foreign_key="member.id")  # Optional: assigned later
    chit_assignment_id: Optional[int] = Field(default=None, foreign_key="chitassignment.id")
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relationships
    chit: "Chit" = Relationship(back_populates="payouts")
    member: "Member" = Relationship(back_populates="payouts")
    assignment: "ChitAssignment" = Relationship(back_populates="payouts")
    payments: List["Payment"] = Relationship(back_populates="payout")