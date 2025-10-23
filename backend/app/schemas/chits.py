# backend/app/schemas/chits.py

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date

class ChitGroupBase(BaseModel):
    name: str
    chit_value: int
    group_size: int
    monthly_installment: int
    duration_months: int
    start_date: date

class ChitGroupCreate(ChitGroupBase):
    pass

class ChitGroupUpdate(ChitGroupBase):
    pass

# --- ADD THIS NEW SCHEMA ---
class ChitGroupPatch(BaseModel):
    name: Optional[str] = None
    chit_value: Optional[int] = None
    group_size: Optional[int] = None
    monthly_installment: Optional[int] = None
    duration_months: Optional[int] = None
    start_date: Optional[date] = None

class ChitGroupResponse(ChitGroupBase):
    id: int
    end_date: date
    status: str  # Added status field
    chit_cycle: str  # Added chit_cycle field

    model_config = ConfigDict(from_attributes=True)

class ChitGroupListResponse(BaseModel):
    groups: List[ChitGroupResponse]