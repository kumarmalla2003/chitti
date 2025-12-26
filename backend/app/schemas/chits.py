# backend/app/schemas/chits.py

from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List, Optional
from datetime import date, datetime
from enum import Enum


class ChitTypeEnum(str, Enum):
    """Enum for chit types."""
    FIXED = "fixed"
    VARIABLE = "variable"
    AUCTION = "auction"


class ChitNested(BaseModel):
    """Minimal chit info needed for nested responses."""
    id: int
    start_date: date
    end_date: date
    name: str = Field(..., min_length=3, max_length=50)
    chit_type: str = "fixed"
    chit_value: int = 0
    size: int = 0
    base_contribution: int = 0
    premium_contribution: int = 0
    payout_premium_percent: float = 0.0
    foreman_commission_percent: float = 0.0
    notes: Optional[str] = Field(default=None, max_length=1000000)
    
    model_config = ConfigDict(from_attributes=True)


# ============================================
# READ SCHEMA - No validation (for DB reads)
# ============================================
class ChitRead(BaseModel):
    """Base schema for reading chits from DB - no contribution validation."""
    name: str
    chit_value: int
    size: int
    duration_months: int
    start_date: date
    collection_day: int = Field(..., ge=1, le=27)
    payout_day: int = Field(..., ge=1, le=28)
    
    # Chit type and contribution fields (no validation)
    chit_type: str = "fixed"
    base_contribution: int = 0
    premium_contribution: int = 0
    payout_premium_percent: float = 0.0
    foreman_commission_percent: float = 0.0
    notes: Optional[str] = Field(default=None, max_length=1000000)


# ============================================
# WRITE SCHEMAS - With validation (for Create/Update)
# ============================================
class ChitBase(BaseModel):
    """Base schema for creating/updating chits - WITH validation."""
    name: str = Field(..., min_length=3, max_length=50)
    chit_value: int = Field(..., ge=10000, le=1000000000)
    size: int = Field(..., ge=10, le=100)
    duration_months: int = Field(..., ge=10, le=100)
    start_date: date
    collection_day: int = Field(..., ge=1, le=27)
    payout_day: int = Field(..., ge=1, le=28)
    
    # Chit type field
    chit_type: str = Field(default="fixed")
    
    # Contribution fields
    # For Fixed: base_contribution = monthly installment (set by user)
    # For Variable/Auction: calculated from chit_value/size
    base_contribution: int = Field(default=0, ge=0, le=100000000)
    premium_contribution: int = Field(default=0, ge=0, le=100000000)
    
    # Variable Chit: percentage for premium calculation
    payout_premium_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    
    # Auction/Variable Chit: Foreman Commission percentage
    foreman_commission_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    
    # Optional notes field
    notes: Optional[str] = Field(default=None, max_length=1000000)

    @model_validator(mode='after')
    def validate_chit(self) -> 'ChitBase':
        # Validate start_date range (01/2000 - 12/2999)
        if self.start_date is not None:
            if self.start_date.year < 2000:
                raise ValueError('Start date cannot be before 01/2000.')
            if self.start_date.year > 2999:
                raise ValueError('Start date cannot be after 12/2999.')
        
        # Validate collection_day < payout_day (same day NOT allowed)
        if self.collection_day is not None and self.payout_day is not None:
            if self.collection_day >= self.payout_day:
                raise ValueError('Collection day must be before the payout day.')
        
        # Validate contribution fields based on chit_type
        if self.chit_type == "fixed":
            if self.base_contribution <= 0:
                raise ValueError('Base contribution is required for Fixed chits.')
            if self.base_contribution < 1000:
                raise ValueError('Base contribution must be at least ₹1,000 for Fixed chits.')
        elif self.chit_type == "variable":
            # Payout premium is required for Variable chits (must be >= 0.5)
            if self.payout_premium_percent is None or self.payout_premium_percent <= 0:
                raise ValueError('Payout premium is required for Variable chits.')
            if self.payout_premium_percent < 0.5:
                raise ValueError('Payout premium must be at least 0.5% for Variable chits.')
            # Foreman commission is required for Variable chits (must be >= 0.5)
            if self.foreman_commission_percent is None or self.foreman_commission_percent <= 0:
                raise ValueError('Foreman commission is required for Variable chits.')
            if self.foreman_commission_percent < 0.5:
                raise ValueError('Foreman commission must be at least 0.5% for Variable chits.')
        elif self.chit_type == "auction":
            # Foreman commission is required for Auction chits (must be >= 0.5)
            if self.foreman_commission_percent is None or self.foreman_commission_percent <= 0:
                raise ValueError('Foreman commission is required for Auction chits.')
            if self.foreman_commission_percent < 0.5:
                raise ValueError('Foreman commission must be at least 0.5% for Auction chits.')
        
        return self


class ChitCreate(ChitBase):
    pass


class ChitUpdate(ChitBase):
    pass


class ChitPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=50)
    chit_value: Optional[int] = Field(default=None, ge=10000, le=1000000000)
    size: Optional[int] = Field(default=None, ge=10, le=100)
    duration_months: Optional[int] = Field(default=None, ge=10, le=100)
    start_date: Optional[date] = None
    collection_day: Optional[int] = Field(default=None, ge=1, le=27)
    payout_day: Optional[int] = Field(default=None, ge=1, le=28)
    
    # Chit type and contribution fields
    chit_type: Optional[str] = None
    base_contribution: Optional[int] = Field(default=None, ge=0, le=100000000)
    premium_contribution: Optional[int] = Field(default=None, ge=0, le=100000000)
    payout_premium_percent: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    foreman_commission_percent: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    notes: Optional[str] = Field(default=None, max_length=1000000)

    @model_validator(mode='after')
    def validate_chit_patch(self) -> 'ChitPatch':
        # Validate start_date range (01/2000 - 12/2999)
        if self.start_date is not None:
            if self.start_date.year < 2000:
                raise ValueError('Start date cannot be before 01/2000.')
            if self.start_date.year > 2999:
                raise ValueError('Start date cannot be after 12/2999.')
        
        # Validate collection_day < payout_day (same day NOT allowed)
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
    members_count: int = 0  # Number of assigned slots for this chit
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ChitListResponse(BaseModel):
    chits: List[ChitResponse]


class AuctionRequest(BaseModel):
    """Schema for recording an auction for a specific month."""
    month: int = Field(..., ge=1, le=100)
    bid_amount: int = Field(..., ge=0)
    member_id: int = Field(..., ge=1)  # The winner of the auction