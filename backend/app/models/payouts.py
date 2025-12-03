# backend/app/models/payouts.py

from typing import Optional, TYPE_CHECKING
from datetime import date
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.chits import Chit
    from app.models.members import Member
    from app.models.assignments import ChitAssignment

class Payout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    month: int
    
    # Scheduled/Planned Data
    planned_amount: float = Field(default=0.0) 
    
    # Actual Transaction Data (Nullable until paid)
    amount: Optional[float] = Field(default=None) # Actual paid amount
    paid_date: Optional[date] = Field(default=None)
    method: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None)
    
    # Foreign Keys
    chit_id: Optional[int] = Field(default=None, foreign_key="chit.id")
    member_id: Optional[int] = Field(default=None, foreign_key="member.id")
    chit_assignment_id: Optional[int] = Field(default=None, foreign_key="chitassignment.id")
    
    # Relationships
    chit: "Chit" = Relationship(back_populates="payouts")
    member: Optional["Member"] = Relationship(back_populates="payouts")
    assignment: Optional["ChitAssignment"] = Relationship(back_populates="payouts")