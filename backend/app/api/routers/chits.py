# backend/app/api/routers/chits.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import date
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.db.session import get_session
from app.models.chits import Chit
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_chits, crud_assignments, crud_collections, crud_payouts
from app.schemas.chits import (
    ChitCreate, ChitUpdate, ChitResponse, ChitListResponse,
    ChitPatch
)
from app.schemas.assignments import ChitAssignmentListResponse, ChitAssignmentPublic
from app.schemas.members import MemberPublic
from app.schemas.payouts import PayoutListResponse

router = APIRouter(prefix="/chits", tags=["chits"])

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

    end_date = chit.start_date + relativedelta(months=chit.duration_months -1)

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
        installment_before_payout=chit.installment_before_payout,
        installment_after_payout=chit.installment_after_payout,
    )
    session.add(db_chit)
    
    try:
        await session.commit()
        await session.refresh(db_chit)
        # Create Schedule
        await crud_payouts.payouts.create_schedule_for_chit(session, db_chit.id, db_chit.duration_months)
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
        if chit.chit_type == "fixed":
            expected_installment = chit.monthly_installment
        elif chit.chit_type == "variable":
            # Check if member has received a payout in a PREVIOUS month
            # installment_after_payout applies from the month AFTER the payout month
            from datetime import date
            today = date.today()
            current_year_month = (today.year, today.month)
            
            member_payout = next(
                (p for p in all_payouts if p.member_id == assignment.member.id and p.paid_date is not None),
                None
            )
            
            if member_payout and member_payout.paid_date:
                payout_year_month = (member_payout.paid_date.year, member_payout.paid_date.month)
                # Use after_payout amount only if payout was in a previous month
                use_after_payout = current_year_month > payout_year_month
            else:
                use_after_payout = False
            
            expected_installment = chit.installment_after_payout if use_after_payout else chit.installment_before_payout
        else:  # auction
            # Auction chits: amount varies, use 0 as placeholder (set manually during collection)
            expected_installment = 0
        
        collections = await crud_collections.collections.get_by_assignment(session, assignment.id)
        
        total_paid = sum(p.amount_paid for p in collections)
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
    
    db_chit.end_date = db_chit.start_date + relativedelta(months=db_chit.duration_months - 1)

    session.add(db_chit)
    await session.commit()
    await session.refresh(db_chit)
    await crud_payouts.payouts.sync_schedule(session, chit_id=db_chit.id, new_duration=db_chit.duration_months)

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
        db_chit.end_date = db_chit.start_date + relativedelta(months=db_chit.duration_months - 1)

    session.add(db_chit)
    try:
        await session.commit()
        await session.refresh(db_chit)
        if "duration_months" in chit_data:
             await crud_payouts.payouts.sync_schedule(session, chit_id=db_chit.id, new_duration=db_chit.duration_months)
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
    Redirects to the payouts router logic.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    payouts = await crud_payouts.payouts.get_by_chit(session, chit_id=chit_id)
    return {"payouts": payouts}