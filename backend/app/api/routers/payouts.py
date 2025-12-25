# backend/app/api/routers/payouts.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.auth import AuthorizedPhone
from app.models.payouts import Payout, PayoutStatus
from app.security.dependencies import get_current_user
from app.crud import crud_payouts, crud_chits, crud_members
from app.schemas.payouts import PayoutResponse, PayoutListResponse, PayoutUpdate
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitNested
from app.schemas.assignments import ChitAssignmentSimple

router = APIRouter(prefix="/payouts", tags=["payouts"])


def payout_to_response(payout: Payout) -> dict:
    """
    Transform a Payout model into a response dict with computed payment fields.
    Aggregates payment data from the payments relationship.
    """
    payments = payout.payments or []
    
    # Sum of all payment amounts (in rupees)
    amount_paid = sum(p.amount for p in payments if p.amount is not None)
    
    # Get the most recent payment for date/method/notes
    sorted_payments = sorted(
        [p for p in payments if p.date is not None],
        key=lambda p: p.date,
        reverse=True
    )
    latest_payment = sorted_payments[0] if sorted_payments else None
    
    # Build response dict
    response_data = {
        "id": payout.id,
        "month": payout.month,
        "planned_amount": payout.planned_amount,
        "bid_amount": payout.bid_amount,
        "chit_id": payout.chit_id,
        "status": payout.status,
        "member_id": payout.member_id,
        "chit_assignment_id": payout.chit_assignment_id,
        "created_at": payout.created_at,
        "updated_at": payout.updated_at,
        # Nested objects
        "member": MemberPublic.model_validate(payout.member) if payout.member else None,
        "chit": ChitNested.model_validate(payout.chit) if payout.chit else None,
        "assignment": ChitAssignmentSimple.model_validate(payout.assignment) if payout.assignment else None,
        # Computed payment fields
        "amount": amount_paid,
        "paid_date": latest_payment.date if latest_payment else None,
        "payment_method": latest_payment.method.value if latest_payment and latest_payment.method else None,
        "notes": latest_payment.notes if latest_payment else None,
    }
    
    return response_data


def payouts_to_response_list(payouts: List[Payout]) -> List[dict]:
    """Transform a list of payouts to response dicts."""
    return [payout_to_response(p) for p in payouts]


@router.get("", response_model=PayoutListResponse)
async def read_all_payouts(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[PayoutStatus] = Query(default=None, alias="status"),
):
    """Get all payouts. Optional status filter."""
    if status_filter:
        payouts_list = await crud_payouts.payouts.get_by_status(session, status_filter)
    else:
        payouts_list = await crud_payouts.payouts.get_all(session)
    return {"payouts": payouts_to_response_list(payouts_list)}

@router.get("/chit/{chit_id}", response_model=PayoutListResponse)
async def read_payouts_by_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all payouts for a specific chit."""
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    payouts_list = await crud_payouts.payouts.get_by_chit(session, chit_id)
    return {"payouts": payouts_to_response_list(payouts_list)}

@router.get("/member/{member_id}", response_model=PayoutListResponse)
async def read_payouts_by_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all payouts for a specific member."""
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    payouts_list = await crud_payouts.payouts.get_by_member(session, member_id)
    return {"payouts": payouts_to_response_list(payouts_list)}

@router.get("/{payout_id}", response_model=PayoutResponse)
async def read_payout(
    payout_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a specific payout by ID."""
    payout = await crud_payouts.payouts.get(session, payout_id)
    if not payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    return payout_to_response(payout)

@router.put("/{payout_id}", response_model=PayoutResponse)
async def update_payout(
    payout_id: int,
    payout_in: PayoutUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a payout schedule (planned_amount, bid_amount, status, member assignment)."""
    db_payout = await crud_payouts.payouts.get(session, payout_id)
    if not db_payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    
    # Validate bid_amount for auction chits (all in rupees)
    if payout_in.bid_amount is not None:
        await session.refresh(db_payout, ["chit"])
        if db_payout.chit and db_payout.chit.chit_value:
            if payout_in.bid_amount > db_payout.chit.chit_value:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                    detail="Bid amount cannot be greater than Chit value."
                )
            # Auto-calculate planned_amount for auction chits
            if db_payout.chit.chit_type.value == "auction":
                payout_in.planned_amount = int(db_payout.chit.chit_value - payout_in.bid_amount)
    
    await crud_payouts.payouts.update(db=session, db_obj=db_payout, obj_in=payout_in)
    
    # Re-fetch with relationships
    updated_payout = await crud_payouts.payouts.get(session, payout_id)
    return payout_to_response(updated_payout)

@router.delete("/{payout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payout(
    payout_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a payout schedule."""
    db_payout = await crud_payouts.payouts.get(session, payout_id)
    if not db_payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    
    await crud_payouts.payouts.delete(db=session, db_obj=db_payout)
