# backend/app/schemas/assignments.py

from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import List
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitGroupResponse

class ChitAssignmentBase(BaseModel):
    member_id: int
    chit_group_id: int
    chit_month: date

class ChitAssignmentCreate(ChitAssignmentBase):
    pass

class ChitAssignmentPublic(BaseModel):
    id: int
    chit_month: date
    member: MemberPublic
    chit_group: ChitGroupResponse

    model_config = ConfigDict(from_attributes=True)

class ChitAssignmentListResponse(BaseModel):
    assignments: List[ChitAssignmentPublic]

class UnassignedMonthResponse(BaseModel):
    available_months: List[date]