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
from app.crud import crud_chits, crud_assignments, crud_collections, crud_payouts
from app.models.chits import ChitType

def calculate_variable_collection_schedule(chit_value: int, size: int, premium_percent: float, duration_months: int) -> dict[int, int]:
    """Calculate expected collection amounts for variable/premium chits for each month."""
    base_installment = chit_value // size if size > 0 else 0
    premium_amount = int(chit_value * premium_percent / 100)
    winner_installment = base_installment + premium_amount
    
    schedule = {}
    for month in range(1, duration_months + 1):
        # Winners = Month - 1 (Assuming 1 person wins each month starting month 1)
        # So in Month 1, 0 winners (everyone pays base). Month 2, 1 winner.
        winners_count = min(month - 1, size)
        waiters_count = max(size - winners_count, 0)
        
        total = (waiters_count * base_installment) + (winners_count * winner_installment)
        schedule[month] = total
    return schedule

def calculate_variable_payout_schedule(collection_schedule: dict[int, int], chit_value: int, commission_percent: float) -> dict[int, int]:
    """Calculate expected payout amounts for variable chits (Collection - Commission)."""
    commission = int(chit_value * commission_percent / 100)
    schedule = {}
    for month, collection_amount in collection_schedule.items():
        schedule[month] = max(collection_amount - commission, 0)
    return schedule
from app.schemas.chits import (
    ChitCreate, ChitUpdate, ChitResponse, ChitListResponse,
    ChitPatch
)
from app.schemas.assignments import ChitAssignmentListResponse, ChitAssignmentPublic
from app.schemas.members import MemberPublic
from app.schemas.payouts import PayoutListResponse

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

    
    # For Variable Chits, Enforce Duration = Size
    if chit.chit_type == ChitType.VARIABLE:
        chit.duration_months = chit.size
        # Recalculate end date
        end_date = calculate_end_date_with_last_day(chit.start_date, chit.duration_months)

    db_chit = Chit(
        name=trimmed_name,
        chit_value=chit.chit_value,
        size=chit.size,
        duration_months=chit.duration_months,
        start_date=chit.start_date,
        end_date=end_date,
        collection_day=chit.collection_day,
        payout_day=chit.payout_day,
        # Chit type fields
        chit_type=chit.chit_type,
        monthly_installment=chit.monthly_installment,
        payout_premium_percent=chit.payout_premium_percent,
        foreman_commission_percent=chit.foreman_commission_percent,
        # Optional notes field
        notes=chit.notes,
    )
    session.add(db_chit)
    
    try:
        await session.commit()
        await session.refresh(db_chit)
        # Determine calculation based on Chit Type
        collection_amount = 0
        schedule_map = None
        payout_map = None

        if db_chit.chit_type.value == "fixed":
            # Fixed: Total = Installment * Size
            collection_amount = (db_chit.monthly_installment * db_chit.size)
        elif db_chit.chit_type.value == "variable":
            # Variable: Calculate per-month collection schedule
            schedule_map = calculate_variable_collection_schedule(
                db_chit.chit_value, db_chit.size, db_chit.payout_premium_percent, db_chit.duration_months
            )
            # Variable: Calculate Payout = Collection - Commission
            payout_map = calculate_variable_payout_schedule(
                schedule_map, db_chit.chit_value, db_chit.foreman_commission_percent
            )
        
        # Create Schedules
        await crud_payouts.payouts.create_schedule_for_chit(
            session, db_chit.id, db_chit.duration_months, planned_amount=0, schedule_map=payout_map
        )
        await crud_collections.collections.create_schedule_for_chit(
            session, db_chit.id, db_chit.duration_months, collection_amount, schedule_map
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

@router.get("/{chit_id}/assignments", response_model=ChitAssignmentListResponse)
async def get_chit_assignments(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
        
    assignments = await crud_assignments.get_assignments_by_chit_id(session, chit_id=chit_id)
    
    # Fetch all payouts for this chit to check member payout status (for Variable chits)
    all_payouts = await crud_payouts.payouts.get_by_chit(session, chit_id=chit_id)
    
    response_assignments = []
    for assignment in assignments:
        chit_with_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=assignment.chit_id)
        member_public = MemberPublic(
            id=assignment.member.id,
            full_name=assignment.member.full_name,
            phone_number=assignment.member.phone_number,
        )
        
        # Calculate expected installment based on chit type
        chit = assignment.chit
        if chit.chit_type.value == "fixed":
            expected_installment = chit.monthly_installment
        elif chit.chit_type.value == "variable":
            # Check if member has received a payout in a PREVIOUS month
            # After payout installment applies from the month AFTER the payout month
            from datetime import date
            today = date.today()
            current_year_month = (today.year, today.month)
            
            # Find payout assigned to this member that has been paid (has payments)
            member_payout = next(
                (p for p in all_payouts if p.member_id == assignment.member.id and p.payments),
                None
            )
            
            # Check if member has received any payment for their payout
            if member_payout and member_payout.payments:
                # Get the earliest payment date for this payout
                payout_payment_dates = [pay.date for pay in member_payout.payments if pay.date]
                if payout_payment_dates:
                    earliest_payment_date = min(payout_payment_dates)
                    payout_year_month = (earliest_payment_date.year, earliest_payment_date.month)
                    # Use after_payout amount only if payout was in a previous month
                    use_after_payout = current_year_month > payout_year_month
                else:
                    use_after_payout = False
            else:
                use_after_payout = False
            
            # Calculate installments using the new formula
            expected_installment = chit.get_installment_after_payout() if use_after_payout else chit.get_installment_before_payout()
        else:  # auction
            # Auction chits: amount varies, use 0 as placeholder (set manually during collection)
            expected_installment = 0
        
        collections = await crud_collections.collections.get_by_assignment(session, assignment.id)
        
        # Sum actual payment amounts from the payments relationship
        total_paid = sum(
            payment.amount 
            for collection in collections 
            for payment in (collection.payments or [])
            if payment.amount is not None
        )
        due_amount = expected_installment - total_paid

        if total_paid == 0: collection_status = "Unpaid"
        elif due_amount > 0: collection_status = "Partial"
        else: collection_status = "Paid"

        assignment_public = ChitAssignmentPublic(
            id=assignment.id,
            chit_month=assignment.chit_month,
            member=member_public,
            chit=chit_with_details,
            total_paid=total_paid,
            due_amount=due_amount,
            collection_status=collection_status
        )
        response_assignments.append(assignment_public)
        
    return {"assignments": response_assignments}

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
    
       # For Variable Chits, Enforce Duration = Size if Type or Size changes (and not manually overriding duration)
    # But for simplicity, we always enforce if Variable
    if db_chit.chit_type == ChitType.VARIABLE:
        if "size" in chit_data and chit_data["size"] != db_chit.size:
             # Size changed, update Duration
             db_chit.duration_months = chit_data["size"]

    # Calculate end_date from start_date and duration_months
    # If duration changed (either via input or enforcement)
    if "start_date" in chit_data or "duration_months" in chit_data or \
       (db_chit.chit_type == ChitType.VARIABLE and "size" in chit_data):
        
        # Ensure we use latest values
        start = chit_data.get("start_date", db_chit.start_date)
        duration = chit_data.get("duration_months", db_chit.duration_months)
        
        # Override duration if variable
        if db_chit.chit_type == ChitType.VARIABLE:
            duration = db_chit.size
            db_chit.duration_months = duration

        db_chit.end_date = calculate_end_date_with_last_day(start, duration)

    db_chit.updated_at = datetime.now(timezone.utc)

    session.add(db_chit)
    await session.commit()
    await session.refresh(db_chit)
    # Sync both Payout and Collection schedules when duration changes
    
    # Determine calculation based on Chit Type
    collection_amount = 0
    schedule_map = None
    payout_map = None

    if db_chit.chit_type.value == "fixed":
        collection_amount = (db_chit.monthly_installment * db_chit.size)
    elif db_chit.chit_type.value == "variable":
        schedule_map = calculate_variable_collection_schedule(
            db_chit.chit_value, db_chit.size, db_chit.payout_premium_percent, db_chit.duration_months
        )
        payout_map = calculate_variable_payout_schedule(
            schedule_map, db_chit.chit_value, db_chit.foreman_commission_percent
        )
    
    await crud_payouts.payouts.sync_schedule(
        session, chit_id=db_chit.id, new_duration=db_chit.duration_months,
        planned_amount=0, schedule_map=payout_map
    )
    await crud_collections.collections.sync_schedule(
        session, chit_id=db_chit.id, new_duration=db_chit.duration_months, 
        expected_amount=collection_amount, schedule_map=schedule_map
    )
    # Update ALL existing amounts
    await crud_payouts.payouts.update_planned_amounts(
        session, chit_id=db_chit.id, planned_amount=0, schedule_map=payout_map
    )
    await crud_collections.collections.update_expected_amounts(
        session, chit_id=db_chit.id, expected_amount=collection_amount, schedule_map=schedule_map
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

    date_or_duration_changed = "start_date" in chit_data or "duration_months" in chit_data
    
    # Variable Chit Force Duration Logic
    if db_chit.chit_type == ChitType.VARIABLE:
        if "size" in chit_data:
            chit_data["duration_months"] = chit_data["size"]
            date_or_duration_changed = True
        elif "duration_months" in chit_data and chit_data["duration_months"] != db_chit.size:
             # User tried to change duration manually? Reject or Overwrite?
             # Overwrite
             chit_data["duration_months"] = db_chit.size
    
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
    
    if date_or_duration_changed:
        db_chit.end_date = calculate_end_date_with_last_day(db_chit.start_date, db_chit.duration_months)
    
    db_chit.updated_at = datetime.now(timezone.utc)

    session.add(db_chit)
    try:
        await session.commit()
        await session.refresh(db_chit)
        
        # Calculate amounts
        collection_amount = 0
        schedule_map = None
        payout_map = None

        if db_chit.chit_type.value == "fixed":
            collection_amount = (db_chit.monthly_installment * db_chit.size)
        elif db_chit.chit_type.value == "variable":
            schedule_map = calculate_variable_collection_schedule(
                db_chit.chit_value, db_chit.size, db_chit.payout_premium_percent, db_chit.duration_months
            )
            payout_map = calculate_variable_payout_schedule(
                schedule_map, db_chit.chit_value, db_chit.foreman_commission_percent
            )
        
        if "duration_months" in chit_data:
            # Sync both Payout and Collection schedules when duration changes
            await crud_payouts.payouts.sync_schedule(
                session, chit_id=db_chit.id, new_duration=db_chit.duration_months,
                planned_amount=0, schedule_map=payout_map
            )
            await crud_collections.collections.sync_schedule(
                session, chit_id=db_chit.id, new_duration=db_chit.duration_months, 
                expected_amount=collection_amount, schedule_map=schedule_map
            )
        
        # Update amounts if relevant fields changed
        relevant_changes = ("monthly_installment" in chit_data or "chit_type" in chit_data or 
                           (db_chit.chit_type.value == "variable" and 
                            ("payout_premium_percent" in chit_data or "chit_value" in chit_data or 
                             "size" in chit_data or "foreman_commission_percent" in chit_data)))
        
        if relevant_changes:
            await crud_collections.collections.update_expected_amounts(
                session, chit_id=db_chit.id, expected_amount=collection_amount, schedule_map=schedule_map
            )
            await crud_payouts.payouts.update_planned_amounts(
                session, chit_id=db_chit.id, planned_amount=0, schedule_map=payout_map
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

    assignments = await crud_assignments.get_assignments_by_chit_id(session, chit_id=chit_id)
    if assignments:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete chit: Members are still assigned to it.")

    await crud_chits.delete_chit_by_id(session=session, db_chit=db_chit)
    return

@router.get("/{chit_id}/payouts", response_model=PayoutListResponse)
async def get_payouts_for_chit_redirect(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get all payouts for a specific chit with computed payment fields.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    payouts = await crud_payouts.payouts.get_by_chit(session, chit_id=chit_id)
    
    # Import the transform function from payouts router
    from app.api.routers.payouts import payout_to_response
    return {"payouts": [payout_to_response(p) for p in payouts]}