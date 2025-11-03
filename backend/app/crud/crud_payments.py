# backend/app/crud/crud_payments.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models.payments import Payment
from app.schemas.payments import PaymentCreate, PaymentUpdate

# --- NEW FUNCTION ---
async def create_payment(session: AsyncSession, payment_in: PaymentCreate) -> Payment:
    """Creates a new payment record."""
    db_payment = Payment.model_validate(payment_in)
    session.add(db_payment)
    await session.commit()
    await session.refresh(db_payment)
    return db_payment

# --- MODIFIED FUNCTION ---
async def get_payment_by_id(session: AsyncSession, payment_id: int) -> Optional[Payment]:
    """Gets a single payment by its ID, with related member, group, and assignment."""
    result = await session.execute(
        select(Payment)
        .where(Payment.id == payment_id)
        .options(
            selectinload(Payment.member),
            selectinload(Payment.chit_group),
            selectinload(Payment.assignment)  # <-- ADDED THIS LINE
        )
    )
    return result.scalar_one_or_none()

# --- NEW FUNCTION ---
async def get_all_payments(
    session: AsyncSession, 
    group_id: Optional[int] = None, 
    member_id: Optional[int] = None
) -> List[Payment]:
    """Gets all payments, with optional filters for group or member."""
    statement = select(Payment).options(
        selectinload(Payment.member),
        selectinload(Payment.chit_group)
    ).order_by(Payment.payment_date.desc())
    
    if group_id:
        statement = statement.where(Payment.chit_group_id == group_id)
    if member_id:
        statement = statement.where(Payment.member_id == member_id)
        
    result = await session.execute(statement)
    return result.scalars().all()

# --- NEW FUNCTION ---
async def update_payment(
    session: AsyncSession, 
    db_payment: Payment, 
    payment_in: PaymentUpdate
) -> Payment:
    """Updates a payment record."""
    payment_data = payment_in.model_dump(exclude_unset=True)
    for key, value in payment_data.items():
        setattr(db_payment, key, value)
    session.add(db_payment)
    await session.commit()
    await session.refresh(db_payment)
    return db_payment

# --- NEW FUNCTION ---
async def delete_payment(session: AsyncSession, db_payment: Payment):
    """Deletes a payment record."""
    await session.delete(db_payment)
    await session.commit()
    return

# --- Phase 1 Functions (Unchanged) ---

async def get_payments_for_assignment(session: AsyncSession, assignment_id: int) -> List[Payment]:
    """Gets all payments for a single assignment."""
    result = await session.execute(
        select(Payment)
        .where(Payment.chit_assignment_id == assignment_id)
        .order_by(Payment.payment_date.desc())
    )
    return result.scalars().all()

async def get_payments_for_group(session: AsyncSession, group_id: int) -> List[Payment]:
    """Gets all payments for an entire group."""
    result = await session.execute(
        select(Payment)
        .where(Payment.chit_group_id == group_id)
        .options(
            selectinload(Payment.member) # Eager load member details
        ) 
        .order_by(Payment.payment_date.desc())
    )
    return result.scalars().all()

async def get_payments_for_member(session: AsyncSession, member_id: int) -> List[Payment]:
    """Gets all payments made by a single member."""
    result = await session.execute(
        select(Payment)
        .where(Payment.member_id == member_id)
        .options(
            selectinload(Payment.chit_group) # Eager load group details
        )
        .order_by(Payment.payment_date.desc())
    )
    return result.scalars().all()