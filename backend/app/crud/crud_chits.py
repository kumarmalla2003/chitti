# backend/app/crud/crud_chits.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chits import ChitGroup

async def get_group_by_id(session: AsyncSession, group_id: int) -> ChitGroup | None:
    """Gets a single chit group by its ID."""
    group = await session.get(ChitGroup, group_id)
    return group

async def delete_group_by_id(session: AsyncSession, db_group: ChitGroup):
    """Deletes a chit group from the database."""
    await session.delete(db_group)
    await session.commit()