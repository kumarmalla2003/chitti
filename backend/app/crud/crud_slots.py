# backend/app/crud/crud_slots.py

from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload

from app.models.slots import ChitSlot, SlotStatus
from app.schemas.slots import ChitSlotUpdate


class CRUDSlot:
    async def create_slots_for_chit(
        self, 
        db: AsyncSession, 
        chit_id: int, 
        duration_months: int, 
        payout_amount: Optional[int] = None,
        payout_map: Optional[dict[int, int]] = None,
        expected_contribution: Optional[int] = None,
        contribution_map: Optional[dict[int, int]] = None,
        chit_type: str = "fixed"
    ):
        """Create slot entries for all months of a chit.
        
        Args:
            db: Database session
            chit_id: ID of the chit
            duration_months: Number of months for the chit
            payout_amount: Default payout amount (NULL for fixed/auction)
            payout_map: Optional map of month->payout_amount for variable schedules
            expected_contribution: Default expected contribution (NULL for auction)
            contribution_map: Optional map of month->expected_contribution for variable schedules
            chit_type: Type of chit (fixed/variable/auction)
        """
        slots = []
        for month in range(1, duration_months + 1):
            # Determine payout_amount for this slot
            if payout_map:
                amount = payout_map.get(month, payout_amount)
            else:
                amount = payout_amount  # Can be None for Fixed/Auction
            
            # Determine expected_contribution for this slot
            if contribution_map:
                contribution = contribution_map.get(month, expected_contribution)
            else:
                contribution = expected_contribution  # Can be None for Auction
            
            slots.append(
                ChitSlot(
                    chit_id=chit_id, 
                    month=month, 
                    payout_amount=amount,
                    expected_contribution=contribution,
                    status=SlotStatus.SCHEDULED
                )
            )
        db.add_all(slots)

    async def get(self, db: AsyncSession, id: int) -> Optional[ChitSlot]:
        result = await db.execute(
            select(ChitSlot)
            .where(ChitSlot.id == id)
            .options(
                selectinload(ChitSlot.member),
                selectinload(ChitSlot.chit),
                selectinload(ChitSlot.payments)
            )
        )
        return result.scalar_one_or_none()

    async def get_all(self, db: AsyncSession) -> List[ChitSlot]:
        """Get all slots."""
        result = await db.execute(
            select(ChitSlot)
            .options(
                selectinload(ChitSlot.member),
                selectinload(ChitSlot.chit),
                selectinload(ChitSlot.payments)
            )
            .order_by(ChitSlot.chit_id, ChitSlot.month)
        )
        return result.scalars().all()

    async def get_by_status(
        self, 
        db: AsyncSession,
        status: SlotStatus,
        chit_id: Optional[int] = None,
        member_id: Optional[int] = None
    ) -> List[ChitSlot]:
        """Get slots by status (scheduled, partial, paid, overdue)."""
        statement = (
            select(ChitSlot)
            .where(ChitSlot.status == status)
            .options(
                selectinload(ChitSlot.member),
                selectinload(ChitSlot.chit),
                selectinload(ChitSlot.payments)
            )
            .order_by(ChitSlot.chit_id, ChitSlot.month)
        )
        
        if chit_id:
            statement = statement.where(ChitSlot.chit_id == chit_id)
        if member_id:
            statement = statement.where(ChitSlot.member_id == member_id)
            
        result = await db.execute(statement)
        return result.scalars().all()
        
    async def get_by_chit(self, db: AsyncSession, chit_id: int) -> List[ChitSlot]:
        """Get all slots for a specific chit."""
        result = await db.execute(
            select(ChitSlot)
            .where(ChitSlot.chit_id == chit_id)
            .options(
                selectinload(ChitSlot.member),
                selectinload(ChitSlot.chit),
                selectinload(ChitSlot.payments)
            )
            .order_by(ChitSlot.month)
        )
        return result.scalars().all()

    async def get_by_chit_and_month(self, db: AsyncSession, chit_id: int, month: int) -> Optional[ChitSlot]:
        result = await db.execute(
            select(ChitSlot)
            .where(ChitSlot.chit_id == chit_id, ChitSlot.month == month)
            .options(
                selectinload(ChitSlot.member),
                selectinload(ChitSlot.chit),
                selectinload(ChitSlot.payments)
            )
        )
        return result.scalar_one_or_none()
        
    async def get_by_member(self, db: AsyncSession, member_id: int) -> List[ChitSlot]:
        """Get all slots assigned to a specific member."""
        result = await db.execute(
            select(ChitSlot)
            .where(ChitSlot.member_id == member_id)
            .options(
                selectinload(ChitSlot.chit),
                selectinload(ChitSlot.member),
                selectinload(ChitSlot.payments)
            )
            .order_by(ChitSlot.chit_id, ChitSlot.month)
        )
        return result.scalars().all()

    async def get_unassigned_months(self, db: AsyncSession, chit_id: int) -> List[int]:
        """Get list of month numbers that don't have a member assigned."""
        result = await db.execute(
            select(ChitSlot.month)
            .where(ChitSlot.chit_id == chit_id, ChitSlot.member_id.is_(None))
            .order_by(ChitSlot.month)
        )
        return list(result.scalars().all())

    async def get_assigned_slots(self, db: AsyncSession, chit_id: int) -> List[ChitSlot]:
        """Get all slots that have a member assigned."""
        result = await db.execute(
            select(ChitSlot)
            .where(ChitSlot.chit_id == chit_id, ChitSlot.member_id.isnot(None))
            .options(
                selectinload(ChitSlot.member),
                selectinload(ChitSlot.chit),
                selectinload(ChitSlot.payments)
            )
            .order_by(ChitSlot.month)
        )
        return result.scalars().all()

    async def assign_member(self, db: AsyncSession, slot: ChitSlot, member_id: int) -> ChitSlot:
        """Assign a member to a slot."""
        slot.member_id = member_id
        slot.updated_at = datetime.now(timezone.utc)
        db.add(slot)
        await db.commit()
        await db.refresh(slot)
        return slot

    async def unassign_member(self, db: AsyncSession, slot: ChitSlot) -> ChitSlot:
        """Remove member assignment from a slot."""
        slot.member_id = None
        slot.updated_at = datetime.now(timezone.utc)
        db.add(slot)
        await db.commit()
        await db.refresh(slot)
        return slot

    async def update(self, db: AsyncSession, *, db_obj: ChitSlot, obj_in: ChitSlotUpdate) -> ChitSlot:
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
        payout_amount: Optional[int] = None,
        payout_map: Optional[dict[int, int]] = None
    ):
        """Sync slot schedule when chit duration changes."""
        result = await db.execute(
            select(ChitSlot).where(ChitSlot.chit_id == chit_id).order_by(ChitSlot.month)
        )
        current_slots = result.scalars().all()
        current_count = len(current_slots)

        if new_duration == current_count:
            return

        if new_duration > current_count:
            new_slots = []
            for m in range(current_count + 1, new_duration + 1):
                amount = payout_map.get(m, payout_amount) if payout_map else payout_amount
                new_slots.append(
                    ChitSlot(
                        chit_id=chit_id, 
                        month=m, 
                        payout_amount=amount, 
                        status=SlotStatus.SCHEDULED
                    )
                )
            db.add_all(new_slots)
        
        elif new_duration < current_count:
            slots_to_delete = current_slots[new_duration:]
            for s in slots_to_delete:
                await db.delete(s)
                
        await db.commit()

    async def update_payout_amounts(
        self, 
        db: AsyncSession, 
        chit_id: int, 
        payout_amount: Optional[int],
        payout_map: Optional[dict[int, int]] = None
    ):
        """Update payout_amount for all slots of a chit.
        
        For Fixed/Auction chits where payout_amount is None (user-entered manually),
        this function should NOT be called - users enter values individually.
        """
        # Skip if payout_amount is None and no payout_map (Fixed/Auction chits)
        if payout_amount is None and not payout_map:
            return
            
        result = await db.execute(
            select(ChitSlot).where(ChitSlot.chit_id == chit_id)
        )
        slots = result.scalars().all()
        for slot in slots:
            amount = payout_map.get(slot.month, payout_amount) if payout_map else payout_amount
            slot.payout_amount = amount
            slot.updated_at = datetime.now(timezone.utc)
        await db.commit()

    async def delete(self, db: AsyncSession, *, db_obj: ChitSlot) -> None:
        await db.delete(db_obj)
        await db.commit()


slots = CRUDSlot()
