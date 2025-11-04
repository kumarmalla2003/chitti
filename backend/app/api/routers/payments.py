# backend/app/api/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, List, Optional
from datetime import date
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import selectinload # <-- ADDED IMPORT

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.models.payments import Payment
from app.models.assignments import ChitAssignment 
from app.models.chits import ChitGroup # <-- ADDED IMPORT
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
        chit_month=payment.assignment.chit_month,
        member=member_response,
        chit_group=group_response
    )


@router.post("/", response_model=PaymentPublic, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_in: PaymentCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Logs a new payment."""
    
    # --- START: OVERPAYMENT VALIDATION ---
    
    # Eagerly load the chit_group related to the assignment
    assignment = await session.get(
        ChitAssignment, 
        payment_in.chit_assignment_id, 
        options=[selectinload(ChitAssignment.chit_group)]
    )
    
    if not assignment or not assignment.chit_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified assignment or its group could not be found."
        )
    
    monthly_installment = assignment.chit_group.monthly_installment
    
    # Get existing payments for this assignment
    existing_payments = await crud_payments.get_payments_for_assignment(
        session, 
        assignment_id=payment_in.chit_assignment_id
    )
    total_paid = sum(p.amount_paid for p in existing_payments)
    
    # Use a small tolerance for floating point comparisons
    due_amount = round(monthly_installment - total_paid, 2)
    
    if payment_in.amount_paid > (due_amount + 0.001):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Payment (₹{payment_in.amount_paid:.2f}) exceeds the due amount of ₹{due_amount:.2f}."
        )
    
    # --- END: OVERPAYMENT VALIDATION ---
    
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
    
    return await _get_payment_response(session, db_payment_with_relations)


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
                chit_month=assignment.chit_month,
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
        
    # --- START: OVERPAYMENT VALIDATION ---
    if payment_in.amount_paid is not None:
        # We have the group via the direct relationship on the payment model,
        # loaded by crud_payments.get_payment_by_id
        if not db_payment.chit_group:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve payment's group details for validation."
            )

        monthly_installment = db_payment.chit_group.monthly_installment
        
        # Get all other payments for this assignment
        all_payments = await crud_payments.get_payments_for_assignment(
            session, 
            assignment_id=db_payment.chit_assignment_id
        )
        
        # Sum all payments *except* the one being updated
        total_paid_without_this_one = sum(
            p.amount_paid for p in all_payments if p.id != payment_id
        )
        
        # Use a small tolerance for floating point comparisons
        due_amount = round(monthly_installment - total_paid_without_this_one, 2)
        
        if payment_in.amount_paid > (due_amount + 0.001):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Updated payment (₹{payment_in.amount_paid:.2f}) exceeds the total allowable amount of ₹{due_amount:.2f} for this assignment."
            )
    # --- END: OVERPAYMENT VALIDATION ---
        
    updated_payment = await crud_payments.update_payment(
        session=session, db_payment=db_payment, payment_in=payment_in
    )
    
    # refetch with relations for the response
    updated_payment_with_relations = await crud_payments.get_payment_by_id(session, updated_payment.id)
    
    return await _get_payment_response(session, updated_payment_with_relations)

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Deletes a payment."""
    db_payment = await crud_payments.get_payment_by_id(session, payment_id=payment_id)
    if not db_payment:
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
                chit_month=assignment.chit_month,
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
                chit_month=assignment.chit_month,
                member=member_response,
                chit_group=group_responses_cache.get(p.chit_group_id)
            )
        )
    return {"payments": response_payments}