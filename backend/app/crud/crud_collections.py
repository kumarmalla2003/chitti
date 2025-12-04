# backend/app/crud/crud_collections.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date

from app.models.collections import Collection
from app.schemas.collections import CollectionCreate, CollectionUpdate

class CRUDCollection:
    async def create(self, db: AsyncSession, *, obj_in: CollectionCreate) -> Collection:
        db_obj = Collection.model_validate(obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get(self, db: AsyncSession, id: int) -> Optional[Collection]:
        result = await db.execute(
            select(Collection)
            .where(Collection.id == id)
            .options(
                selectinload(Collection.member),
                selectinload(Collection.chit),
                selectinload(Collection.assignment)
            )
        )
        return result.scalar_one_or_none()

    async def get_multi(
        self, db: AsyncSession, 
        chit_id: Optional[int] = None, 
        member_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Collection]:
        statement = select(Collection).options(
            selectinload(Collection.member),
            selectinload(Collection.chit),
            selectinload(Collection.assignment) # <-- ADDED: Fixes MissingGreenlet error
        ).order_by(Collection.collection_date.desc())
        
        if chit_id:
            statement = statement.where(Collection.chit_id == chit_id)
        if member_id:
            statement = statement.where(Collection.member_id == member_id)
        if start_date:
            statement = statement.where(Collection.collection_date >= start_date)
        if end_date:
            statement = statement.where(Collection.collection_date <= end_date)
            
        result = await db.execute(statement)
        return result.scalars().all()

    async def get_by_assignment(self, db: AsyncSession, assignment_id: int) -> List[Collection]:
        result = await db.execute(
            select(Collection)
            .where(Collection.chit_assignment_id == assignment_id)
            .order_by(Collection.collection_date.desc())
        )
        return result.scalars().all()

    async def update(self, db: AsyncSession, *, db_obj: Collection, obj_in: CollectionUpdate) -> Collection:
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, db_obj: Collection) -> None:
        await db.delete(db_obj)
        await db.commit()

collections = CRUDCollection()