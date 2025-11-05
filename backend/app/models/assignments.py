# backend/app/models/assignments.py

from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from datetime import date
from app.models.members import Member
from app.models.chits import Chit # <-- IMPORT RENAMED

if TYPE_CHECKING:
    from app.models.payments import Payment

class ChitAssignment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chit_month: date

    member_id: int = Field(foreign_key="member.id")
    member: Member = Relationship(back_populates="assignments")

    chit_id: int = Field(foreign_key="chit.id") # <-- RENAMED
    chit: Chit = Relationship() # <-- RENAMED

    # --- ADD THIS RELATIONSHIP ---
    payments: List["Payment"] = Relationship(back_populates="assignment")