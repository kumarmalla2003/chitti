# backend/app/schemas/chits.py

from pydantic import BaseModel, ConfigDict
from typing import List
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

class ChitGroupResponse(ChitGroupBase):
    id: int
    end_date: date
    status: str  # Added status field
    chit_cycle: str  # Added chit_cycle field

    model_config = ConfigDict(from_attributes=True)

class ChitGroupListResponse(BaseModel):
    groups: List[ChitGroupResponse]