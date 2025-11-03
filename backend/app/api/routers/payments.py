# backend/app/api/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, List, Optional
from datetime import date
from dateutil.relativedelta import relativedelta

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.models.payments import Payment
# --- FIX 1: IMPORT THE MODEL ---
from app.models.assignments import ChitAssignment 
from app.security.dependencies import get_current_user
from app.crud import crud_payments, crud_chits, crud_members
from app.schemas.payments import PaymentPublic, PaymentListResponse, PaymentCreate, PaymentUpdate
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitGroupResponse

router = APIRouter(prefix="/payments", tags=["payments"])

# --- MODIFIED HELPER ---
async def _get_payment_response(session: AsyncSession, payment: Payment) -> PaymentPublic:
    """Helper to build the full PaymentPublic response."""
    group_response = await crud_chits.get_group_by_id_with_details(session, group_id=payment.chit_group_id)
    member = await crud_members.get_member_by_id(session, member_id=payment.member_id)
    member_response = MemberPublic.model_validate(member) if member else None
    
    # We can safely access payment.assignment.chit_month now
    if not payment.assignment:
        # This should ideally not happen if CRUD is correct, but as a safeguard
        raise HTTPException(status_code=500, detail="Payment is missing assignment link.")

    return PaymentPublic(
        id=payment.id,
        amount_paid=payment.amount_paid,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        notes=payment.notes,
        chit_assignment_id=payment.chit_assignment_id,
        chit_month=payment.assignment.chit_month,  # <-- ADDED THIS LINE
        member=member_response,
        chit_group=group_response
    )


# --- FIX 2: CHANGE ROUTE FROM "" TO "/" TO MATCH GET ---
@router.post("/", response_model=PaymentPublic, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_in: PaymentCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Logs a new payment."""
    # We need to manually get the member_id and group_id from the assignment
    
    # --- This was the error from your previous log, now fixed ---
    assignment = await session.get(ChitAssignment, payment_in.chit_assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified assignment does not exist."
        )
    
    db_payment = Payment(
        amount_paid=payment_in.amount_paid,
        payment_date=payment_in.payment_date,
        payment_method=payment_in.payment_method,
        notes=payment_in.notes,
        chit_assignment_id=payment_in.chit_assignment_id,
        member_id=assignment.member_id,
        chit_group_id=assignment.chit_group_id
    )
    
    session.add(db_payment)
    await session.commit()
    await session.refresh(db_payment)
    
    # We need to refetch it with relations for the helper
    db_payment_with_relations = await crud_payments.get_payment_by_id(session, db_payment.id)
    
    # Fetch the full response object
    return await _get_payment_response(session, db_payment_with_relations)


# --- This route is correct, and now matches the POST route ---
@router.get("/", response_model=PaymentListResponse)
async def get_all_payments(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    group_id: Optional[int] = Query(default=None),
    member_id: Optional[int] = Query(default=None),
):
    """
    Retrieves all payments, optionally filtered by group or member.
    """
    payments = await crud_payments.get_all_payments(
        session, group_id=group_id, member_id=member_id
    )
    
    group_responses_cache = {}
    
    response_payments = []
    for p in payments:
        if p.chit_group_id not in group_responses_cache:
            group_responses_cache[p.chit_group_id] = await crud_chits.get_group_by_id_with_details(session, group_id=p.chit_group_id)
        
        # This part is inefficient but works for list view.
        # A more optimized approach would join assignment in get_all_payments
        assignment = await session.get(ChitAssignment, p.chit_assignment_id)
        if not assignment:
            continue # Skip payments with broken assignment links

        response_payments.append(
            PaymentPublic(
                id=p.id,
                amount_paid=p.amount_paid,
                payment_date=p.payment_date,
                payment_method=p.payment_method,
                notes=p.notes,
                chit_assignment_id=p.chit_assignment_id,
                chit_month=assignment.chit_month, # <-- ADDED THIS LINE
                member=MemberPublic.model_validate(p.member),
                chit_group=group_responses_cache.get(p.chit_group_id)
            )
        )
    return {"payments": response_payments}


@router.get("/{payment_id}", response_model=PaymentPublic)
async def get_payment_by_id(
    payment_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Retrieves a single payment by its ID."""
    db_payment = await crud_payments.get_payment_by_id(session, payment_id=payment_id)
    if not db_payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    
    return await _get_payment_response(session, db_payment)

@router.patch("/{payment_id}", response_model=PaymentPublic)
async def update_payment(
    payment_id: int,
    payment_in: PaymentUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Updates an existing payment."""
    db_payment = await crud_payments.get_payment_by_id(session, payment_id=payment_id)
    if not db_payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
    updated_payment = await crud_payments.update_payment(
        session=session, db_payment=db_payment, payment_in=payment_in
    )
    
    return await _get_payment_response(session, updated_payment)

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Deletes a payment."""
    db_payment = await crud_payments.get_payment_by_id(session, payment_id=payment_id)
    if not db_payment:
        # --- FIX 3: CORRECTED TYPO 4404 -> 404 ---
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    
    await crud_payments.delete_payment(session=session, db_payment=db_payment)
    return


# --- Phase 1 Endpoints (Modified to be correct) ---

@router.get("/group/{group_id}", response_model=PaymentListResponse)
async def get_payments_for_group(
    group_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves all payments for a specific chit group.
    """
    payments = await crud_payments.get_payments_for_group(session, group_id=group_id)
    
    group_response = await crud_chits.get_group_by_id_with_details(session, group_id=group_id)

    response_payments = []
    for p in payments:
        assignment = await session.get(ChitAssignment, p.chit_assignment_id)
        if not assignment:
            continue

        response_payments.append(
            PaymentPublic(
                id=p.id,
                amount_paid=p.amount_paid,
                payment_date=p.payment_date,
                payment_method=p.payment_method,
                notes=p.notes,
                chit_assignment_id=p.chit_assignment_id,
                chit_month=assignment.chit_month, # <-- ADDED THIS LINE
                member=MemberPublic.model_validate(p.member),
                chit_group=group_response 
            )
        )
    return {"payments": response_payments}


@router.get("/member/{member_id}", response_model=PaymentListResponse)
async def get_payments_for_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves all payments for a specific member.
    """
    payments = await crud_payments.get_payments_for_member(session, member_id=member_id)
    
    group_responses_cache = {}
    
    member = await crud_members.get_member_by_id(session, member_id=member_id)
    member_response = MemberPublic.model_validate(member) if member else None

    response_payments = []
    for p in payments:
        if p.chit_group_id not in group_responses_cache:
            group_responses_cache[p.chit_group_id] = await crud_chits.get_group_by_id_with_details(session, group_id=p.chit_group_id)

        assignment = await session.get(ChitAssignment, p.chit_assignment_id)
        if not assignment:
            continue

        response_payments.append(
            PaymentPublic(
                id=p.id,
                amount_paid=p.amount_paid,
                payment_date=p.payment_date,
                payment_method=p.payment_method,
                notes=p.notes,
                chit_assignment_id=p.chit_assignment_id,
                chit_month=assignment.chit_month, # <-- ADDED THIS LINE
                member=member_response,
                chit_group=group_responses_cache.get(p.chit_group_id)
            )
        )
    return {"payments": response_payments}