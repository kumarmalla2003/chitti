# backend/app/crud/crud_collections.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone

from app.models.collections import Collection, CollectionStatus
from app.schemas.collections import CollectionUpdate

class CRUDCollection:
    async def create_schedule_for_chit(
        self, 
        db: AsyncSession, 
        chit_id: int, 
        duration_months: int, 
        expected_amount: int = 0,
        schedule_map: Optional[dict[int, int]] = None
    ):
        """Create scheduled collection entries for all months of a chit.
        
        Args:
            db: Database session
            chit_id: ID of the chit
            duration_months: Number of months for the chit
            expected_amount: Default expected collection amount per month
            schedule_map: Optional map of month->amount for variable schedules
        """
        collections = []
        for month in range(1, duration_months + 1):
            amount = schedule_map.get(month, expected_amount) if schedule_map else expected_amount
            collections.append(
                Collection(chit_id=chit_id, month=month, expected_amount=amount, status=CollectionStatus.SCHEDULED)
            )
        db.add_all(collections)

    async def get(self, db: AsyncSession, id: int) -> Optional[Collection]:
        return await db.get(Collection, id)

    async def get_multi(
        self, db: AsyncSession, 
        chit_id: Optional[int] = None, 
        member_id: Optional[int] = None,
        status: Optional[CollectionStatus] = None
    ) -> List[Collection]:
        statement = select(Collection).options(
            selectinload(Collection.member),
            selectinload(Collection.chit),
            selectinload(Collection.assignment),
            selectinload(Collection.payments)
        ).order_by(Collection.chit_id, Collection.month)
        
        if chit_id:
            statement = statement.where(Collection.chit_id == chit_id)
        if member_id:
            statement = statement.where(Collection.member_id == member_id)
        if status:
            statement = statement.where(Collection.status == status)
            
        result = await db.execute(statement)
        return result.scalars().all()

    async def get_by_status(
        self, 
        db: AsyncSession,
        status: CollectionStatus,
        chit_id: Optional[int] = None,
        member_id: Optional[int] = None
    ) -> List[Collection]:
        """Get collections by status (scheduled, partial, collected, overdue)."""
        statement = (
            select(Collection)
            .where(Collection.status == status)
            .options(
                selectinload(Collection.member),
                selectinload(Collection.chit),
                selectinload(Collection.assignment),
                selectinload(Collection.payments)
            )
            .order_by(Collection.chit_id, Collection.month)
        )
        
        if chit_id:
            statement = statement.where(Collection.chit_id == chit_id)
        if member_id:
            statement = statement.where(Collection.member_id == member_id)
            
        result = await db.execute(statement)
        return result.scalars().all()

    async def get_by_chit(self, db: AsyncSession, chit_id: int) -> List[Collection]:
        """Get all collections for a chit."""
        result = await db.execute(
            select(Collection)
            .where(Collection.chit_id == chit_id)
            .options(
                selectinload(Collection.member),
                selectinload(Collection.chit),
                selectinload(Collection.assignment),
                selectinload(Collection.payments)
            )
            .order_by(Collection.month)
        )
        return result.scalars().all()

    async def get_by_chit_and_month(self, db: AsyncSession, chit_id: int, month: int) -> Optional[Collection]:
        result = await db.execute(
            select(Collection)
            .where(Collection.chit_id == chit_id, Collection.month == month)
            .options(
                selectinload(Collection.member),
                selectinload(Collection.chit),
                selectinload(Collection.assignment),
                selectinload(Collection.payments)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_assignment(self, db: AsyncSession, assignment_id: int) -> List[Collection]:
        result = await db.execute(
            select(Collection)
            .where(Collection.chit_assignment_id == assignment_id)
            .options(selectinload(Collection.payments))
            .order_by(Collection.month)
        )
        return result.scalars().all()

    async def update(self, db: AsyncSession, *, db_obj: Collection, obj_in: CollectionUpdate) -> Collection:
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
        expected_amount: int = 0,
        schedule_map: Optional[dict[int, int]] = None
    ):
        """Sync collection schedule when chit duration changes.
        
        Args:
            db: Database session
            chit_id: ID of the chit
            new_duration: New duration in months
            expected_amount: Default collection amount for new records
            schedule_map: Optional map of month->amount for variable schedules (used for new records)
        """
        result = await db.execute(
            select(Collection).where(Collection.chit_id == chit_id).order_by(Collection.month)
        )
        current_collections = result.scalars().all()
        current_count = len(current_collections)

        if new_duration == current_count:
            return

        if new_duration > current_count:
            new_collections = []
            for m in range(current_count + 1, new_duration + 1):
                amount = schedule_map.get(m, expected_amount) if schedule_map else expected_amount
                new_collections.append(
                    Collection(chit_id=chit_id, month=m, expected_amount=amount, status=CollectionStatus.SCHEDULED)
                )
            db.add_all(new_collections)
        
        elif new_duration < current_count:
            collections_to_delete = current_collections[new_duration:]
            for c in collections_to_delete:
                await db.delete(c)
                
        await db.commit()

    async def update_expected_amounts(
        self, 
        db: AsyncSession, 
        chit_id: int, 
        expected_amount: int,
        schedule_map: Optional[dict[int, int]] = None
    ):
        """Update expected_amount for all collections of a chit.
        
        Used when a fixed chit's monthly_installment changes, or when chit_type changes.
        
        Args:
            db: Database session
            chit_id: ID of the chit
            expected_amount: New expected amount to set (fallback)
            schedule_map: Optional map of month->amount for variable schedules
        """
        result = await db.execute(
            select(Collection).where(Collection.chit_id == chit_id)
        )
        collections = result.scalars().all()
        for collection in collections:
            amount = schedule_map.get(collection.month, expected_amount) if schedule_map else expected_amount
            collection.expected_amount = amount
            collection.updated_at = datetime.now(timezone.utc)
        await db.commit()

    async def link_to_assignment(self, db: AsyncSession, chit_id: int, month: int, assignment_id: int, member_id: int):
        """Link a collection record to an assignment when a member is assigned.
        
        Args:
            db: Database session
            chit_id: ID of the chit
            month: Month number (1, 2, 3...)
            assignment_id: ID of the assignment
            member_id: ID of the member
        """
        collection = await self.get_by_chit_and_month(db, chit_id, month)
        if collection:
            collection.chit_assignment_id = assignment_id
            collection.member_id = member_id
            collection.updated_at = datetime.now(timezone.utc)
            await db.commit()

    async def unlink_from_assignment(self, db: AsyncSession, assignment_id: int):
        """Unlink collection records from an assignment (when member is unassigned).
        
        Args:
            db: Database session
            assignment_id: ID of the assignment to unlink
        """
        result = await db.execute(
            select(Collection).where(Collection.chit_assignment_id == assignment_id)
        )
        collections = result.scalars().all()
        for collection in collections:
            collection.chit_assignment_id = None
            collection.member_id = None
            collection.updated_at = datetime.now(timezone.utc)
        await db.commit()

    async def delete(self, db: AsyncSession, *, db_obj: Collection) -> None:
        await db.delete(db_obj)
        await db.commit()

collections = CRUDCollection()