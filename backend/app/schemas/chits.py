# backend/app/schemas/chits.py

from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List, Optional
from datetime import date
from enum import Enum


class ChitTypeEnum(str, Enum):
    """Enum for chit types."""
    FIXED = "fixed"
    VARIABLE = "variable"
    AUCTION = "auction"


class ChitNested(BaseModel):
    """Minimal chit info needed for nested responses."""
    start_date: date
    end_date: date
    name: str
    chit_type: str = "fixed"
    monthly_installment: int = 0
    installment_before_payout: int = 0
    installment_after_payout: int = 0
    model_config = ConfigDict(from_attributes=True)


# ============================================
# READ SCHEMA - No validation (for DB reads)
# ============================================
class ChitRead(BaseModel):
    """Base schema for reading chits from DB - no installment validation."""
    name: str
    chit_value: int
    size: int
    duration_months: int
    start_date: date
    collection_day: int = Field(..., ge=1, le=28)
    payout_day: int = Field(..., ge=1, le=28)
    
    # Chit type and installment fields (no validation)
    chit_type: str = "fixed"
    monthly_installment: int = 0
    installment_before_payout: int = 0
    installment_after_payout: int = 0


# ============================================
# WRITE SCHEMAS - With validation (for Create/Update)
# ============================================
class ChitBase(BaseModel):
    """Base schema for creating/updating chits - WITH installment validation."""
    name: str
    chit_value: int
    size: int
    duration_months: int
    start_date: date
    collection_day: int = Field(..., ge=1, le=28)
    payout_day: int = Field(..., ge=1, le=28)
    
    # Chit type field
    chit_type: str = Field(default="fixed")
    
    # Installment fields (validated based on chit_type)
    monthly_installment: int = Field(default=0)
    installment_before_payout: int = Field(default=0)
    installment_after_payout: int = Field(default=0)

    @model_validator(mode='after')
    def validate_chit(self) -> 'ChitBase':
        # Validate collection_day < payout_day
        if self.collection_day is not None and self.payout_day is not None:
            if self.collection_day >= self.payout_day:
                raise ValueError('Collection day must be before the payout day.')
        
        # Validate installment fields based on chit_type
        if self.chit_type == "fixed":
            if self.monthly_installment <= 0:
                raise ValueError('Monthly installment is required for Fixed chits.')
        elif self.chit_type == "variable":
            if self.installment_before_payout <= 0:
                raise ValueError('Pre-payout installment is required for Variable chits.')
            if self.installment_after_payout <= 0:
                raise ValueError('Post-payout installment is required for Variable chits.')
        # Auction chits: no installment validation needed
        
        return self


class ChitCreate(ChitBase):
    pass


class ChitUpdate(ChitBase):
    pass


class ChitPatch(BaseModel):
    name: Optional[str] = None
    chit_value: Optional[int] = None
    size: Optional[int] = None
    duration_months: Optional[int] = None
    start_date: Optional[date] = None
    collection_day: Optional[int] = Field(default=None, ge=1, le=28)
    payout_day: Optional[int] = Field(default=None, ge=1, le=28)
    
    # Chit type and installment fields
    chit_type: Optional[str] = None
    monthly_installment: Optional[int] = None
    installment_before_payout: Optional[int] = None
    installment_after_payout: Optional[int] = None

    @model_validator(mode='after')
    def check_collection_before_payout_patch(self) -> 'ChitPatch':
        collection_day = self.collection_day
        payout_day = self.payout_day
        if collection_day is not None and payout_day is not None and collection_day >= payout_day:
            raise ValueError('Collection day must be before the payout day.')
        return self


# ============================================
# RESPONSE SCHEMA - Uses ChitRead (no validation)
# ============================================
class ChitResponse(ChitRead):
    """Response schema - inherits from ChitRead to avoid validation on DB reads."""
    id: int
    end_date: date
    status: str
    chit_cycle: str
    model_config = ConfigDict(from_attributes=True)


class ChitListResponse(BaseModel):
    chits: List[ChitResponse]