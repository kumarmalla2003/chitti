# backend/app/api/routers/members.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, List
from datetime import date
from dateutil.relativedelta import relativedelta

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.models.payments import PaymentType
from app.security.dependencies import get_current_user
from app.crud import crud_members, crud_slots, crud_chits, crud_payments
from app.schemas import members as members_schemas
from app.schemas import slots as slots_schemas
from app.schemas.chits import ChitResponse
from app.schemas.slots import ChitSlotListPublicResponse

router = APIRouter(prefix="/members", tags=["members"])

@router.post("", response_model=members_schemas.MemberPublic, status_code=status.HTTP_201_CREATED)
async def create_member(
    member_in: members_schemas.MemberCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_member = await crud_members.get_member_by_phone(session, phone_number=member_in.phone_number)
    if db_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A member with this phone number already exists.",
        )
    return await crud_members.create_member(session=session, member_in=member_in)

@router.put("/{member_id}", response_model=members_schemas.MemberPublic)
async def update_member_details(
    member_id: int,
    member_in: members_schemas.MemberUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    if member_in.phone_number != db_member.phone_number:
        existing_member = await crud_members.get_member_by_phone(session, phone_number=member_in.phone_number)
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already registered to another member.",
            )

    return await crud_members.update_member(session=session, db_member=db_member, member_in=member_in)

@router.patch("/{member_id}", response_model=members_schemas.MemberPublic)
async def patch_member_details(
    member_id: int,
    member_in: members_schemas.MemberPatch,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    update_data = member_in.model_dump(exclude_unset=True)

    if "phone_number" in update_data and update_data["phone_number"] != db_member.phone_number:
        existing_member = await crud_members.get_member_by_phone(session, phone_number=update_data["phone_number"])
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already registered to another member.",
            )
    
    for key, value in update_data.items():
        setattr(db_member, key, value)
    
    # Update timestamp
    from datetime import datetime, timezone
    db_member.updated_at = datetime.now(timezone.utc)

    session.add(db_member)
    await session.commit()
    await session.refresh(db_member)
    return db_member

@router.get("/search", response_model=List[members_schemas.MemberSearchResponse])
async def search_for_members(
    query: Annotated[str, Query(min_length=2)],
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    members = await crud_members.search_members(session, query=query)
    return members

@router.get("/{member_id}", response_model=members_schemas.MemberPublic)
async def read_member_by_id(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if db_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return db_member

@router.get("/{member_id}/slots", response_model=ChitSlotListPublicResponse)
async def get_member_slots(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Retrieves all slots assigned to a specific member."""
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    member_slots = await crud_slots.get_by_member(session, member_id=member_id)
    
    response_slots = []
    today = date.today()

    for slot in member_slots:
        chit = slot.chit
        status_str = "Active" if chit.start_date <= today <= chit.end_date else "Inactive"
        
        if status_str == "Active":
            delta = relativedelta(today, chit.start_date)
            months_passed = delta.years * 12 + delta.months + 1
            chit_cycle_str = f"{months_passed}/{chit.duration_months}"
        else:
            chit_cycle_str = f"-/{chit.duration_months}"

        # Calculate expected contribution
        if chit.chit_type.value == "fixed":
            expected = chit.base_contribution
        elif chit.chit_type.value == "variable":
            # Check if member has received payout
            payout_payments = [p for p in (slot.payments or []) if p.payment_type == PaymentType.PAYOUT]
            expected = chit.premium_contribution if payout_payments else chit.base_contribution
        else:  # auction
            expected = slot.expected_contribution or (chit.chit_value // chit.size if chit.size > 0 else 0)
        
        # Get collection payments for this member in this month
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
        
        member_public = members_schemas.MemberPublic.model_validate(slot.member) if slot.member else None
        
        slot_public = slots_schemas.ChitSlotPublic(
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
        )
        response_slots.append(slot_public)
        
    return {"slots": response_slots}

@router.get("/{member_id}/payouts", response_model=ChitSlotListPublicResponse)
async def get_member_payouts(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Retrieves all slots (payouts) assigned to a specific member."""
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    member_slots = await crud_slots.get_by_member(session, member_id=member_id)
    
    result = []
    for slot in member_slots:
        payout_payments = [p for p in (slot.payments or []) if p.payment_type == PaymentType.PAYOUT]
        amount_paid = sum(p.amount for p in payout_payments)
        due_amount = slot.payout_amount - amount_paid
        
        if amount_paid == 0:
            collection_status = "Unpaid"
        elif due_amount > 0:
            collection_status = "Partial"
        else:
            collection_status = "Paid"
        
        member_public = members_schemas.MemberPublic.model_validate(slot.member) if slot.member else None
        
        result.append(slots_schemas.ChitSlotPublic(
            id=slot.id,
            month=slot.month,
            payout_amount=slot.payout_amount,
            bid_amount=slot.bid_amount,
            expected_contribution=slot.expected_contribution,
            status=slot.status,
            member=member_public,
            total_paid=amount_paid,
            due_amount=due_amount,
            collection_status=collection_status,
            created_at=slot.created_at,
            updated_at=slot.updated_at
        ))
    
    return {"slots": result}

@router.get("", response_model=members_schemas.MemberListResponse)
async def read_all_members(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    members = await crud_members.get_all_members(session)
    return {"members": members}

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    member_slots = await crud_slots.get_by_member(session, member_id=member_id)
    if member_slots:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete member: They are still assigned to one or more chit slots."
        )

    await crud_members.delete_member_by_id(session=session, db_member=db_member)
    return