# backend/app/models/collections.py

from typing import Optional, TYPE_CHECKING
from datetime import date
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.assignments import ChitAssignment
    from app.models.members import Member
    from app.models.chits import Chit

class Collection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amount_paid: float
    collection_date: date
    collection_method: str = Field(max_length=50) # e.g., "Cash", "UPI"
    notes: Optional[str] = Field(default=None)

    # Foreign keys
    chit_assignment_id: int = Field(foreign_key="chitassignment.id")
    member_id: int = Field(foreign_key="member.id")
    chit_id: int = Field(foreign_key="chit.id")

    # Relationships
    assignment: "ChitAssignment" = Relationship(back_populates="collections")
    member: "Member" = Relationship(back_populates="collections")
    chit: "Chit" = Relationship(back_populates="collections")