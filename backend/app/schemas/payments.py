# backend/app/schemas/payments.py

from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import date, datetime
from app.models.payments import PaymentType, PaymentMethod
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitNested

# --- Create Schema (for creating a new payment) ---
class PaymentCreate(BaseModel):
    amount: int = Field(gt=0)  # Amount in rupees, must be positive
    date: date
    method: PaymentMethod = PaymentMethod.CASH
    notes: Optional[str] = None
    payment_type: PaymentType
    
    # Month number (required for all payments)
    month: int = Field(ge=1)
    
    # For payout payments only
    slot_id: Optional[int] = None
    
    # Required
    member_id: int = Field(ge=1)
    chit_id: int = Field(ge=1)

# --- Update Schema ---
class PaymentUpdate(BaseModel):
    amount: Optional[int] = None
    date: Optional[date] = None
    method: Optional[PaymentMethod] = None
    notes: Optional[str] = None

# --- Response Schema ---
class PaymentResponse(BaseModel):
    id: int
    amount: int  # Amount in rupees
    date: date
    method: PaymentMethod
    notes: Optional[str] = None
    payment_type: PaymentType
    
    month: int
    slot_id: Optional[int] = None
    member_id: int
    chit_id: int
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Nested info
    member: Optional[MemberPublic] = None
    chit: Optional[ChitNested] = None

    model_config = ConfigDict(from_attributes=True)

# --- List Response Schema ---
class PaymentListResponse(BaseModel):
    payments: List[PaymentResponse]
