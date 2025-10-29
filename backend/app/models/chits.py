# backend/app/models/chits.py

from typing import Optional, List
from datetime import date
from sqlmodel import Field, SQLModel, Relationship

class Payout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    month: int
    payout_amount: float
    chit_group_id: Optional[int] = Field(default=None, foreign_key="chitgroup.id")
    chit_group: "ChitGroup" = Relationship(back_populates="payouts")

class ChitGroup(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=50)
    chit_value: int
    group_size: int
    monthly_installment: int
    duration_months: int
    start_date: date
    end_date: date
    collection_day: int = Field(ge=1, le=28)
    payout_day: int = Field(ge=1, le=28)
    payouts: List["Payout"] = Relationship(back_populates="chit_group")