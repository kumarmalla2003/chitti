# backend/app/models/slots.py

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint
import enum

from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.chits import Chit
    from app.models.members import Member
    from app.models.payments import Payment


class SlotStatus(str, enum.Enum):
    """Status of a chit slot (payout status)."""
    SCHEDULED = "scheduled"  # Not yet paid out
    PARTIAL = "partial"      # Partially paid out
    PAID = "paid"            # Fully paid out
    OVERDUE = "overdue"      # Past due date, not fully paid


class ChitSlot(SQLModel, table=True):
    """
    Represents a single slot in a chit for a specific month.
    Merges the concepts of ChitAssignment and Payout:
    - Each chit has `duration_months` slots (one per month)
    - A member can be assigned to a slot (to receive the payout for that month)
    - Tracks payout amount, auction bid, and payment status
    
    For Auction chits, also stores the calculated expected_contribution per member
    for that month (since it varies based on the bid).
    """
    __table_args__ = (
        UniqueConstraint('chit_id', 'month', name='uq_slot_chit_month'),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    month: int = Field(ge=1)  # Which month number (1, 2, 3...)
    
    # Payout Data (in rupees)
    payout_amount: int = Field(default=0, ge=0)  # Expected payout to the winner
    bid_amount: Optional[int] = Field(default=None)  # Auction bid amount (for auction chits)
    
    # For Auction chits: per-member expected collection for this month
    # This varies monthly based on the bid, so it must be stored per-slot
    # For Fixed/Variable chits, this is NULL (use chit.base_contribution/premium_contribution)
    expected_contribution: Optional[int] = Field(default=None)
    
    # Status (computed from payments, but stored for query efficiency)
    status: SlotStatus = Field(default=SlotStatus.SCHEDULED)
    
    # Foreign Keys
    chit_id: int = Field(foreign_key="chit.id", ge=1)
    member_id: Optional[int] = Field(default=None, foreign_key="member.id")  # Assigned after auction/selection
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relationships
    chit: "Chit" = Relationship(back_populates="slots")
    member: Optional["Member"] = Relationship(back_populates="slots")
    payments: List["Payment"] = Relationship(back_populates="slot")
