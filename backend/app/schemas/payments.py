# backend/app/schemas/payments.py

from pydantic import BaseModel, ConfigDict, Field, computed_field
from typing import List, Optional, Any
from datetime import date, datetime
import datetime as dt
from app.models.payments import PaymentType, PaymentMethod
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitNested


# --- Create Schema (for creating a new payment) ---
class PaymentCreate(BaseModel):
    """
    Schema for creating a new payment.
    - slot_id: The member's assigned payout slot
    - collection_month: For collections only - which month's collection (1 to duration)
    """
    amount: int = Field(gt=0)  # Amount in rupees, must be positive
    date: date
    method: PaymentMethod = PaymentMethod.CASH
    notes: Optional[str] = None
    payment_type: PaymentType
    slot_id: int = Field(ge=1)  # Required - member's assigned payout slot
    collection_month: Optional[int] = Field(default=None, ge=1)  # For collections only


# --- Update Schema ---
class PaymentUpdate(BaseModel):
    """Only transaction details can be updated, not the slot reference."""
    amount: Optional[int] = None
    date: Optional[dt.date] = None
    method: Optional[PaymentMethod] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# --- Nested Slot Schema for Response (includes member and chit) ---
class SlotNestedWithRelations(BaseModel):
    """Slot info for payment response, including member and chit."""
    id: int
    month: int
    member_id: Optional[int] = None
    chit_id: int
    
    # Nested relationships from slot
    member: Optional[MemberPublic] = None
    chit: Optional[ChitNested] = None
    
    model_config = ConfigDict(from_attributes=True)


# --- Response Schema ---
class PaymentResponse(BaseModel):
    """
    Response schema for payments.
    Includes derived fields from slot for backwards compatibility.
    """
    id: int
    amount: int  # Amount in rupees
    date: date
    method: PaymentMethod
    notes: Optional[str] = None
    payment_type: PaymentType
    slot_id: int
    collection_month: Optional[int] = None  # For collections only
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Slot relationship (contains chit_id, member_id, month, member, chit)
    slot: Optional[SlotNestedWithRelations] = None
    
    # Derived fields for backwards compatibility with frontend
    # These are computed from the slot relationship
    @computed_field
    @property
    def month(self) -> int:
        return self.slot.month if self.slot else 0
    
    @computed_field
    @property
    def member_id(self) -> Optional[int]:
        return self.slot.member_id if self.slot else None
    
    @computed_field
    @property
    def chit_id(self) -> int:
        return self.slot.chit_id if self.slot else 0
    
    # Nested info derived from slot relationships for frontend compatibility
    @computed_field
    @property
    def member(self) -> Optional[MemberPublic]:
        return self.slot.member if self.slot else None
    
    @computed_field
    @property
    def chit(self) -> Optional[ChitNested]:
        return self.slot.chit if self.slot else None

    model_config = ConfigDict(from_attributes=True)


# --- List Response Schema ---
class PaymentListResponse(BaseModel):
    payments: List[PaymentResponse]
