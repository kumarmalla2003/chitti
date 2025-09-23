# backend/app/models/members.py

from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(index=True, max_length=100)
    phone_number: str = Field(unique=True, index=True, max_length=15)

    assignments: List["ChitAssignment"] = Relationship(back_populates="member")