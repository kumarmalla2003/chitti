# backend/app/crud/crud_payouts.py

from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload

from app.models.payouts import Payout, PayoutStatus
from app.schemas.payouts import PayoutUpdate

class CRUDPayout:
    async def create_schedule_for_chit(
        self, 
        db: AsyncSession, 
        chit_id: int, 
        duration_months: int, 
        planned_amount: int = 0,
        schedule_map: Optional[dict[int, int]] = None
    ):
        """Create scheduled payout entries for all months of a chit."""
        payouts = []
        for month in range(1, duration_months + 1):
            amount = schedule_map.get(month, planned_amount) if schedule_map else planned_amount
            payouts.append(
                Payout(chit_id=chit_id, month=month, planned_amount=amount, status=PayoutStatus.SCHEDULED)
            )
        db.add_all(payouts)

    async def get(self, db: AsyncSession, id: int) -> Optional[Payout]:
        result = await db.execute(
            select(Payout)
            .where(Payout.id == id)
            .options(
                selectinload(Payout.member), 
                selectinload(Payout.chit),
                selectinload(Payout.assignment),
                selectinload(Payout.payments)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_status(
        self, 
        db: AsyncSession,
        status: PayoutStatus,
        chit_id: Optional[int] = None,
        member_id: Optional[int] = None
    ) -> List[Payout]:
        """Get payouts by status (scheduled, partial, paid, overdue)."""
        statement = (
            select(Payout)
            .where(Payout.status == status)
            .options(
                selectinload(Payout.member), 
                selectinload(Payout.chit),
                selectinload(Payout.assignment),
                selectinload(Payout.payments)
            )
            .order_by(Payout.chit_id, Payout.month)
        )
        
        if chit_id:
            statement = statement.where(Payout.chit_id == chit_id)
        if member_id:
            statement = statement.where(Payout.member_id == member_id)
            
        result = await db.execute(statement)
        return result.scalars().all()
    
    async def get_all(self, db: AsyncSession) -> List[Payout]:
        """Get all payouts for schedule display."""
        result = await db.execute(
            select(Payout)
            .where(Payout.chit_id.is_not(None))
            .options(
                selectinload(Payout.member),
                selectinload(Payout.chit),
                selectinload(Payout.assignment),
                selectinload(Payout.payments)
            )
            .order_by(Payout.chit_id, Payout.month)
        )
        return result.scalars().all()
        
    async def get_by_chit(self, db: AsyncSession, chit_id: int) -> List[Payout]:
        """Get all payouts for a specific chit."""
        result = await db.execute(
            select(Payout)
            .where(Payout.chit_id == chit_id)
            .options(
                selectinload(Payout.member),
                selectinload(Payout.chit),
                selectinload(Payout.assignment),
                selectinload(Payout.payments)
            )
            .order_by(Payout.month)
        )
        return result.scalars().all()

    async def get_by_chit_and_month(self, db: AsyncSession, chit_id: int, month: int) -> Optional[Payout]:
        result = await db.execute(
            select(Payout)
            .where(Payout.chit_id == chit_id, Payout.month == month)
            .options(
                selectinload(Payout.member),
                selectinload(Payout.chit),
                selectinload(Payout.assignment),
                selectinload(Payout.payments)
            )
        )
        return result.scalar_one_or_none()
        
    async def get_by_member(self, db: AsyncSession, member_id: int) -> List[Payout]:
        """Get all payouts for a specific member."""
        result = await db.execute(
            select(Payout)
            .where(Payout.member_id == member_id)
            .options(
                selectinload(Payout.chit),
                selectinload(Payout.member),
                selectinload(Payout.assignment),
                selectinload(Payout.payments)
            )
            .order_by(Payout.chit_id, Payout.month)
        )
        return result.scalars().all()

    async def update(self, db: AsyncSession, *, db_obj: Payout, obj_in: PayoutUpdate) -> Payout:
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        db_obj.updated_at = datetime.now(timezone.utc)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def sync_schedule(
        self, 
        db: AsyncSession, 
        chit_id: int, 
        new_duration: int,
        planned_amount: int = 0,
        schedule_map: Optional[dict[int, int]] = None
    ):
        """Sync payout schedule when chit duration changes."""
        result = await db.execute(
            select(Payout).where(Payout.chit_id == chit_id).order_by(Payout.month)
        )
        current_payouts = result.scalars().all()
        current_count = len(current_payouts)

        if new_duration == current_count:
            return

        if new_duration > current_count:
            new_payouts = []
            for m in range(current_count + 1, new_duration + 1):
                amount = schedule_map.get(m, planned_amount) if schedule_map else planned_amount
                new_payouts.append(
                    Payout(chit_id=chit_id, month=m, planned_amount=amount, status=PayoutStatus.SCHEDULED)
                )
            db.add_all(new_payouts)
        
        elif new_duration < current_count:
            payouts_to_delete = current_payouts[new_duration:]
            for p in payouts_to_delete:
                await db.delete(p)
                
        await db.commit()

    async def update_planned_amounts(
        self, 
        db: AsyncSession, 
        chit_id: int, 
        planned_amount: int,
        schedule_map: Optional[dict[int, int]] = None
    ):
        """Update planned_amount for all payouts of a chit."""
        result = await db.execute(
            select(Payout).where(Payout.chit_id == chit_id)
        )
        payouts = result.scalars().all()
        for payout in payouts:
            amount = schedule_map.get(payout.month, planned_amount) if schedule_map else planned_amount
            payout.planned_amount = amount
            payout.updated_at = datetime.now(timezone.utc)
        await db.commit()

    async def delete(self, db: AsyncSession, *, db_obj: Payout) -> None:
        await db.delete(db_obj)
        await db.commit()

payouts = CRUDPayout()