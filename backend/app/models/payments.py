# backend/app/models/payments.py

from typing import Optional, TYPE_CHECKING
from datetime import date, datetime
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Index
import enum

from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.slots import ChitSlot


class PaymentType(str, enum.Enum):
    """Type of payment transaction."""
    COLLECTION = "collection"  # Money IN from member to chit
    PAYOUT = "payout"          # Money OUT from chit to member


class PaymentMethod(str, enum.Enum):
    """Payment method options."""
    CASH = "cash"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"
    CHEQUE = "cheque"
    OTHER = "other"


class Payment(SQLModel, table=True):
    """
    Tracks all actual payment transactions.
    Each payment can be full or partial.
    
    All payments (both Collections and Payouts) are linked via slot_id.
    The slot contains: chit_id, member_id, and month - single source of truth.
    """
    __table_args__ = (
        # Index for common query patterns
        Index('ix_payment_slot', 'slot_id'),
        Index('ix_payment_slot_type', 'slot_id', 'payment_type'),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Transaction details (amount in rupees, must be positive, max ₹10Cr)
    amount: int = Field(gt=0, le=100000000)
    date: date  # When payment was made
    method: PaymentMethod = Field(default=PaymentMethod.CASH)
    notes: Optional[str] = Field(default=None, max_length=1000)
    payment_type: PaymentType  # collection or payout
    
    # Link to slot - REQUIRED for all payments
    # The slot contains the member's assigned payout month
    slot_id: int = Field(foreign_key="chitslot.id", ge=1)
    
    # For collections: which month's collection this payment is for (1 to duration_months)
    # For payouts: NULL (not applicable)
    collection_month: Optional[int] = Field(default=None, ge=1, index=True)
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relationships
    slot: "ChitSlot" = Relationship(back_populates="payments")
