# backend/app/models/payments.py

from typing import Optional, TYPE_CHECKING
from datetime import date, datetime
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import CheckConstraint, Index
import enum

from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.slots import ChitSlot
    from app.models.members import Member
    from app.models.chits import Chit


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
    
    For COLLECTION payments:
      - Links via chit_id + member_id + month
      - slot_id is NULL
      
    For PAYOUT payments:
      - Links via slot_id (which has chit_id and member_id)
      - month can be derived from slot
    """
    __table_args__ = (
        CheckConstraint(
            "(payment_type = 'collection' AND slot_id IS NULL) OR "
            "(payment_type = 'payout' AND slot_id IS NOT NULL)",
            name='ck_payment_type_slot_consistency'
        ),
        # Composite indexes for common query patterns
        Index('ix_payment_chit_member_month', 'chit_id', 'member_id', 'month'),
        Index('ix_payment_chit_month', 'chit_id', 'month'),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Transaction details (amount in rupees, must be positive, max ₹10Cr)
    amount: int = Field(gt=0, le=100000000)
    date: date  # When payment was made
    method: PaymentMethod = Field(default=PaymentMethod.CASH)
    notes: Optional[str] = Field(default=None, max_length=1000)
    payment_type: PaymentType  # collection or payout
    
    # Month number (1, 2, 3...) - used for collection payments
    month: int = Field(ge=1)
    
    # Link to slot (for payout payments only)
    slot_id: Optional[int] = Field(default=None, foreign_key="chitslot.id")
    
    # Required references
    member_id: int = Field(foreign_key="member.id", ge=1)  # Who paid/received
    chit_id: int = Field(foreign_key="chit.id", ge=1)  # Which chit
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relationships
    slot: Optional["ChitSlot"] = Relationship(back_populates="payments")
    member: "Member" = Relationship(back_populates="payments")
    chit: "Chit" = Relationship(back_populates="payments")
