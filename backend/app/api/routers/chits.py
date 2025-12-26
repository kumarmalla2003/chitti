# backend/app/api/routers/chits.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import date, datetime, timezone
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from calendar import monthrange


def calculate_end_date_with_last_day(start_date: date, duration_months: int) -> date:
    """Calculate end_date as the last day of the end month."""
    end_month_date = start_date + relativedelta(months=duration_months - 1)
    last_day = monthrange(end_month_date.year, end_month_date.month)[1]
    return date(end_month_date.year, end_month_date.month, last_day)


from app.db.session import get_session
from app.models.chits import Chit
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_chits, crud_slots, crud_payments
from app.models.chits import ChitType
from app.models.payments import PaymentType


def calculate_variable_payout_schedule(chit_value: int, size: int, premium_percent: float, commission_percent: float, duration_months: int) -> dict[int, int]:
    """Calculate expected payout amounts for variable chits for each month.
    
    Payout = Total Collection - Commission
    Where Total Collection varies based on how many have received payout.
    """
    base_contribution = chit_value // size if size > 0 else 0
    premium_amount = int(chit_value * premium_percent / 100)
    winner_contribution = base_contribution + premium_amount
    commission = int(chit_value * commission_percent / 100)
    
    schedule = {}
    for month in range(1, duration_months + 1):
        # Winners = Month - 1
        winners_count = min(month - 1, size)
        waiters_count = max(size - winners_count, 0)
        
        total_collection = (waiters_count * base_contribution) + (winners_count * winner_contribution)
        payout = max(total_collection - commission, 0)
        schedule[month] = payout
    return schedule


from app.schemas.chits import (
    ChitCreate, ChitUpdate, ChitResponse, ChitListResponse,
    ChitPatch, AuctionRequest
)
from app.schemas.slots import ChitSlotListPublicResponse, ChitSlotPublic
from app.schemas.members import MemberPublic

router = APIRouter(prefix="/chits", tags=["chits"])


@router.get("/check-name")
async def check_chit_name_availability(
    name: str,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Check if a chit name is available (case-insensitive)."""
    trimmed = name.strip()
    if len(trimmed) < 3:
        return {"available": True}  # Too short to validate
    
    existing = await session.execute(
        select(Chit).where(func.lower(Chit.name) == func.lower(trimmed))
    )
    return {"available": existing.scalar_one_or_none() is None}


@router.post("", response_model=ChitResponse, status_code=status.HTTP_201_CREATED)
async def create_chit(
    chit: ChitCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    trimmed_name = chit.name.strip()
    existing_chit = await session.execute(
        select(Chit).where(func.lower(Chit.name) == func.lower(trimmed_name))
    )
    if existing_chit.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit with this name already exists. Please choose a different name."
        )

    end_date = calculate_end_date_with_last_day(chit.start_date, chit.duration_months)

    # Calculate contribution fields based on chit type
    base_contribution = chit.base_contribution
    premium_contribution = chit.premium_contribution
    
    # For Variable Chits, Enforce Duration = Size and calculate contributions
    if chit.chit_type == ChitType.VARIABLE or chit.chit_type == "variable":
        duration = chit.size  # Duration = Size for variable chits
        end_date = calculate_end_date_with_last_day(chit.start_date, duration)
        
        # Calculate contributions
        base_contribution = chit.chit_value // chit.size if chit.size > 0 else 0
        premium_amount = int(chit.chit_value * chit.payout_premium_percent / 100)
        premium_contribution = base_contribution + premium_amount
    else:
        duration = chit.duration_months
        
    # For Auction Chits, calculate base contribution
    if chit.chit_type == ChitType.AUCTION or chit.chit_type == "auction":
        base_contribution = chit.chit_value // chit.size if chit.size > 0 else 0
        premium_contribution = base_contribution  # Same for auction (per-month contribution stored in slot)
    
    # For Fixed Chits, premium equals base
    if chit.chit_type == ChitType.FIXED or chit.chit_type == "fixed":
        premium_contribution = base_contribution

    db_chit = Chit(
        name=trimmed_name,
        chit_value=chit.chit_value,
        size=chit.size,
        duration_months=duration,
        start_date=chit.start_date,
        end_date=end_date,
        collection_day=chit.collection_day,
        payout_day=chit.payout_day,
        # Chit type fields
        chit_type=chit.chit_type,
        base_contribution=base_contribution,
        premium_contribution=premium_contribution,
        payout_premium_percent=chit.payout_premium_percent,
        foreman_commission_percent=chit.foreman_commission_percent,
        # Optional notes field
        notes=chit.notes,
    )
    session.add(db_chit)
    
    try:
        await session.commit()
        await session.refresh(db_chit)
        
        # Determine payout amounts based on Chit Type
        payout_amount = 0
        payout_map = None
        expected_contribution = 0  # Per-member or total expected collection

        if db_chit.chit_type.value == "fixed":
            # Fixed: Payout varies monthly, entered manually by user (start with 0)
            payout_amount = 0
            # Expected contribution = total monthly collection from all members
            expected_contribution = db_chit.base_contribution * db_chit.size
        elif db_chit.chit_type.value == "variable":
            # Variable: Calculate per-month payout schedule
            payout_map = calculate_variable_payout_schedule(
                db_chit.chit_value, db_chit.size, db_chit.payout_premium_percent, 
                db_chit.foreman_commission_percent, db_chit.duration_months
            )
            # For variable, contribution is base_contribution (pre-payout) or premium (post-payout)
            # This is per-member, not total
            expected_contribution = db_chit.base_contribution
        # Auction: both start at 0, calculated when auction is recorded
        
        # Create Slot records for each month
        await crud_slots.create_slots_for_chit(
            session, db_chit.id, db_chit.duration_months, 
            payout_amount=payout_amount, 
            payout_map=payout_map,
            expected_contribution=expected_contribution
        )
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit with this name already exists. Please choose a different name."
        )
    
    response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=db_chit.id)
    return response_details


@router.get("", response_model=ChitListResponse)
async def read_chits(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    statement = select(Chit)
    result = await session.execute(statement)
    chits = result.scalars().all()
    
    response_chits = []
    for chit in chits:
        response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=chit.id)
        response_chits.append(response_details)

    response_chits.sort(key=lambda c: (c.status != 'Active', c.start_date), reverse=False)
    return {"chits": response_chits}


@router.get("/{chit_id}/slots", response_model=ChitSlotListPublicResponse)
async def get_chit_slots(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all slots for a chit with member assignment and collection status."""
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
        
    all_slots = await crud_slots.get_by_chit(session, chit_id=chit_id)
    
    response_slots = []
    for slot in all_slots:
        member_public = None
        if slot.member:
            member_public = MemberPublic(
                id=slot.member.id,
                full_name=slot.member.full_name,
                phone_number=slot.member.phone_number,
            )
        
        # Calculate expected contribution based on chit type
        if db_chit.chit_type.value == "fixed":
            expected_contribution = db_chit.base_contribution
        elif db_chit.chit_type.value == "variable":
            # Check if member has received a payout (has payout payments on this slot)
            has_payout_payment = any(p.payment_type == PaymentType.PAYOUT for p in slot.payments) if slot.payments else False
            expected_contribution = db_chit.premium_contribution if has_payout_payment else db_chit.base_contribution
        else:  # auction
            expected_contribution = slot.expected_contribution or (db_chit.chit_value // db_chit.size if db_chit.size > 0 else 0)
        
        # Get collection payments for this member in this month
        total_paid = 0
        if slot.member_id:
            all_payments = await crud_payments.get_by_chit_and_month(session, chit_id=chit_id, month=slot.month)
            member_collection_payments = [
                p for p in all_payments 
                if p.member_id == slot.member_id and p.payment_type == PaymentType.COLLECTION
            ]
            total_paid = sum(p.amount for p in member_collection_payments)
        
        due_amount = expected_contribution - total_paid

        if total_paid == 0: 
            collection_status = "Unpaid"
        elif due_amount > 0: 
            collection_status = "Partial"
        else: 
            collection_status = "Paid"

        slot_public = ChitSlotPublic(
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


@router.get("/{chit_id}", response_model=ChitResponse)
async def read_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=chit_id)
    if not response_details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    return response_details


@router.put("/{chit_id}", response_model=ChitResponse)
async def update_chit(
    chit_id: int,
    chit: ChitUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_chit = await session.get(Chit, chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")

    chit_data = chit.model_dump(exclude_unset=True)
    for key, value in chit_data.items():
        setattr(db_chit, key, value)
    
    # For Variable Chits, Enforce Duration = Size
    if db_chit.chit_type == ChitType.VARIABLE:
        db_chit.duration_months = db_chit.size
        # Recalculate contributions
        db_chit.base_contribution = db_chit.chit_value // db_chit.size if db_chit.size > 0 else 0
        premium_amount = int(db_chit.chit_value * db_chit.payout_premium_percent / 100)
        db_chit.premium_contribution = db_chit.base_contribution + premium_amount

    # For Auction Chits, recalculate base contribution
    if db_chit.chit_type == ChitType.AUCTION:
        db_chit.base_contribution = db_chit.chit_value // db_chit.size if db_chit.size > 0 else 0
        db_chit.premium_contribution = db_chit.base_contribution

    # For Fixed Chits, premium equals base
    if db_chit.chit_type == ChitType.FIXED:
        db_chit.premium_contribution = db_chit.base_contribution

    # Recalculate end_date
    db_chit.end_date = calculate_end_date_with_last_day(db_chit.start_date, db_chit.duration_months)
    db_chit.updated_at = datetime.now(timezone.utc)

    session.add(db_chit)
    await session.commit()
    await session.refresh(db_chit)
    
    # Sync slot schedule and update payout amounts
    payout_amount = 0
    payout_map = None

    if db_chit.chit_type.value == "fixed":
        payout_amount = db_chit.chit_value
    elif db_chit.chit_type.value == "variable":
        payout_map = calculate_variable_payout_schedule(
            db_chit.chit_value, db_chit.size, db_chit.payout_premium_percent,
            db_chit.foreman_commission_percent, db_chit.duration_months
        )
    
    await crud_slots.sync_schedule(
        session, chit_id=db_chit.id, new_duration=db_chit.duration_months,
        payout_amount=payout_amount, payout_map=payout_map
    )
    await crud_slots.update_payout_amounts(
        session, chit_id=db_chit.id, payout_amount=payout_amount, payout_map=payout_map
    )

    response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=db_chit.id)
    return response_details


@router.patch("/{chit_id}", response_model=ChitResponse)
async def patch_chit(
    chit_id: int,
    chit: ChitPatch,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_chit = await session.get(Chit, chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")

    chit_data = chit.model_dump(exclude_unset=True)
    date_or_duration_changed = "start_date" in chit_data or "duration_months" in chit_data
    
    # Variable Chit Force Duration Logic
    if db_chit.chit_type == ChitType.VARIABLE:
        if "size" in chit_data:
            chit_data["duration_months"] = chit_data["size"]
            date_or_duration_changed = True
    
    if "name" in chit_data:
        trimmed_name = chit_data["name"].strip()
        existing_chit = await session.execute(
            select(Chit).where(func.lower(Chit.name) == func.lower(trimmed_name), Chit.id != chit_id)
        )
        if existing_chit.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A chit with this name already exists.")
        chit_data["name"] = trimmed_name

    for key, value in chit_data.items():
        setattr(db_chit, key, value)
    
    # Recalculate contributions based on chit type
    if db_chit.chit_type == ChitType.VARIABLE:
        db_chit.base_contribution = db_chit.chit_value // db_chit.size if db_chit.size > 0 else 0
        premium_amount = int(db_chit.chit_value * db_chit.payout_premium_percent / 100)
        db_chit.premium_contribution = db_chit.base_contribution + premium_amount
    elif db_chit.chit_type == ChitType.AUCTION:
        db_chit.base_contribution = db_chit.chit_value // db_chit.size if db_chit.size > 0 else 0
        db_chit.premium_contribution = db_chit.base_contribution
    elif db_chit.chit_type == ChitType.FIXED:
        db_chit.premium_contribution = db_chit.base_contribution
    
    if date_or_duration_changed:
        db_chit.end_date = calculate_end_date_with_last_day(db_chit.start_date, db_chit.duration_months)
    
    db_chit.updated_at = datetime.now(timezone.utc)

    session.add(db_chit)
    try:
        await session.commit()
        await session.refresh(db_chit)
        
        # Calculate payout amounts
        payout_amount = 0
        payout_map = None

        if db_chit.chit_type.value == "fixed":
            payout_amount = db_chit.chit_value
        elif db_chit.chit_type.value == "variable":
            payout_map = calculate_variable_payout_schedule(
                db_chit.chit_value, db_chit.size, db_chit.payout_premium_percent,
                db_chit.foreman_commission_percent, db_chit.duration_months
            )
        
        if "duration_months" in chit_data or date_or_duration_changed:
            await crud_slots.sync_schedule(
                session, chit_id=db_chit.id, new_duration=db_chit.duration_months,
                payout_amount=payout_amount, payout_map=payout_map
            )
        
        # Update payout amounts if relevant fields changed
        relevant_changes = ("base_contribution" in chit_data or "chit_type" in chit_data or 
                           (db_chit.chit_type.value == "variable" and 
                            ("payout_premium_percent" in chit_data or "chit_value" in chit_data or 
                             "size" in chit_data or "foreman_commission_percent" in chit_data)))
        
        if relevant_changes:
            await crud_slots.update_payout_amounts(
                session, chit_id=db_chit.id, payout_amount=payout_amount, payout_map=payout_map
            )
            
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A chit with this name already exists.")

    response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=db_chit.id)
    return response_details


@router.delete("/{chit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")

    # Check if any slots are assigned
    assigned_slots = await crud_slots.get_assigned_slots(session, chit_id=chit_id)
    if assigned_slots:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete chit: Members are still assigned to it.")

    await crud_chits.delete_chit_by_id(session=session, db_chit=db_chit)
    return


@router.get("/{chit_id}/payouts", response_model=ChitSlotListPublicResponse)
async def get_payouts_for_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get all slots (payouts) for a specific chit with computed payment fields.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    all_slots = await crud_slots.get_by_chit(session, chit_id=chit_id)
    
    result = []
    for slot in all_slots:
        member_public = None
        if slot.member:
            member_public = MemberPublic(
                id=slot.member.id,
                full_name=slot.member.full_name,
                phone_number=slot.member.phone_number,
            )
        
        # Calculate amount paid for payout
        payout_payments = [p for p in slot.payments if p.payment_type == PaymentType.PAYOUT] if slot.payments else []
        amount_paid = sum(p.amount for p in payout_payments)
        due_amount = slot.payout_amount - amount_paid
        
        if amount_paid == 0:
            collection_status = "Unpaid"
        elif due_amount > 0:
            collection_status = "Partial"
        else:
            collection_status = "Paid"
        
        result.append(ChitSlotPublic(
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


@router.post("/{chit_id}/auctions", status_code=status.HTTP_200_OK)
async def record_auction(
    chit_id: int,
    auction_data: AuctionRequest,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Record an auction for a specific month and auto-calculate financials."""
    try:
        result = await crud_chits.record_auction_month(
            session=session,
            chit_id=chit_id,
            month=auction_data.month,
            bid_amount=auction_data.bid_amount,
            member_id=auction_data.member_id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


from app.schemas.month_members import MonthMembersResponse, MemberMonthlyData, PaymentSummary

@router.get("/{chit_id}/months/{month}/members", response_model=MonthMembersResponse)
async def get_month_members(
    chit_id: int,
    month: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get per-member breakdown for a specific month.
    Shows all assigned members with their expected contribution and payment status.
    """
    # Get the chit
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    # Validate month range
    if month < 1 or month > db_chit.duration_months:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Month must be between 1 and {db_chit.duration_months}"
        )
    
    # Get the slot for this month
    month_slot = await crud_slots.get_by_chit_and_month(session, chit_id=chit_id, month=month)
    
    # Get all assigned slots for this chit (these are the "members" for collection purposes)
    all_assigned_slots = await crud_slots.get_assigned_slots(session, chit_id=chit_id)
    
    # Get all payments for this chit in this month
    month_payments = await crud_payments.get_by_chit_and_month(session, chit_id=chit_id, month=month)
    
    # Calculate total expected based on chit type
    if db_chit.chit_type.value == "fixed":
        per_member_expected = db_chit.base_contribution
    elif db_chit.chit_type.value == "variable":
        per_member_expected = db_chit.base_contribution  # Will be adjusted per member below
    else:  # auction
        per_member_expected = month_slot.expected_contribution if month_slot and month_slot.expected_contribution else (db_chit.chit_value // db_chit.size if db_chit.size > 0 else 0)
    
    # Build per-member data
    members_data = []
    total_collected = 0
    total_expected = 0
    
    for assigned_slot in all_assigned_slots:
        member = assigned_slot.member
        if not member:
            continue
        
        # Calculate per-member expected amount based on chit type
        if db_chit.chit_type.value == "fixed":
            member_expected = db_chit.base_contribution
            
        elif db_chit.chit_type.value == "variable":
            # Check if member has received a payout (their slot has payout payments before this month)
            member_slot = assigned_slot
            payout_payments = [p for p in (member_slot.payments or []) if p.payment_type == PaymentType.PAYOUT]
            
            if payout_payments:
                # Get earliest payout date
                payout_dates = [p.date for p in payout_payments if p.date]
                if payout_dates:
                    earliest_payout = min(payout_dates)
                    # Calculate month date for comparison
                    month_date = db_chit.start_date + relativedelta(months=month - 1)
                    
                    # Use premium if payout was before this month
                    if (month_date.year, month_date.month) > (earliest_payout.year, earliest_payout.month):
                        member_expected = db_chit.premium_contribution
                    else:
                        member_expected = db_chit.base_contribution
                else:
                    member_expected = db_chit.base_contribution
            else:
                member_expected = db_chit.base_contribution
                
        else:  # auction
            member_expected = per_member_expected
        
        total_expected += member_expected
        
        # Get payments made by this member for this month
        member_payments = [p for p in month_payments if p.member_id == member.id and p.payment_type == PaymentType.COLLECTION]
        amount_paid = sum(p.amount for p in member_payments)
        total_collected += amount_paid
        
        # Determine status
        if amount_paid == 0:
            status_str = "Unpaid"
        elif amount_paid >= member_expected:
            status_str = "Paid"
        else:
            status_str = "Partial"
        
        # Build payment summaries
        payment_summaries = [
            PaymentSummary(
                id=p.id,
                amount=p.amount,
                date=p.date,
                method=p.method.value if p.method else "cash",
                notes=p.notes
            )
            for p in member_payments
        ]
        
        members_data.append(MemberMonthlyData(
            member_id=member.id,
            member_name=member.full_name,
            phone_number=member.phone_number,
            expected_amount=member_expected,
            amount_paid=amount_paid,
            status=status_str,
            payments=payment_summaries
        ))
    
    # Sort by status: Unpaid first, then Partial, then Paid
    status_order = {"Unpaid": 0, "Partial": 1, "Paid": 2}
    members_data.sort(key=lambda m: (status_order.get(m.status, 3), m.member_name))
    
    # Calculate month date string
    month_date_obj = db_chit.start_date + relativedelta(months=month - 1)
    month_date_str = month_date_obj.strftime("%m/%Y")
    
    # Calculate collection percentage
    collection_percentage = (total_collected / total_expected * 100) if total_expected > 0 else 0
    
    return MonthMembersResponse(
        month=month,
        month_date=month_date_str,
        chit_id=chit_id,
        chit_name=db_chit.name,
        size=db_chit.size,
        total_expected=total_expected,
        total_collected=total_collected,
        collection_percentage=round(collection_percentage, 1),
        members=members_data
    )