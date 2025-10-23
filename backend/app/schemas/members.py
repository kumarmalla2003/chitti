# backend/app/schemas/members.py

from pydantic import BaseModel, ConfigDict
from typing import List, Optional

# Basic Member Information
class MemberBase(BaseModel):
    full_name: str
    phone_number: str

class MemberCreate(MemberBase):
    pass

class MemberUpdate(MemberBase):
    pass

# --- ADD THIS NEW SCHEMA ---
class MemberPatch(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None


# To display Member info without sensitive data
class MemberPublic(MemberBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class MemberListResponse(BaseModel):
    members: List[MemberPublic]

# Schema for searching members
class MemberSearchResponse(BaseModel):
    id: int
    full_name: str
    phone_number: str