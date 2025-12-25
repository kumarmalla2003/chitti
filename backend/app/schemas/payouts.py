# backend/app/schemas/payouts.py

from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime, date
from app.models.payouts import PayoutStatus
from app.schemas.members import MemberPublic 
from app.schemas.chits import ChitNested 
from app.schemas.assignments import ChitAssignmentSimple

# --- Base Schema (for creating scheduled payout) ---
class PayoutBase(BaseModel):
    month: int = Field(ge=1)
    planned_amount: int = Field(default=0, ge=0)  # Amount in rupees
    bid_amount: Optional[int] = None

# --- Create Schema (for creating scheduled payout) ---
class PayoutCreate(PayoutBase):
    chit_id: int = Field(ge=1)

# --- Update Schema (for updating schedule details) ---
class PayoutUpdate(BaseModel):
    planned_amount: Optional[int] = None
    bid_amount: Optional[int] = None
    status: Optional[PayoutStatus] = None
    member_id: Optional[int] = None
    chit_assignment_id: Optional[int] = None

# --- Public Response Schema ---
class PayoutResponse(PayoutBase):
    id: int
    chit_id: int
    status: PayoutStatus = PayoutStatus.SCHEDULED
    
    member_id: Optional[int] = None
    chit_assignment_id: Optional[int] = None
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Nested Info
    member: Optional[MemberPublic] = None
    chit: Optional[ChitNested] = None 
    assignment: Optional[ChitAssignmentSimple] = None
    
    # --- Computed payment fields (populated by API router) ---
    amount: int = 0  # Sum of actual payment amounts
    paid_date: Optional[date] = None  # Date of most recent payment
    payment_method: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- List Response Schema ---
class PayoutListResponse(BaseModel):
    payouts: List[PayoutResponse]
