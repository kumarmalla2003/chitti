# backend/app/models/chits.py

from typing import Optional
from datetime import date
from sqlmodel import Field, SQLModel

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