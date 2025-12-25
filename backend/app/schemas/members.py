# backend/app/schemas/members.py

from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from datetime import datetime
import re
from app.schemas.chits import ChitNested

# --- DEFINE NESTED ASSIGNMENT SCHEMA HERE ---
class AssignmentNestedInMember(BaseModel):
    """Minimal assignment info for nesting inside MemberPublic."""
    chit: ChitNested

    model_config = ConfigDict(from_attributes=True)
# --- END OF DEFINITION ---


# Basic Member Information
class MemberBase(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=10)
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Phone number must be exactly 10 digits')
        return v

class MemberCreate(MemberBase):
    pass

class MemberUpdate(MemberBase):
    pass

class MemberPatch(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    phone_number: Optional[str] = Field(default=None, min_length=10, max_length=10)
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r'^\d{10}$', v):
            raise ValueError('Phone number must be exactly 10 digits')
        return v


# --- MODIFICATION: This is the simple schema for nesting ---
class MemberPublic(MemberBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
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