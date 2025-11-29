# backend/app/api/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, List, Optional
from datetime import date
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.models.payments import Payment
from app.models.assignments import ChitAssignment 
from app.models.chits import Chit
from app.security.dependencies import get_current_user
from app.crud import crud_payments, crud_chits, crud_members
from app.schemas.payments import PaymentPublic, PaymentListResponse, PaymentCreate, PaymentUpdate
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitResponse

router = APIRouter(prefix="/payments", tags=["payments"])

async def _get_payment_response(session: AsyncSession, payment: Payment) -> PaymentPublic:
    """Helper to build the full PaymentPublic response."""
    chit_response = await crud_chits.get_chit_by_id_with_details(session, chit_id=payment.chit_id)
    member = await crud_members.get_member_by_id(session, member_id=payment.member_id)
    member_response = MemberPublic.model_validate(member) if member else None
    
    if not payment.assignment:
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
        chit=chit_response
    )

@router.post("/", response_model=PaymentPublic, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_in: PaymentCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    # Eagerly load the chit related to the assignment
    assignment = await session.get(
        ChitAssignment, 
        payment_in.chit_assignment_id, 
        options=[selectinload(ChitAssignment.chit)]
    )
    
    if not assignment or not assignment.chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified assignment or its chit could not be found."
        )
    
    monthly_installment = assignment.chit.monthly_installment
    
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
            detail=f"Payment ({payment_in.amount_paid:.2f}) exceeds the due amount of {due_amount:.2f}."
        )
    
    db_payment = Payment(
        amount_paid=payment_in.amount_paid,
        payment_date=payment_in.payment_date,
        payment_method=payment_in.payment_method,
        notes=payment_in.notes,
        chit_assignment_id=payment_in.chit_assignment_id,
        member_id=assignment.member_id,
        chit_id=assignment.chit_id
    )
    
    session.add(db_payment)
    await session.commit()
    await session.refresh(db_payment)
    
    # We need to refetch it with relations for the helper
    db_payment_with_relations = await crud_payments.get_payment_by_id(session, db_payment.id)
    
    return await _get_payment_response(session, db_payment_with_relations)


# --- MODIFIED ENDPOINT ---
@router.get("/", response_model=PaymentListResponse)
async def get_all_payments(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    chit_id: Optional[int] = Query(default=None),
    member_id: Optional[int] = Query(default=None),
    start_date: Optional[date] = Query(default=None), # <--- ADDED
    end_date: Optional[date] = Query(default=None),   # <--- ADDED
):
    """
    Retrieves all payments, optionally filtered by chit, member, or date range.
    """
    payments = await crud_payments.get_all_payments(
        session, 
        chit_id=chit_id, 
        member_id=member_id,
        start_date=start_date, # <--- PASSED TO CRUD
        end_date=end_date      # <--- PASSED TO CRUD
    )
    
    chit_responses_cache = {}
    
    response_payments = []
    for p in payments:
        if p.chit_id not in chit_responses_cache:
            chit_responses_cache[p.chit_id] = await crud_chits.get_chit_by_id_with_details(session, chit_id=p.chit_id)
        
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
                chit=chit_responses_cache.get(p.chit_id)
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
        
    if payment_in.amount_paid is not None:
        if not db_payment.chit:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve payment's chit details for validation."
            )

        monthly_installment = db_payment.chit.monthly_installment
        
        all_payments = await crud_payments.get_payments_for_assignment(
            session, 
            assignment_id=db_payment.chit_assignment_id
        )
        
        total_paid_without_this_one = sum(
            p.amount_paid for p in all_payments if p.id != payment_id
        )
        
        due_amount = round(monthly_installment - total_paid_without_this_one, 2)
        
        if payment_in.amount_paid > (due_amount + 0.001):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Updated payment ({payment_in.amount_paid:.2f}) exceeds the total allowable amount of {due_amount:.2f} for this assignment."
            )
        
    updated_payment = await crud_payments.update_payment(
        session=session, db_payment=db_payment, payment_in=payment_in
    )
    
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

@router.get("/chit/{chit_id}", response_model=PaymentListResponse)
async def get_payments_for_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Retrieves all payments for a specific chit."""
    payments = await crud_payments.get_payments_for_chit(session, chit_id=chit_id)
    
    chit_response = await crud_chits.get_chit_by_id_with_details(session, chit_id=chit_id)

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
                chit=chit_response
            )
        )
    return {"payments": response_payments}


@router.get("/member/{member_id}", response_model=PaymentListResponse)
async def get_payments_for_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Retrieves all payments for a specific member."""
    payments = await crud_payments.get_payments_for_member(session, member_id=member_id)
    
    chit_responses_cache = {}
    
    member = await crud_members.get_member_by_id(session, member_id=member_id)
    member_response = MemberPublic.model_validate(member) if member else None

    response_payments = []
    for p in payments:
        if p.chit_id not in chit_responses_cache:
            chit_responses_cache[p.chit_id] = await crud_chits.get_chit_by_id_with_details(session, chit_id=p.chit_id)

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
                chit=chit_responses_cache.get(p.chit_id)
            )
        )
    return {"payments": response_payments}