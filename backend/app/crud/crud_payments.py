# backend/app/crud/crud_payments.py

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from datetime import datetime, timezone

from app.models.payments import Payment, PaymentType
from app.models.slots import ChitSlot, SlotStatus
from app.schemas.payments import PaymentCreate, PaymentUpdate


async def create(db: AsyncSession, payment_in: PaymentCreate) -> Payment:
    """Create a new payment and update related slot status if payout."""
    payment_data = payment_in.model_dump()
    db_payment = Payment(**payment_data)
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    
    # Update the related slot's status for payout payments
    if payment_in.payment_type == PaymentType.PAYOUT and payment_in.slot_id:
        await update_slot_status(db, db_payment)
    
    return db_payment


async def update_slot_status(db: AsyncSession, payment: Payment) -> None:
    """Update the status of the related ChitSlot based on total payout payments."""
    if payment.payment_type == PaymentType.PAYOUT and payment.slot_id:
        slot = await db.get(ChitSlot, payment.slot_id)
        if slot:
            total_paid = await get_total_for_slot(db, payment.slot_id)
            
            if total_paid >= slot.payout_amount:
                slot.status = SlotStatus.PAID
            elif total_paid > 0:
                slot.status = SlotStatus.PARTIAL
            else:
                slot.status = SlotStatus.SCHEDULED
            
            slot.updated_at = datetime.now(timezone.utc)
            db.add(slot)
            await db.commit()


async def get_total_for_slot(db: AsyncSession, slot_id: int) -> int:
    """Get total amount paid for a specific slot (payout payments)."""
    result = await db.execute(
        select(Payment).where(Payment.slot_id == slot_id)
    )
    payments = result.scalars().all()
    return sum(p.amount for p in payments)


async def get_collection_total_for_member(
    db: AsyncSession, 
    chit_id: int, 
    member_id: int, 
    month: int
) -> int:
    """Get total collection payment amount for a specific member in a specific month."""
    result = await db.execute(
        select(Payment)
        .where(
            Payment.chit_id == chit_id,
            Payment.member_id == member_id,
            Payment.month == month,
            Payment.payment_type == PaymentType.COLLECTION
        )
    )
    payments = result.scalars().all()
    return sum(p.amount for p in payments)


async def get_by_id(db: AsyncSession, payment_id: int) -> Optional[Payment]:
    """Get a payment by ID."""
    return await db.get(Payment, payment_id)


async def get_all(db: AsyncSession) -> List[Payment]:
    """Get all payments."""
    result = await db.execute(select(Payment).order_by(Payment.date.desc()))
    return list(result.scalars().all())


async def get_by_slot(db: AsyncSession, slot_id: int) -> List[Payment]:
    """Get all payments for a specific slot (payout payments)."""
    result = await db.execute(
        select(Payment).where(Payment.slot_id == slot_id)
    )
    return list(result.scalars().all())


async def get_by_member(db: AsyncSession, member_id: int) -> List[Payment]:
    """Get all payments for a specific member."""
    result = await db.execute(
        select(Payment).where(Payment.member_id == member_id).order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def get_by_chit(db: AsyncSession, chit_id: int) -> List[Payment]:
    """Get all payments for a specific chit."""
    result = await db.execute(
        select(Payment).where(Payment.chit_id == chit_id).order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def get_by_chit_and_month(db: AsyncSession, chit_id: int, month: int) -> List[Payment]:
    """Get all payments for a specific chit in a specific month."""
    result = await db.execute(
        select(Payment)
        .where(Payment.chit_id == chit_id, Payment.month == month)
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def get_collections_by_chit_and_month(
    db: AsyncSession, 
    chit_id: int, 
    month: int
) -> List[Payment]:
    """Get all collection payments for a specific chit and month."""
    result = await db.execute(
        select(Payment)
        .where(
            Payment.chit_id == chit_id,
            Payment.month == month,
            Payment.payment_type == PaymentType.COLLECTION
        )
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def update(db: AsyncSession, db_payment: Payment, payment_in: PaymentUpdate) -> Payment:
    """Update a payment."""
    payment_data = payment_in.model_dump(exclude_unset=True)
    for key, value in payment_data.items():
        setattr(db_payment, key, value)
    db_payment.updated_at = datetime.now(timezone.utc)
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    
    # Re-calculate slot status for payout payments
    if db_payment.payment_type == PaymentType.PAYOUT and db_payment.slot_id:
        await update_slot_status(db, db_payment)
    
    return db_payment


async def delete(db: AsyncSession, db_payment: Payment) -> None:
    """Delete a payment and recalculate slot status if payout."""
    slot_id = db_payment.slot_id
    payment_type = db_payment.payment_type
    
    await db.delete(db_payment)
    await db.commit()
    
    # Recalculate slot status after deletion for payout payments
    if payment_type == PaymentType.PAYOUT and slot_id:
        slot = await db.get(ChitSlot, slot_id)
        if slot:
            total_paid = await get_total_for_slot(db, slot_id)
            if total_paid >= slot.payout_amount:
                slot.status = SlotStatus.PAID
            elif total_paid > 0:
                slot.status = SlotStatus.PARTIAL
            else:
                slot.status = SlotStatus.SCHEDULED
            slot.updated_at = datetime.now(timezone.utc)
            db.add(slot)
            await db.commit()


# Module-level access
payments = type('PaymentsCRUD', (), {
    'create': create,
    'get_by_id': get_by_id,
    'get_all': get_all,
    'get_by_slot': get_by_slot,
    'get_by_member': get_by_member,
    'get_by_chit': get_by_chit,
    'get_by_chit_and_month': get_by_chit_and_month,
    'get_collections_by_chit_and_month': get_collections_by_chit_and_month,
    'get_collection_total_for_member': get_collection_total_for_member,
    'get_total_for_slot': get_total_for_slot,
    'update': update,
    'delete': delete,
})()
