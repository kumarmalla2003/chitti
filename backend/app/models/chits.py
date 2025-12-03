# backend/app/models/chits.py

from typing import Optional, List, TYPE_CHECKING
from datetime import date
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.collections import Collection
    from app.models.payouts import Payout 

class Chit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=50)
    chit_value: int
    size: int
    monthly_installment: int
    duration_months: int
    start_date: date
    end_date: date
    collection_day: int = Field(ge=1, le=28)
    payout_day: int = Field(ge=1, le=28)
    
    # Relationships
    payouts: List["Payout"] = Relationship(back_populates="chit")
    collections: List["Collection"] = Relationship(back_populates="chit")