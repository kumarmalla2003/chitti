# backend/app/crud/crud_payments.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date  # <--- IMPORT ADDED

from app.models.payments import Payment
from app.schemas.payments import PaymentCreate, PaymentUpdate

# ... (create_payment and get_payment_by_id remain unchanged) ...

async def create_payment(session: AsyncSession, payment_in: PaymentCreate) -> Payment:
    """Creates a new payment record."""
    db_payment = Payment.model_validate(payment_in)
    session.add(db_payment)
    await session.commit()
    await session.refresh(db_payment)
    return db_payment

async def get_payment_by_id(session: AsyncSession, payment_id: int) -> Optional[Payment]:
    """Gets a single payment by its ID, with related member, chit, and assignment."""
    result = await session.execute(
        select(Payment)
        .where(Payment.id == payment_id)
        .options(
            selectinload(Payment.member),
            selectinload(Payment.chit),
            selectinload(Payment.assignment)
        )
    )
    return result.scalar_one_or_none()

# --- MODIFIED FUNCTION ---
async def get_all_payments(
    session: AsyncSession, 
    chit_id: Optional[int] = None,
    member_id: Optional[int] = None,
    start_date: Optional[date] = None, # <--- PARAM ADDED
    end_date: Optional[date] = None    # <--- PARAM ADDED
) -> List[Payment]:
    """Gets all payments, with optional filters for chit, member, or date range."""
    statement = select(Payment).options(
        selectinload(Payment.member),
        selectinload(Payment.chit)
    ).order_by(Payment.payment_date.desc())
    
    # The backend applies whichever filters are provided.
    # This supports your "One of Three" logic perfectly.
    
    if chit_id:
        statement = statement.where(Payment.chit_id == chit_id)
    if member_id:
        statement = statement.where(Payment.member_id == member_id)
    
    # --- DATE FILTERS ADDED ---
    if start_date:
        statement = statement.where(Payment.payment_date >= start_date)
    if end_date:
        statement = statement.where(Payment.payment_date <= end_date)
        
    result = await session.execute(statement)
    return result.scalars().all()

# ... (update_payment, delete_payment, and other fetch functions remain unchanged) ...

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

async def delete_payment(session: AsyncSession, db_payment: Payment):
    """Deletes a payment record."""
    await session.delete(db_payment)
    await session.commit()
    return

async def get_payments_for_assignment(session: AsyncSession, assignment_id: int) -> List[Payment]:
    result = await session.execute(
        select(Payment)
        .where(Payment.chit_assignment_id == assignment_id)
        .order_by(Payment.payment_date.desc())
    )
    return result.scalars().all()

async def get_payments_for_chit(session: AsyncSession, chit_id: int) -> List[Payment]:
    result = await session.execute(
        select(Payment)
        .where(Payment.chit_id == chit_id)
        .options(selectinload(Payment.member)) 
        .order_by(Payment.payment_date.desc())
    )
    return result.scalars().all()

async def get_payments_for_member(session: AsyncSession, member_id: int) -> List[Payment]:
    result = await session.execute(
        select(Payment)
        .where(Payment.member_id == member_id)
        .options(selectinload(Payment.chit))
        .order_by(Payment.payment_date.desc())
    )
    return result.scalars().all()