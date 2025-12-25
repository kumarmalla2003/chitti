# backend/app/crud/crud_payments.py

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from datetime import date

from app.models.payments import Payment, PaymentType
from app.models.collections import Collection, CollectionStatus
from app.models.payouts import Payout, PayoutStatus
from app.schemas.payments import PaymentCreate, PaymentUpdate


async def create(db: AsyncSession, payment_in: PaymentCreate) -> Payment:
    """Create a new payment and update related schedule status."""
    payment_data = payment_in.model_dump()
    db_payment = Payment(**payment_data)
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    
    # Update the related schedule's status
    await update_schedule_status(db, db_payment)
    
    return db_payment


async def update_schedule_status(db: AsyncSession, payment: Payment) -> None:
    """Update the status of the related Collection or Payout based on total payments."""
    if payment.payment_type == PaymentType.COLLECTION and payment.collection_id:
        # Get the collection and calculate total payments
        collection = await db.get(Collection, payment.collection_id)
        if collection:
            total_paid = await get_total_for_collection(db, payment.collection_id)
            
            if total_paid >= collection.expected_amount:
                collection.status = CollectionStatus.COLLECTED
            elif total_paid > 0:
                collection.status = CollectionStatus.PARTIAL
            else:
                collection.status = CollectionStatus.SCHEDULED
            
            db.add(collection)
            await db.commit()
    
    elif payment.payment_type == PaymentType.PAYOUT and payment.payout_id:
        # Get the payout and calculate total payments
        payout = await db.get(Payout, payment.payout_id)
        if payout:
            total_paid = await get_total_for_payout(db, payment.payout_id)
            
            if total_paid >= payout.planned_amount:
                payout.status = PayoutStatus.PAID
            elif total_paid > 0:
                payout.status = PayoutStatus.PARTIAL
            else:
                payout.status = PayoutStatus.SCHEDULED
            
            db.add(payout)
            await db.commit()


async def get_total_for_collection(db: AsyncSession, collection_id: int) -> int:
    """Get total amount paid for a specific collection."""
    result = await db.execute(
        select(Payment).where(Payment.collection_id == collection_id)
    )
    payments = result.scalars().all()
    return sum(p.amount for p in payments)


async def get_total_for_payout(db: AsyncSession, payout_id: int) -> int:
    """Get total amount paid for a specific payout."""
    result = await db.execute(
        select(Payment).where(Payment.payout_id == payout_id)
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


async def get_by_collection(db: AsyncSession, collection_id: int) -> List[Payment]:
    """Get all payments for a specific collection."""
    result = await db.execute(
        select(Payment).where(Payment.collection_id == collection_id)
    )
    return list(result.scalars().all())


async def get_by_payout(db: AsyncSession, payout_id: int) -> List[Payment]:
    """Get all payments for a specific payout."""
    result = await db.execute(
        select(Payment).where(Payment.payout_id == payout_id)
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


async def update(db: AsyncSession, db_payment: Payment, payment_in: PaymentUpdate) -> Payment:
    """Update a payment."""
    payment_data = payment_in.model_dump(exclude_unset=True)
    for key, value in payment_data.items():
        setattr(db_payment, key, value)
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    
    # Re-calculate status
    await update_schedule_status(db, db_payment)
    
    return db_payment


async def delete(db: AsyncSession, db_payment: Payment) -> None:
    """Delete a payment and recalculate schedule status."""
    collection_id = db_payment.collection_id
    payout_id = db_payment.payout_id
    payment_type = db_payment.payment_type
    
    await db.delete(db_payment)
    await db.commit()
    
    # Recalculate status after deletion
    if payment_type == PaymentType.COLLECTION and collection_id:
        collection = await db.get(Collection, collection_id)
        if collection:
            total_paid = await get_total_for_collection(db, collection_id)
            if total_paid >= collection.expected_amount:
                collection.status = CollectionStatus.COLLECTED
            elif total_paid > 0:
                collection.status = CollectionStatus.PARTIAL
            else:
                collection.status = CollectionStatus.SCHEDULED
            db.add(collection)
            await db.commit()
    
    elif payment_type == PaymentType.PAYOUT and payout_id:
        payout = await db.get(Payout, payout_id)
        if payout:
            total_paid = await get_total_for_payout(db, payout_id)
            if total_paid >= payout.planned_amount:
                payout.status = PayoutStatus.PAID
            elif total_paid > 0:
                payout.status = PayoutStatus.PARTIAL
            else:
                payout.status = PayoutStatus.SCHEDULED
            db.add(payout)
            await db.commit()


# Module-level access
payments = type('PaymentsCRUD', (), {
    'create': create,
    'get_by_id': get_by_id,
    'get_all': get_all,
    'get_by_collection': get_by_collection,
    'get_by_payout': get_by_payout,
    'get_by_member': get_by_member,
    'get_by_chit': get_by_chit,
    'update': update,
    'delete': delete,
})()
