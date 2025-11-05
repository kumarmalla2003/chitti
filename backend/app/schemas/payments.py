# backend/app/schemas/payments.py

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date
# Import schemas for nesting
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitGroupResponse

# --- Base Schema ---
class PaymentBase(BaseModel):
    amount_paid: float
    payment_date: date
    payment_method: str
    notes: Optional[str] = None
    chit_assignment_id: int

# --- Create Schema ---
class PaymentCreate(PaymentBase):
    pass

# --- Update Schema ---
class PaymentUpdate(BaseModel):
    amount_paid: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

# --- MODIFIED Public Response Schema ---
class PaymentPublic(PaymentBase):
    id: int
    chit_month: date  # <-- ADDED THIS LINE
    
    # Nest the full objects for the UI
    member: Optional[MemberPublic] = None 
    chit: Optional[ChitResponse] = None

    model_config = ConfigDict(from_attributes=True)

# --- List Response Schema ---
class PaymentListResponse(BaseModel):
    payments: List[PaymentPublic]