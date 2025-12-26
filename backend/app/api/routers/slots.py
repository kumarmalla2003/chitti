# backend/app/api/routers/slots.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_chits, crud_members, crud_slots, crud_payments
from app.models.payments import PaymentType
from app.schemas import slots as slots_schemas
from app.schemas.members import MemberPublic

router = APIRouter(prefix="/slots", tags=["slots"])


@router.post("/chit/{chit_id}/assign/{month}", response_model=slots_schemas.ChitSlotPublic, status_code=status.HTTP_200_OK)
async def assign_member_to_slot(
    chit_id: int,
    month: int,
    assignment: slots_schemas.SlotAssignmentRequest,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Assigns a member to a chit slot for a specific month.
    """
    # Validate that member exists
    member = await crud_members.get_member_by_id(session, member_id=assignment.member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    # Validate that chit exists
    chit_with_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=chit_id)
    if not chit_with_details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    # Get the slot for this month
    slot = await crud_slots.get_by_chit_and_month(session, chit_id=chit_id, month=month)
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found for this month")
    
    if slot.member_id is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This slot is already assigned to a member")
    
    # Assign the member
    updated_slot = await crud_slots.assign_member(session, slot, assignment.member_id)
    
    member_public = MemberPublic.model_validate(member)

    return slots_schemas.ChitSlotPublic(
        id=updated_slot.id,
        month=updated_slot.month,
        payout_amount=updated_slot.payout_amount,
        bid_amount=updated_slot.bid_amount,
        expected_contribution=updated_slot.expected_contribution,
        status=updated_slot.status,
        member=member_public,
        total_paid=0,
        due_amount=chit_with_details.base_contribution,
        collection_status="Unpaid"
    )


@router.post("/chit/{chit_id}/bulk-assign", status_code=status.HTTP_201_CREATED)
async def bulk_assign_members(
    chit_id: int,
    bulk_data: slots_schemas.BulkSlotAssignmentRequest,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Assigns multiple members to multiple slots for a single chit in one transaction.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    try:
        for item in bulk_data.assignments:
            # Get the slot
            slot = await crud_slots.get_by_chit_and_month(session, chit_id=chit_id, month=item.month)
            if slot and slot.member_id is None:
                await crud_slots.assign_member(session, slot, item.member_id)
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create assignments. Error: {str(e)}"
        )
    
    return {"message": "Assignments created successfully."}


@router.get("/chit/{chit_id}/unassigned", response_model=slots_schemas.UnassignedMonthResponse)
async def get_unassigned_months(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Gets a list of available (unassigned) month numbers for a specific chit.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    months = await crud_slots.get_unassigned_months(session, chit_id=chit_id)
    return {"available_months": months}


@router.delete("/chit/{chit_id}/unassign/{month}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_member_from_slot(
    chit_id: int,
    month: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Unassigns a member from a specific slot (removes member assignment).
    The slot itself remains (for future assignment).
    """
    slot = await crud_slots.get_by_chit_and_month(session, chit_id=chit_id, month=month)
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    
    if slot.member_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This slot is not assigned to any member")
    
    # Check if any payments have been made for this slot
    if slot.payments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot unassign member: Payments have already been made for this slot."
        )
    
    await crud_slots.unassign_member(session, slot)
    return


@router.get("/member/{member_id}", response_model=slots_schemas.ChitSlotListPublicResponse)
async def get_member_slots(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Gets all slots assigned to a specific member across all chits.
    """
    member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    member_slots = await crud_slots.get_by_member(session, member_id=member_id)
    
    result = []
    for slot in member_slots:
        chit = slot.chit
        
        # Calculate expected contribution based on chit type
        if chit.chit_type.value == "fixed":
            expected = chit.base_contribution
        elif chit.chit_type.value == "variable":
            # Check if member has received payout (slot has payments)
            has_payout = bool(slot.payments)
            expected = chit.premium_contribution if has_payout else chit.base_contribution
        else:  # auction
            expected = slot.expected_contribution or (chit.chit_value // chit.size if chit.size > 0 else 0)
        
        # Get collection payments for this member in this slot's month
        all_payments = await crud_payments.get_by_member(session, member_id=member_id)
        member_collection_payments = [
            p for p in all_payments
            if p.chit_id == chit.id and p.month == slot.month and p.payment_type == PaymentType.COLLECTION
        ]
        total_paid = sum(p.amount for p in member_collection_payments)
        due_amount = expected - total_paid
        
        if total_paid == 0:
            collection_status = "Unpaid"
        elif due_amount > 0:
            collection_status = "Partial"
        else:
            collection_status = "Paid"
        
        member_public = MemberPublic.model_validate(slot.member) if slot.member else None
        
        result.append(slots_schemas.ChitSlotPublic(
            id=slot.id,
            month=slot.month,
            payout_amount=slot.payout_amount,
            bid_amount=slot.bid_amount,
            expected_contribution=slot.expected_contribution,
            status=slot.status,
            member=member_public,
            total_paid=total_paid,
            due_amount=due_amount,
            collection_status=collection_status,
            created_at=slot.created_at,
            updated_at=slot.updated_at
        ))
    
    return {"slots": result}
