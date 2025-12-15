# backend/app/models/chits.py

from typing import Optional, List, TYPE_CHECKING
from datetime import date
from sqlmodel import Field, SQLModel, Relationship
import enum

if TYPE_CHECKING:
    from app.models.collections import Collection
    from app.models.payouts import Payout


class ChitType(str, enum.Enum):
    """Enum for chit types."""
    FIXED = "fixed"
    VARIABLE = "variable"
    AUCTION = "auction"


class Chit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=50)
    chit_value: int
    size: int
    duration_months: int
    start_date: date
    end_date: date
    collection_day: int = Field(ge=1, le=28)
    payout_day: int = Field(ge=1, le=28)
    
    # Chit Type - determines installment calculation behavior
    chit_type: str = Field(default="fixed")  # "fixed", "variable", "auction"
    
    # Fixed Chit: standard monthly installment
    monthly_installment: int = Field(default=0)
    
    # Variable Chit: percentage applied to chit_value after payout
    # Before payout: chit_value / size
    # After payout: (chit_value / size) + (chit_value * payout_premium_percent / 100)
    # Variable Chit: percentage applied to chit_value after payout
    # Before payout: chit_value / size
    # After payout: (chit_value / size) + (chit_value * payout_premium_percent / 100)
    payout_premium_percent: float = Field(default=0.0)

    # Auction Chit: Foreman Commission percentage
    foreman_commission_percent: float = Field(default=0.0)
    
    # Optional notes field
    notes: Optional[str] = Field(default=None)
    
    # Relationships
    payouts: List["Payout"] = Relationship(back_populates="chit")
    collections: List["Collection"] = Relationship(back_populates="chit")
    
    # Helper methods for variable chit calculations
    def get_installment_before_payout(self) -> int:
        """Calculate installment for members who haven't received payout."""
        if self.chit_type == "variable":
            return int(self.chit_value / self.size) if self.size > 0 else 0
        return self.monthly_installment
    
    def get_installment_after_payout(self) -> int:
        """Calculate installment for members who have received payout."""
        if self.chit_type == "variable":
            base = self.chit_value / self.size if self.size > 0 else 0
            premium = self.chit_value * self.payout_premium_percent / 100
            return int(base + premium)
        return self.monthly_installment