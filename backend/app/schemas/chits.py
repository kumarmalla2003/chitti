# backend/app/schemas/chits.py

from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List, Optional
from datetime import date

class ChitGroupBase(BaseModel):
    name: str
    chit_value: int
    group_size: int
    monthly_installment: int
    duration_months: int
    start_date: date
    collection_day: int = Field(..., ge=1, le=28)
    payout_day: int = Field(..., ge=1, le=28)

    @model_validator(mode='after')
    def check_collection_before_payout(self) -> 'ChitGroupBase':
        """Ensure collection_day is strictly less than payout_day."""
        collection_day = self.collection_day
        payout_day = self.payout_day
        if collection_day is not None and payout_day is not None and collection_day >= payout_day:
            raise ValueError('Collection day must be before the payout day.')
        return self

class ChitGroupCreate(ChitGroupBase):
    pass

class ChitGroupUpdate(ChitGroupBase):
    pass

class ChitGroupPatch(BaseModel):
    name: Optional[str] = None
    chit_value: Optional[int] = None
    group_size: Optional[int] = None
    monthly_installment: Optional[int] = None
    duration_months: Optional[int] = None
    start_date: Optional[date] = None
    collection_day: Optional[int] = Field(default=None, ge=1, le=28)
    payout_day: Optional[int] = Field(default=None, ge=1, le=28)

    @model_validator(mode='after')
    def check_collection_before_payout_patch(self) -> 'ChitGroupPatch':
        """Ensure collection_day is strictly less than payout_day if both are provided."""
        collection_day = self.collection_day
        payout_day = self.payout_day
        # Only validate if both fields are being updated in the patch
        if collection_day is not None and payout_day is not None and collection_day >= payout_day:
            raise ValueError('Collection day must be before the payout day.')
        return self


class ChitGroupResponse(ChitGroupBase):
    id: int
    end_date: date
    status: str  # Added status field
    chit_cycle: str  # Added chit_cycle field

    model_config = ConfigDict(from_attributes=True)

class ChitGroupListResponse(BaseModel):
    groups: List[ChitGroupResponse]