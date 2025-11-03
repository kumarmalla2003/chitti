# backend/app/models/assignments.py

from typing import Optional, List, TYPE_CHECKING # <-- Modified
from sqlmodel import Field, SQLModel, Relationship
from datetime import date
from app.models.members import Member
from app.models.chits import ChitGroup

if TYPE_CHECKING: # <-- ADDED
    from app.models.payments import Payment # <-- ADDED

class ChitAssignment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chit_month: date

    member_id: int = Field(foreign_key="member.id")
    member: Member = Relationship(back_populates="assignments")

    chit_group_id: int = Field(foreign_key="chitgroup.id")
    chit_group: ChitGroup = Relationship()

    # --- ADD THIS RELATIONSHIP ---
    payments: List["Payment"] = Relationship(back_populates="assignment")