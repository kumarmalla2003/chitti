# backend/app/models/chits.py

from typing import Optional, List, TYPE_CHECKING
from datetime import date, datetime
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Text
import enum

from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.slots import ChitSlot
    from app.models.payments import Payment


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
    
    # Chit Type - determines contribution calculation behavior
    chit_type: ChitType = Field(default=ChitType.FIXED)
    
    # Contribution fields (in rupees)
    # - Fixed chit: base_contribution = premium_contribution = monthly installment
    # - Variable chit: base_contribution = chit_value/size, premium_contribution = base + (chit_value * premium%)
    # - Auction chit: base_contribution = chit_value/size, premium_contribution = same (contributions stored per-slot)
    base_contribution: int = Field(default=0, ge=0, le=100000000)  # max ₹10Cr
    premium_contribution: int = Field(default=0, ge=0, le=100000000)  # max ₹10Cr
    
    # Variable Chit: percentage applied to chit_value for premium calculation
    payout_premium_percent: float = Field(default=0.0, ge=0, le=100)

    # Auction/Variable Chit: Foreman Commission percentage
    foreman_commission_percent: float = Field(default=0.0, ge=0, le=100)
    
    # Optional notes field (using TEXT type for large content)
    notes: Optional[str] = Field(default=None, sa_type=Text)
    
    # Audit timestamps
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    
    # Relationships - cascade delete (when chit is deleted, related records are also deleted)
    slots: List["ChitSlot"] = Relationship(back_populates="chit", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    payments: List["Payment"] = Relationship(back_populates="chit", sa_relationship_kwargs={"cascade": "all, delete-orphan"})