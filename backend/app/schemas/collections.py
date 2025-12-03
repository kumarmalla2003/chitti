# backend/app/schemas/collections.py

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitResponse

# --- Base Schema ---
class CollectionBase(BaseModel):
    amount_paid: float
    collection_date: date
    collection_method: str
    notes: Optional[str] = None
    chit_assignment_id: int

# --- Create Schema ---
class CollectionCreate(CollectionBase):
    pass

# --- Update Schema ---
class CollectionUpdate(BaseModel):
    amount_paid: Optional[float] = None
    collection_date: Optional[date] = None
    collection_method: Optional[str] = None
    notes: Optional[str] = None

# --- Public Response Schema ---
class CollectionPublic(CollectionBase):
    id: int
    chit_month: date
    
    member: Optional[MemberPublic] = None 
    chit: Optional[ChitResponse] = None

    model_config = ConfigDict(from_attributes=True)

# --- List Response Schema ---
class CollectionListResponse(BaseModel):
    collections: List[CollectionPublic]