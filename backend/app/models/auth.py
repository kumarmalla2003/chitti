# backend/app/models/auth.py

from typing import Optional
from sqlmodel import Field, SQLModel

class AuthorizedPhone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone_number: str = Field(index=True, unique=True, max_length=15)

# Note: The 'chit_groups' relationship has been removed.

class Credential(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_pin: str