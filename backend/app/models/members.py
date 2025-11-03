# backend/app/models/members.py

from typing import Optional, List, TYPE_CHECKING # <-- Modified
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING: # <-- ADDED
    from app.models.assignments import ChitAssignment
    from app.models.payments import Payment # <-- ADDED

class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(index=True, max_length=100)
    phone_number: str = Field(unique=True, index=True, max_length=15)

    assignments: List["ChitAssignment"] = Relationship(back_populates="member")
    
    # --- ADD THIS RELATIONSHIP ---
    payments: List["Payment"] = Relationship(back_populates="member")