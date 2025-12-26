# backend/app/schemas/month_members.py

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date


class PaymentSummary(BaseModel):
    """Summary of a single payment transaction."""
    id: int
    amount: int  # Amount in rupees
    date: date
    method: str  # 'cash', 'upi', 'bank_transfer', 'cheque', 'other'
    notes: Optional[str] = None


class MemberMonthlyData(BaseModel):
    """Per-member data for a specific month."""
    member_id: int
    member_name: str
    phone_number: str
    expected_amount: int  # Per-member expected (Total ÷ Size) in rupees
    amount_paid: int      # Sum of payments for this month in rupees
    status: str           # 'Paid', 'Partial', 'Unpaid'
    payments: List[PaymentSummary] = []  # Payment history for this member/month


class MonthMembersResponse(BaseModel):
    """Response schema for per-member monthly breakdown."""
    month: int
    month_date: str       # "MM/YYYY" format
    chit_id: int
    chit_name: str
    size: int             # Number of members in the chit
    total_expected: int   # Total monthly collection in rupees
    total_collected: int  # Sum of all payments for this month in rupees
    collection_percentage: float  # (total_collected / total_expected) * 100
    members: List[MemberMonthlyData]
    
    model_config = ConfigDict(from_attributes=True)
