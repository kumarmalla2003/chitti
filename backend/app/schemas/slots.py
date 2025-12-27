# backend/app/schemas/slots.py

from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from app.models.slots import SlotStatus
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitNested


class ChitSlotBase(BaseModel):
    """Base schema for chit slots."""
    month: int = Field(ge=1)
    payout_amount: Optional[int] = Field(default=None, ge=0)
    bid_amount: Optional[int] = None
    expected_contribution: Optional[int] = None  # For auction chits


class ChitSlotCreate(ChitSlotBase):
    """Schema for creating a slot (used internally when chit is created)."""
    chit_id: int = Field(ge=1)


class ChitSlotUpdate(BaseModel):
    """Schema for updating a slot (assigning member, recording auction, etc.)."""
    member_id: Optional[int] = None
    payout_amount: Optional[int] = None
    bid_amount: Optional[int] = None
    expected_contribution: Optional[int] = None
    status: Optional[SlotStatus] = None


class ChitSlotSimple(BaseModel):
    """Minimal slot info for nesting."""
    id: int
    month: int
    payout_amount: Optional[int] = None
    bid_amount: Optional[int] = None
    expected_contribution: Optional[int] = None
    status: SlotStatus = SlotStatus.SCHEDULED
    member_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ChitSlotResponse(ChitSlotBase):
    """Response schema for a slot with nested member info."""
    id: int
    chit_id: int
    status: SlotStatus = SlotStatus.SCHEDULED
    member_id: Optional[int] = None
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Nested info
    member: Optional[MemberPublic] = None
    
    # Computed payment fields (populated by API router)
    amount_paid: int = 0  # Sum of payout payment amounts
    paid_date: Optional[datetime] = None  # Date of most recent payment
    payment_method: Optional[str] = None  # Method of most recent payment
    notes: Optional[str] = None  # Notes from most recent payment

    model_config = ConfigDict(from_attributes=True)


class ChitSlotListResponse(BaseModel):
    """List response wrapper."""
    slots: List[ChitSlotResponse]


class ChitSlotPublic(BaseModel):
    """Public slot info with member and calculated fields for assignment list view."""
    id: int
    month: int
    payout_amount: Optional[int] = None
    bid_amount: Optional[int] = None
    expected_contribution: Optional[int] = None
    status: SlotStatus = SlotStatus.SCHEDULED
    member: Optional[MemberPublic] = None
    chit: Optional[ChitNested] = None  # Add chit info for member assignments view
    
    # Collection status for the member (calculated)
    total_paid: float = 0
    due_amount: float = 0
    collection_status: str = "Unpaid"
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ChitSlotListPublicResponse(BaseModel):
    """List response for public slot info."""
    slots: List[ChitSlotPublic]


class UnassignedMonthResponse(BaseModel):
    """Response for unassigned months."""
    available_months: List[int]


class SlotAssignmentRequest(BaseModel):
    """Request to assign a member to a slot."""
    member_id: int = Field(ge=1)


class BulkSlotAssignment(BaseModel):
    """Single item in bulk assignment request."""
    month: int = Field(ge=1)
    member_id: int = Field(ge=1)


class BulkSlotAssignmentRequest(BaseModel):
    """Request to assign multiple members to multiple slots."""
    assignments: List[BulkSlotAssignment]
