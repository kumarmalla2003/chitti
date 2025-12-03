# backend/app/schemas/payouts.py

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date
from app.schemas.members import MemberPublic 
from app.schemas.chits import ChitNested 

class PayoutBase(BaseModel):
    month: int
    planned_amount: float 

class PayoutUpdate(BaseModel):
    """Used for both planning (updating planned_amount) and recording the actual payment."""
    planned_amount: Optional[float] = None
    
    # Transaction Fields
    amount: Optional[float] = None
    paid_date: Optional[date] = None
    method: Optional[str] = None
    notes: Optional[str] = None
    member_id: Optional[int] = None
    chit_assignment_id: Optional[int] = None

class PayoutResponse(PayoutBase):
    id: int
    chit_id: int
    
    # Transaction Fields
    amount: Optional[float] = None
    paid_date: Optional[date] = None
    method: Optional[str] = None
    notes: Optional[str] = None
    member_id: Optional[int] = None
    chit_assignment_id: Optional[int] = None
    
    # Nested Info
    member: Optional[MemberPublic] = None
    chit: Optional[ChitNested] = None 

    model_config = ConfigDict(from_attributes=True)

class PayoutListResponse(BaseModel):
    payouts: List[PayoutResponse]