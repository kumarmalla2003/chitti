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

class ChitGroupResponse(ChitGroupBase):
    id: int
    end_date: date

    model_config = ConfigDict(from_attributes=True)

class ChitGroupListResponse(BaseModel):
    groups: List[ChitGroupResponse]