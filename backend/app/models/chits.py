# backend/app/models/chits.py

from typing import Optional, List, TYPE_CHECKING
from datetime import date
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.payments import Payment

class Payout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    month: int
    payout_amount: float
    chit_id: Optional[int] = Field(default=None, foreign_key="chit.id")
    chit: "Chit" = Relationship(back_populates="payouts")

class Chit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=50)
    chit_value: int
    size: int # <-- RENAMED from group_size
    monthly_installment: int
    duration_months: int
    start_date: date
    end_date: date
    collection_day: int = Field(ge=1, le=28)
    payout_day: int = Field(ge=1, le=28)
    payouts: List["Payout"] = Relationship(back_populates="chit")
    
    # --- ADD THIS RELATIONSHIP ---
    payments: List["Payment"] = Relationship(back_populates="chit")