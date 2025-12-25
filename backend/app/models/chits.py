# backend/app/models/chits.py

from typing import Optional, List, TYPE_CHECKING
from datetime import date, datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Text
import enum

if TYPE_CHECKING:
    from app.models.collections import Collection
    from app.models.payouts import Payout
    from app.models.payments import Payment
    from app.models.assignments import ChitAssignment


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class ChitType(str, enum.Enum):
    """Enum for chit types."""
    FIXED = "fixed"
    VARIABLE = "variable"
    AUCTION = "auction"


class Chit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=50)
    chit_value: int = Field(ge=10000, le=1000000000)  # ₹10K - ₹100Cr
    size: int = Field(ge=10, le=100)  # 10-100 members
    duration_months: int = Field(ge=10, le=100)  # 10-100 months
    start_date: date
    end_date: date
    collection_day: int = Field(ge=1, le=27)
    payout_day: int = Field(ge=1, le=28)
    
    # Chit Type - determines installment calculation behavior
    chit_type: ChitType = Field(default=ChitType.FIXED)
    
    # Fixed Chit: standard monthly installment
    monthly_installment: int = Field(default=0, ge=0, le=100000000)  # max ₹10Cr
    
    # Variable Chit: percentage applied to chit_value after payout
    payout_premium_percent: float = Field(default=0.0, ge=0, le=100)

    # Auction Chit: Foreman Commission percentage
    foreman_commission_percent: float = Field(default=0.0, ge=0, le=100)
    
    # Optional notes field (using TEXT type for large content)
    notes: Optional[str] = Field(default=None, sa_type=Text)
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relationships - cascade delete (when chit is deleted, related records are also deleted)
    payouts: List["Payout"] = Relationship(back_populates="chit", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    collections: List["Collection"] = Relationship(back_populates="chit", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    payments: List["Payment"] = Relationship(back_populates="chit", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    assignments: List["ChitAssignment"] = Relationship(back_populates="chit")
    
    # Helper methods for variable chit calculations
    def get_installment_before_payout(self) -> int:
        """Calculate installment for members who haven't received payout."""
        if self.chit_type == ChitType.VARIABLE:
            return int(self.chit_value / self.size) if self.size > 0 else 0
        return self.monthly_installment
    
    def get_installment_after_payout(self) -> int:
        """Calculate installment for members who have received payout."""
        if self.chit_type == ChitType.VARIABLE:
            base = self.chit_value / self.size if self.size > 0 else 0
            premium = self.chit_value * self.payout_premium_percent / 100
            return int(base + premium)
        return self.monthly_installment