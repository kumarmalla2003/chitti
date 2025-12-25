# backend/app/schemas/collections.py

from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime, date
from app.models.collections import CollectionStatus
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitNested
from app.schemas.assignments import ChitAssignmentSimple

# --- Base Schema (for creating scheduled collection) ---
class CollectionBase(BaseModel):
    month: int = Field(default=1, ge=1)
    expected_amount: int = Field(default=0, ge=0)  # Amount in rupees

# --- Update Schema (for updating schedule details) ---
class CollectionUpdate(BaseModel):
    expected_amount: Optional[int] = None
    status: Optional[CollectionStatus] = None
    member_id: Optional[int] = None
    chit_assignment_id: Optional[int] = None

# --- Public Response Schema ---
class CollectionResponse(CollectionBase):
    id: int
    chit_id: int
    status: CollectionStatus = CollectionStatus.SCHEDULED
    
    member_id: Optional[int] = None
    chit_assignment_id: Optional[int] = None
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Nested info
    member: Optional[MemberPublic] = None 
    chit: Optional[ChitNested] = None
    assignment: Optional[ChitAssignmentSimple] = None
    
    # --- Computed payment fields (populated by API router) ---
    amount_paid: int = 0  # Sum of payment amounts (in rupees)
    collection_date: Optional[date] = None  # Date of the most recent payment
    collection_method: Optional[str] = None  # Method of most recent payment
    collection_status: str = "Unpaid"  # 'Paid', 'Partial', 'Unpaid'
    notes: Optional[str] = None  # Notes from most recent payment

    model_config = ConfigDict(from_attributes=True)

# --- List Response Schema ---
class CollectionListResponse(BaseModel):
    collections: List[CollectionResponse]
