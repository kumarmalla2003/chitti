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
    
    # Variable Chit: different amounts before and after receiving payout
    installment_before_payout: int = Field(default=0)
    installment_after_payout: int = Field(default=0)
    
    # Relationships
    payouts: List["Payout"] = Relationship(back_populates="chit")
    collections: List["Collection"] = Relationship(back_populates="chit")