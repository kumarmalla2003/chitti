# backend/app/models/payments.py

from typing import Optional, List, TYPE_CHECKING
from datetime import date
from sqlmodel import Field, SQLModel, Relationship

# Use TYPE_CHECKING to avoid circular imports at runtime
if TYPE_CHECKING:
    from app.models.assignments import ChitAssignment
    from app.models.members import Member
    from app.models.chits import Chit # <-- IMPORT RENAMED

class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amount_paid: float
    payment_date: date
    payment_method: str = Field(max_length=50) # e.g., "Cash", "UPI"
    notes: Optional[str] = Field(default=None)

    # Foreign keys
    chit_assignment_id: int = Field(foreign_key="chitassignment.id")
    member_id: int = Field(foreign_key="member.id")
    chit_id: int = Field(foreign_key="chit.id") # <-- RENAMED

    # Relationships
    assignment: "ChitAssignment" = Relationship(back_populates="payments")
    member: "Member" = Relationship(back_populates="payments")
    chit: "Chit" = Relationship(back_populates="payments") # <-- RENAMED