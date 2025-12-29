# backend/app/crud/crud_payments.py

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone

from app.models.payments import Payment, PaymentType
from app.models.slots import ChitSlot, SlotStatus
from app.schemas.payments import PaymentCreate, PaymentUpdate


async def create(db: AsyncSession, payment_in: PaymentCreate) -> Payment:
    """
    Create a new payment linked to a slot.
    Validates slot exists and has a member assigned.
    For collections: validates collection_month is provided and within range.
    For payouts: validates collection_month is None.
    """
    from app.models.chits import Chit
    
    # Validate slot exists and has member assigned
    slot = await db.get(ChitSlot, payment_in.slot_id)
    if not slot:
        raise ValueError(f"Slot {payment_in.slot_id} not found")
    if not slot.member_id:
        raise ValueError(f"Slot {payment_in.slot_id} has no member assigned")
    
    # Validate collection_month based on payment type
    if payment_in.payment_type == PaymentType.COLLECTION:
        if payment_in.collection_month is None:
            raise ValueError("collection_month is required for collection payments")
        # Get chit to validate range
        chit = await db.get(Chit, slot.chit_id)
        if not chit:
            raise ValueError(f"Chit {slot.chit_id} not found")
        if payment_in.collection_month < 1 or payment_in.collection_month > chit.duration_months:
            raise ValueError(f"collection_month must be between 1 and {chit.duration_months}")
    elif payment_in.payment_type == PaymentType.PAYOUT:
        if payment_in.collection_month is not None:
            raise ValueError("collection_month must be None for payout payments")
    
    payment_data = payment_in.model_dump()
    db_payment = Payment(**payment_data)
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    
    # Eagerly load relationships for response serialization
    await db.refresh(db_payment, ["slot"])
    # Load nested relationships from slot
    if db_payment.slot:
        await db.refresh(db_payment.slot, ["member", "chit"])
    
    # Update the related slot's status for payout payments
    if payment_in.payment_type == PaymentType.PAYOUT:
        await update_slot_status(db, db_payment)
    
    return db_payment


async def update_slot_status(db: AsyncSession, payment: Payment) -> None:
    """Update the status of the related ChitSlot based on total payout payments."""
    if payment.payment_type == PaymentType.PAYOUT and payment.slot_id:
        slot = await db.get(ChitSlot, payment.slot_id)
        if slot:
            total_paid = await get_total_for_slot(db, payment.slot_id, PaymentType.PAYOUT)
            payout_amount = slot.payout_amount or 0
            
            if payout_amount > 0 and total_paid >= payout_amount:
                slot.status = SlotStatus.PAID
            elif total_paid > 0:
                slot.status = SlotStatus.PARTIAL
            else:
                slot.status = SlotStatus.SCHEDULED
            
            slot.updated_at = datetime.now(timezone.utc)
            db.add(slot)
            await db.commit()


async def get_total_for_slot(
    db: AsyncSession, 
    slot_id: int, 
    payment_type: Optional[PaymentType] = None
) -> int:
    """Get total amount paid for a specific slot, optionally filtered by payment type."""
    query = select(Payment).where(Payment.slot_id == slot_id)
    if payment_type:
        query = query.where(Payment.payment_type == payment_type)
    result = await db.execute(query)
    payments = result.scalars().all()
    return sum(p.amount for p in payments)


async def get_collection_total_for_slot(db: AsyncSession, slot_id: int) -> int:
    """Get total collection payment amount for a specific slot."""
    return await get_total_for_slot(db, slot_id, PaymentType.COLLECTION)


async def get_by_id(db: AsyncSession, payment_id: int) -> Optional[Payment]:
    """Get a payment by ID with relationships loaded."""
    result = await db.execute(
        select(Payment)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .where(Payment.id == payment_id)
    )
    return result.scalars().first()


async def get_all(db: AsyncSession) -> List[Payment]:
    """Get all payments with relationships loaded."""
    result = await db.execute(
        select(Payment)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def get_by_slot(db: AsyncSession, slot_id: int) -> List[Payment]:
    """Get all payments for a specific slot."""
    result = await db.execute(
        select(Payment)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .where(Payment.slot_id == slot_id)
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def get_by_member(db: AsyncSession, member_id: int) -> List[Payment]:
    """Get all payments for a specific member (via slot.member_id)."""
    result = await db.execute(
        select(Payment)
        .join(ChitSlot)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .where(ChitSlot.member_id == member_id)
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def get_by_chit(db: AsyncSession, chit_id: int) -> List[Payment]:
    """Get all payments for a specific chit (via slot.chit_id)."""
    result = await db.execute(
        select(Payment)
        .join(ChitSlot)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .where(ChitSlot.chit_id == chit_id)
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def get_by_chit_and_month(db: AsyncSession, chit_id: int, month: int) -> List[Payment]:
    """Get all payments for a specific chit in a specific month (via slot)."""
    result = await db.execute(
        select(Payment)
        .join(ChitSlot)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .where(ChitSlot.chit_id == chit_id, ChitSlot.month == month)
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
        .join(ChitSlot)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .where(
            ChitSlot.chit_id == chit_id,
            ChitSlot.month == month,
            Payment.payment_type == PaymentType.COLLECTION
        )
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


async def update(db: AsyncSession, db_payment: Payment, payment_in: PaymentUpdate) -> Payment:
    """Update a payment (only transaction details, not slot reference)."""
    payment_data = payment_in.model_dump(exclude_unset=True)
    for key, value in payment_data.items():
        setattr(db_payment, key, value)
    db_payment.updated_at = datetime.now(timezone.utc)
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    
    # Eagerly load relationships for response serialization
    await db.refresh(db_payment, ["slot"])
    if db_payment.slot:
        await db.refresh(db_payment.slot, ["member", "chit"])
    
    # Re-calculate slot status for payout payments
    if db_payment.payment_type == PaymentType.PAYOUT:
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
            total_paid = await get_total_for_slot(db, slot_id, PaymentType.PAYOUT)
            payout_amount = slot.payout_amount or 0
            if payout_amount > 0 and total_paid >= payout_amount:
                slot.status = SlotStatus.PAID
            elif total_paid > 0:
                slot.status = SlotStatus.PARTIAL
            else:
                slot.status = SlotStatus.SCHEDULED
            slot.updated_at = datetime.now(timezone.utc)
            db.add(slot)
            await db.commit()


async def get_by_slot_and_collection_month(
    db: AsyncSession, 
    slot_id: int, 
    collection_month: int
) -> List[Payment]:
    """Get all payments for a specific slot AND collection_month."""
    result = await db.execute(
        select(Payment)
        .options(
            selectinload(Payment.slot).selectinload(ChitSlot.member),
            selectinload(Payment.slot).selectinload(ChitSlot.chit)
        )
        .where(Payment.slot_id == slot_id, Payment.collection_month == collection_month)
        .order_by(Payment.date.desc())
    )
    return list(result.scalars().all())


# Module-level access
payments = type('PaymentsCRUD', (), {
    'create': create,
    'get_by_id': get_by_id,
    'get_all': get_all,
    'get_by_slot': get_by_slot,
    'get_by_slot_and_collection_month': get_by_slot_and_collection_month,
    'get_by_member': get_by_member,
    'get_by_chit': get_by_chit,
    'get_by_chit_and_month': get_by_chit_and_month,
    'get_collections_by_chit_and_month': get_collections_by_chit_and_month,
    'get_collection_total_for_slot': get_collection_total_for_slot,
    'get_total_for_slot': get_total_for_slot,
    'update': update,
    'delete': delete,
})()
