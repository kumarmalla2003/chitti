# backend/app/api/routers/chits.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import date
import calendar
from dateutil.relativedelta import relativedelta


from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.schemas.chits import (
    ChitCreate, ChitUpdate, ChitResponse, ChitListResponse,
    ChitPatch, PayoutResponse, PayoutListResponse, PayoutUpdate
)
from app.schemas.assignments import ChitAssignmentPublic, ChitAssignmentListResponse
from app.schemas.members import MemberPublic
from app.models.chits import Chit
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
# --- ADD crud_payments ---
from app.crud import crud_chits, crud_assignments, crud_payments
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

router = APIRouter(prefix="/chits", tags=["chits"])

@router.post("/", response_model=ChitResponse, status_code=status.HTTP_201_CREATED)
async def create_chit(
    chit: ChitCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Creates a new chit for the authenticated user.
    """
    
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
        group_size=chit.group_size,
        monthly_installment=chit.monthly_installment,
        duration_months=chit.duration_months,
        start_date=chit.start_date,
        end_date=end_date,
        collection_day=chit.collection_day,
        payout_day=chit.payout_day,
    )
    session.add(db_chit)
    
    try:
        await session.commit()
        await session.refresh(db_chit)
        # --- Create initial payouts ---
        await crud_chits.create_payouts_for_chit(
            session, 
            chit_id=db_chit.id,
            duration_months=db_chit.duration_months
        )
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit with this name already exists. Please choose a different name."
        )
    
    response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=db_chit.id)
    return response_details


@router.get("/", response_model=ChitListResponse)
async def read_chits(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a list of all chits, calculates their status and cycle,
    and sorts them.
    """
    statement = select(Chit)
    result = await session.execute(statement)
    chits = result.scalars().all()
    
    today = date.today()
    
    response_chits = []
    for chit in chits:
        response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=chit.id)
        response_chits.append(response_details)

    response_chits.sort(key=lambda g: (g.status != 'Active', g.start_date), reverse=False)

    return {"chits": response_chits}


@router.get("/{chit_id}/assignments", response_model=ChitAssignmentListResponse)
async def get_chit_assignments(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves all member assignments for a specific chit.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
        
    assignments = await crud_assignments.get_assignments_by_chit_id(session, chit_id=chit_id)
    
    response_assignments = []
    for assignment in assignments:
        chit_with_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=assignment.chit_id)
        
        member_public = MemberPublic(
            id=assignment.member.id,
            full_name=assignment.member.full_name,
            phone_number=assignment.member.phone_number,
        )

        # --- PAYMENT CALCULATION LOGIC ---
        monthly_installment = assignment.chit.monthly_installment
        payments = await crud_payments.get_payments_for_assignment(session, assignment.id)
        total_paid = sum(p.amount_paid for p in payments)
        due_amount = monthly_installment - total_paid

        if total_paid == 0:
            payment_status = "Unpaid"
        elif due_amount > 0:
            payment_status = "Partial"
        else:
            payment_status = "Paid"
        # --- END OF CALCULATION ---

        assignment_public = ChitAssignmentPublic(
            id=assignment.id,
            chit_month=assignment.chit_month,
            member=member_public,
            chit=chit_with_details,
            # --- ADD NEW FIELDS TO RESPONSE ---
            total_paid=total_paid,
            due_amount=due_amount,
            payment_status=payment_status
        )
        response_assignments.append(assignment_public)
        
    return {"assignments": response_assignments}

@router.get("/{chit_id}", response_model=ChitResponse)
async def read_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a single chit by its ID.
    """
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
    """
    Updates an existing chit.
    """
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

    response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=db_chit.id)
    return response_details

@router.patch("/{chit_id}", response_model=ChitResponse)
async def patch_chit(
    chit_id: int,
    chit: ChitPatch,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Partially updates an existing chit. Only updates the fields provided.
    """
    db_chit = await session.get(Chit, chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")

    chit_data = chit.model_dump(exclude_unset=True)
    date_or_duration_changed = "start_date" in chit_data or "duration_months" in chit_data

    if "name" in chit_data:
        trimmed_name = chit_data["name"].strip()
        existing_chit = await session.execute(
            select(Chit).where(
                func.lower(Chit.name) == func.lower(trimmed_name),
                Chit.id != chit_id
            )
        )
        if existing_chit.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A chit with this name already exists. Please choose a different name."
            )
        chit_data["name"] = trimmed_name

    for key, value in chit_data.items():
        setattr(db_chit, key, value)
    
    if date_or_duration_changed:
        db_chit.end_date = db_chit.start_date + relativedelta(months=db_chit.duration_months - 1)

    session.add(db_chit)
    
    try:
        await session.commit()
        await session.refresh(db_chit)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit with this name already exists. Please choose a different name."
        )

    response_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=db_chit.id)
    return response_details

@router.delete("/{chit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Deletes a chit, only if it has no members assigned to it.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")

    assignments = await crud_assignments.get_assignments_by_chit_id(session, chit_id=chit_id)
    if assignments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete chit: Members are still assigned to it."
        )

    await crud_chits.delete_chit_by_id(session=session, db_chit=db_chit)
    return

# --- Payout Endpoints ---

@router.get("/{chit_id}/payouts", response_model=PayoutListResponse)
async def get_payouts_for_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves all payouts for a specific chit.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    payouts = await crud_chits.get_payouts_by_chit_id(session, chit_id=chit_id)
    return {"payouts": payouts}

@router.put("/payouts/{payout_id}", response_model=PayoutResponse)
async def update_payout_amount(
    payout_id: int,
    payout: PayoutUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Updates the amount for a specific payout.
    """
    updated_payout = await crud_chits.update_payout(session, payout_id=payout_id, payout_data=payout)
    if not updated_payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    return updated_payout