# backend/app/schemas/chits.py

from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List, Optional
from datetime import date

class ChitNested(BaseModel):
    """Minimal chit info needed for nested responses."""
    start_date: date
    end_date: date
    name: str 
    model_config = ConfigDict(from_attributes=True)

class ChitBase(BaseModel):
    name: str
    chit_value: int
    size: int
    monthly_installment: int
    duration_months: int
    start_date: date
    collection_day: int = Field(..., ge=1, le=28)
    payout_day: int = Field(..., ge=1, le=28)

    @model_validator(mode='after')
    def check_collection_before_payout(self) -> 'ChitBase':
        collection_day = self.collection_day
        payout_day = self.payout_day
        if collection_day is not None and payout_day is not None and collection_day >= payout_day:
            raise ValueError('Collection day must be before the payout day.')
        return self

class ChitCreate(ChitBase):
    pass

class ChitUpdate(ChitBase):
    pass

class ChitPatch(BaseModel):
    name: Optional[str] = None
    chit_value: Optional[int] = None
    size: Optional[int] = None
    monthly_installment: Optional[int] = None
    duration_months: Optional[int] = None
    start_date: Optional[date] = None
    collection_day: Optional[int] = Field(default=None, ge=1, le=28)
    payout_day: Optional[int] = Field(default=None, ge=1, le=28)

    @model_validator(mode='after')
    def check_collection_before_payout_patch(self) -> 'ChitPatch':
        collection_day = self.collection_day
        payout_day = self.payout_day
        if collection_day is not None and payout_day is not None and collection_day >= payout_day:
            raise ValueError('Collection day must be before the payout day.')
        return self

class ChitResponse(ChitBase):
    id: int
    end_date: date
    status: str
    chit_cycle: str
    model_config = ConfigDict(from_attributes=True)

class ChitListResponse(BaseModel):
    chits: List[ChitResponse]