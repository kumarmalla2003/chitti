# backend/app/schemas/members.py

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.chits import ChitNested # <-- This import is correct

# --- DEFINE NESTED ASSIGNMENT SCHEMA HERE ---
class AssignmentNestedInMember(BaseModel):
    """Minimal assignment info for nesting inside MemberPublic."""
    chit: ChitNested

    model_config = ConfigDict(from_attributes=True)
# --- END OF DEFINITION ---


# Basic Member Information
class MemberBase(BaseModel):
    full_name: str
    phone_number: str

class MemberCreate(MemberBase):
    pass

class MemberUpdate(MemberBase):
    pass

class MemberPatch(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None


# --- MODIFICATION: This is the simple schema for nesting ---
class MemberPublic(MemberBase):
    id: int
    # The 'assignments' field is REMOVED from here to prevent MissingGreenlet errors
    model_config = ConfigDict(from_attributes=True)


# --- NEW: This is the complex schema for the main members list page ---
class MemberPublicWithAssignments(MemberPublic):
    assignments: List[AssignmentNestedInMember] = []


# --- MODIFICATION: This response now uses the complex schema ---
class MemberListResponse(BaseModel):
    members: List[MemberPublicWithAssignments]


# Schema for searching members
class MemberSearchResponse(BaseModel):
    id: int
    full_name: str
    phone_number: str