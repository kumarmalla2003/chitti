# backend/app/crud/crud_payouts.py

from typing import List, Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload
from app.models.payouts import Payout
from app.schemas.payouts import PayoutUpdate

class CRUDPayout:
    async def create_schedule_for_chit(self, db: AsyncSession, chit_id: int, duration_months: int):
        """Creates initial payout schedule rows for a new chit."""
        payouts = [
            Payout(chit_id=chit_id, month=month, planned_amount=0.0)
            for month in range(1, duration_months + 1)
        ]
        db.add_all(payouts)

    async def get(self, db: AsyncSession, id: int) -> Optional[Payout]:
        result = await db.execute(
            select(Payout)
            .where(Payout.id == id)
            .options(selectinload(Payout.member), selectinload(Payout.chit))
        )
        return result.scalar_one_or_none()

    async def get_all_paid(
        self, 
        db: AsyncSession,
        chit_id: Optional[int] = None,
        member_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Payout]:
        """Get all payouts that have been paid, with optional filters."""
        statement = (
            select(Payout)
            .where(Payout.paid_date.is_not(None))
            .options(selectinload(Payout.member), selectinload(Payout.chit))
            .order_by(Payout.paid_date.desc())
        )

        if chit_id:
            statement = statement.where(Payout.chit_id == chit_id)
        if member_id:
            statement = statement.where(Payout.member_id == member_id)
        if start_date:
            statement = statement.where(Payout.paid_date >= start_date)
        if end_date:
            statement = statement.where(Payout.paid_date <= end_date)

        result = await db.execute(statement)
        return result.scalars().all()
    
    async def get_by_chit(self, db: AsyncSession, chit_id: int) -> List[Payout]:
        """Retrieves all payouts (schedule + history) for a specific chit."""
        result = await db.execute(
            select(Payout)
            .where(Payout.chit_id == chit_id)
            .options(
                selectinload(Payout.member),
                selectinload(Payout.chit)  # <--- FIXED: Added this
            )
            .order_by(Payout.month)
        )
        return result.scalars().all()
        
    async def get_by_member(self, db: AsyncSession, member_id: int) -> List[Payout]:
        """Retrieves only paid payouts for a specific member."""
        result = await db.execute(
            select(Payout)
            .where(Payout.member_id == member_id)
            .options(
                selectinload(Payout.chit),
                selectinload(Payout.member) # <--- FIXED: Added this
            )
            .order_by(Payout.paid_date.desc())
        )
        return result.scalars().all()

    async def update(self, db: AsyncSession, *, db_obj: Payout, obj_in: PayoutUpdate) -> Payout:
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def reset_transaction(self, db: AsyncSession, *, db_obj: Payout) -> Payout:
        """Clears transaction data but keeps the schedule row."""
        db_obj.amount = None
        db_obj.paid_date = None
        db_obj.method = None
        db_obj.notes = None
        db_obj.member_id = None
        db_obj.chit_assignment_id = None
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def sync_schedule(self, db: AsyncSession, chit_id: int, new_duration: int):
        """Synchronizes Payout rows when Chit duration changes."""
        result = await db.execute(
            select(Payout).where(Payout.chit_id == chit_id).order_by(Payout.month)
        )
        current_payouts = result.scalars().all()
        current_count = len(current_payouts)

        if new_duration == current_count:
            return

        if new_duration > current_count:
            new_payouts = [
                Payout(chit_id=chit_id, month=m, planned_amount=0.0)
                for m in range(current_count + 1, new_duration + 1)
            ]
            db.add_all(new_payouts)
        
        elif new_duration < current_count:
            payouts_to_delete = current_payouts[new_duration:]
            for p in payouts_to_delete:
                await db.delete(p)
                
        await db.commit()

payouts = CRUDPayout()