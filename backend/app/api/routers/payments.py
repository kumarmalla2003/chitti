# backend/app/api/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.security.dependencies import get_current_user
from app.db.session import get_session
from app.crud import crud_payments
from app.models.payments import Payment, PaymentType

from app.schemas.payments import PaymentCreate, PaymentUpdate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=List[PaymentResponse])
async def get_all_payments(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    payment_type: Optional[PaymentType] = None,
    chit_id: Optional[int] = None,
    member_id: Optional[int] = None,
):
    """Get all payments. Optionally filter by payment_type, chit_id, or member_id."""
    if chit_id:
        payments = await crud_payments.get_by_chit(session, chit_id)
    elif member_id:
        payments = await crud_payments.get_by_member(session, member_id)
    else:
        payments = await crud_payments.get_all(session)
        
    if payment_type:
        payments = [p for p in payments if p.payment_type == payment_type]
    return payments


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific payment by ID."""
    payment = await crud_payments.get_by_id(session, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment


@router.get("/slot/{slot_id}", response_model=List[PaymentResponse])
async def get_payments_by_slot(
    slot_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all payments for a specific slot."""
    return await crud_payments.get_by_slot(session, slot_id)


@router.get("/chit/{chit_id}/month/{month}", response_model=List[PaymentResponse])
async def get_payments_by_chit_and_month(
    chit_id: int,
    month: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all payments for a specific chit in a specific month."""
    return await crud_payments.get_by_chit_and_month(session, chit_id, month)


@router.get("/member/{member_id}", response_model=List[PaymentResponse])
async def get_payments_by_member(
    member_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all payments for a specific member."""
    return await crud_payments.get_by_member(session, member_id)


@router.get("/chit/{chit_id}", response_model=List[PaymentResponse])
async def get_payments_by_chit(
    chit_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all payments for a specific chit."""
    return await crud_payments.get_by_chit(session, chit_id)


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_in: PaymentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new payment linked to a slot.
    Both collections and payouts require a valid slot_id.
    """
    try:
        return await crud_payments.create(session, payment_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )


@router.patch("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    payment_in: PaymentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update a payment. Only amount, date, method, and notes can be updated."""
    payment = await crud_payments.get_by_id(session, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return await crud_payments.update(session, payment, payment_in)


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Delete a payment. Automatically recalculates related slot status for payout payments."""
    payment = await crud_payments.get_by_id(session, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    await crud_payments.delete(session, payment)
