# backend/app/api/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.security.dependencies import get_current_user
from app.db.session import get_session
from app.crud import crud_payments
from app.models.payments import Payment, PaymentType

from app.schemas.payments import PaymentCreate, PaymentUpdate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=List[PaymentResponse])
async def get_all_payments(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all payments."""
    return await crud_payments.get_all(session)


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
    """Get all payout payments for a specific slot."""
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
    """Create a new payment. Automatically updates related slot status for payout payments."""
    # Validate that slot_id is provided for payout payments
    if payment_in.payment_type == PaymentType.PAYOUT and not payment_in.slot_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="slot_id is required for payout payments"
        )
    
    # For collection payments: slot_id should be None
    if payment_in.payment_type == PaymentType.COLLECTION and payment_in.slot_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="slot_id should not be provided for collection payments"
        )
    
    return await crud_payments.create(session, payment_in)


@router.patch("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    payment_in: PaymentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update a payment. Automatically recalculates related slot status for payout payments."""
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
