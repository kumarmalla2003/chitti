# app/schemas/assignments.py

from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import List, Optional
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitResponse

class ChitAssignmentBase(BaseModel):
    member_id: int = Field(..., ge=1)
    chit_id: int = Field(..., ge=1)
    chit_month: date

class ChitAssignmentCreate(ChitAssignmentBase):
    pass

class ChitAssignmentSimple(BaseModel):
    """Minimal assignment info for nesting."""
    id: int
    chit_month: date
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ChitAssignmentPublic(BaseModel):
    id: int
    chit_month: date
    member: MemberPublic
    chit: ChitResponse
    total_paid: float
    due_amount: float
    collection_status: str 
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ChitAssignmentListResponse(BaseModel):
    assignments: List[ChitAssignmentPublic]

class UnassignedMonthResponse(BaseModel):
    available_months: List[date]

class ChitAssignmentBulkItem(BaseModel):
    member_id: int = Field(..., ge=1)
    chit_month: date

class ChitAssignmentBulkCreate(BaseModel):
    assignments: List[ChitAssignmentBulkItem]