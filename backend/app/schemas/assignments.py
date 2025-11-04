# app/schemas/assignments.py

from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import List
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitGroupResponse # <-- ChitGroupNested is no longer needed here

class ChitAssignmentBase(BaseModel):
    member_id: int
    chit_group_id: int
    chit_month: date

class ChitAssignmentCreate(ChitAssignmentBase):
    pass

# --- AssignmentNestedInMember schema has been REMOVED from this file ---

class ChitAssignmentPublic(BaseModel):
    id: int
    chit_month: date
    member: MemberPublic
    chit_group: ChitGroupResponse

    # --- ADD THESE NEW FIELDS ---
    total_paid: float
    due_amount: float
    payment_status: str # "Paid", "Partial", "Unpaid"
    # --- END OF ADDITIONS ---

    model_config = ConfigDict(from_attributes=True)

class ChitAssignmentListResponse(BaseModel):
    assignments: List[ChitAssignmentPublic]

class UnassignedMonthResponse(BaseModel):
    available_months: List[date]

# --- ADD NEW SCHEMAS FOR BULK ASSIGNMENT ---

class ChitAssignmentBulkItem(BaseModel):
    """Schema for a single item in a bulk assignment request."""
    member_id: int
    chit_month: date

class ChitAssignmentBulkCreate(BaseModel):
    """Schema for the bulk assignment request body."""
    assignments: List[ChitAssignmentBulkItem]