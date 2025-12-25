# backend/app/models/payments.py

from typing import Optional, List, TYPE_CHECKING
from datetime import date, datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import CheckConstraint
import enum

if TYPE_CHECKING:
    from app.models.collections import Collection
    from app.models.payouts import Payout
    from app.models.members import Member
    from app.models.chits import Chit


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


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
    Each payment can be full or partial, linked to a Collection or Payout schedule.
    """
    __table_args__ = (
        CheckConstraint(
            "(payment_type = 'collection' AND collection_id IS NOT NULL AND payout_id IS NULL) OR "
            "(payment_type = 'payout' AND payout_id IS NOT NULL AND collection_id IS NULL)",
            name='ck_payment_type_fk_consistency'
        ),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Transaction details (amount in rupees)
    amount: int = Field(ge=0)
    date: date  # When payment was made
    method: PaymentMethod = Field(default=PaymentMethod.CASH)
    notes: Optional[str] = Field(default=None, max_length=1000)
    payment_type: PaymentType  # collection or payout
    
    # Link to schedule (one of these will be set based on payment_type)
    collection_id: Optional[int] = Field(default=None, foreign_key="collection.id")
    payout_id: Optional[int] = Field(default=None, foreign_key="payout.id")
    
    # Required references
    member_id: int = Field(foreign_key="member.id", ge=1)  # Who paid/received
    chit_id: int = Field(foreign_key="chit.id", ge=1)  # Which chit
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relationships
    collection: Optional["Collection"] = Relationship(back_populates="payments")
    payout: Optional["Payout"] = Relationship(back_populates="payments")
    member: "Member" = Relationship(back_populates="payments")
    chit: "Chit" = Relationship(back_populates="payments")
