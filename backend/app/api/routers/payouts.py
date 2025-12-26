# backend/app/api/routers/payouts.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.auth import AuthorizedPhone
from app.models.slots import ChitSlot, SlotStatus
from app.models.payments import PaymentType
from app.security.dependencies import get_current_user
from app.crud import crud_slots, crud_chits, crud_members
from app.schemas.slots import ChitSlotResponse, ChitSlotListResponse, ChitSlotUpdate
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitNested

router = APIRouter(prefix="/payouts", tags=["payouts"])


def slot_to_payout_response(slot: ChitSlot) -> dict:
    """
    Transform a ChitSlot model into a payout response dict with computed payment fields.
    Aggregates payment data from the payments relationship.
    """
    # Filter to only payout payments
    payout_payments = [p for p in (slot.payments or []) if p.payment_type == PaymentType.PAYOUT]
    
    # Sum of all payout payment amounts (in rupees)
    amount_paid = sum(p.amount for p in payout_payments if p.amount is not None)
    
    # Get the most recent payment for date/method/notes
    sorted_payments = sorted(
        [p for p in payout_payments if p.date is not None],
        key=lambda p: p.date,
        reverse=True
    )
    latest_payment = sorted_payments[0] if sorted_payments else None
    
    # Build response dict
    response_data = {
        "id": slot.id,
        "month": slot.month,
        "payout_amount": slot.payout_amount,
        "bid_amount": slot.bid_amount,
        "expected_contribution": slot.expected_contribution,
        "chit_id": slot.chit_id,
        "status": slot.status,
        "member_id": slot.member_id,
        "created_at": slot.created_at,
        "updated_at": slot.updated_at,
        # Nested objects
        "member": MemberPublic.model_validate(slot.member) if slot.member else None,
        # Computed payment fields
        "amount_paid": amount_paid,
        "paid_date": latest_payment.date if latest_payment else None,
        "payment_method": latest_payment.method.value if latest_payment and latest_payment.method else None,
        "notes": latest_payment.notes if latest_payment else None,
    }
    
    return response_data


def slots_to_payout_response_list(slots: List[ChitSlot]) -> List[dict]:
    """Transform a list of slots to payout response dicts."""
    return [slot_to_payout_response(s) for s in slots]


@router.get("", response_model=ChitSlotListResponse)
async def read_all_payouts(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[SlotStatus] = Query(default=None, alias="status"),
):
    """Get all slots (payouts). Optional status filter."""
    if status_filter:
        slots_list = await crud_slots.get_by_status(session, status_filter)
    else:
        slots_list = await crud_slots.get_all(session)
    return {"slots": slots_to_payout_response_list(slots_list)}


@router.get("/chit/{chit_id}", response_model=ChitSlotListResponse)
async def read_payouts_by_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all slots (payouts) for a specific chit."""
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    slots_list = await crud_slots.get_by_chit(session, chit_id)
    return {"slots": slots_to_payout_response_list(slots_list)}


@router.get("/member/{member_id}", response_model=ChitSlotListResponse)
async def read_payouts_by_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all slots (payouts) for a specific member."""
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    slots_list = await crud_slots.get_by_member(session, member_id)
    return {"slots": slots_to_payout_response_list(slots_list)}


@router.get("/{slot_id}", response_model=ChitSlotResponse)
async def read_payout(
    slot_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a specific slot (payout) by ID."""
    slot = await crud_slots.get(session, slot_id)
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    return slot_to_payout_response(slot)


@router.put("/{slot_id}", response_model=ChitSlotResponse)
async def update_payout(
    slot_id: int,
    slot_in: ChitSlotUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a slot (payout schedule) - payout_amount, bid_amount, status, member assignment."""
    db_slot = await crud_slots.get(session, slot_id)
    if not db_slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    
    # Validate bid_amount for auction chits (all in rupees)
    if slot_in.bid_amount is not None:
        await session.refresh(db_slot, ["chit"])
        if db_slot.chit and db_slot.chit.chit_value:
            if slot_in.bid_amount > db_slot.chit.chit_value:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                    detail="Bid amount cannot be greater than Chit value."
                )
            
            # Auto-calculate for auction chits using centralized logic
            if db_slot.chit.chit_type.value == "auction":
                try:
                    await crud_chits.record_auction_month(
                        session=session,
                        chit_id=db_slot.chit_id,
                        month=db_slot.month,
                        bid_amount=slot_in.bid_amount,
                        member_id=slot_in.member_id if slot_in.member_id is not None else db_slot.member_id
                    )
                except ValueError as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=str(e)
                    )
                
                # record_auction_month commits, so return refreshed slot
                updated_slot = await crud_slots.get(session, slot_id)
                return slot_to_payout_response(updated_slot)

    await crud_slots.update(db=session, db_obj=db_slot, obj_in=slot_in)
    
    # Re-fetch with relationships
    updated_slot = await crud_slots.get(session, slot_id)
    return slot_to_payout_response(updated_slot)
