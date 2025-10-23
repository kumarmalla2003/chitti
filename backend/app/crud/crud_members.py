# backend/app/crud/crud_members.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_

from app.models.members import Member
from app.schemas.members import MemberCreate, MemberUpdate

async def get_member_by_phone(session: AsyncSession, phone_number: str) -> Member | None:
    statement = select(Member).where(Member.phone_number == phone_number)
    result = await session.execute(statement)
    return result.scalar_one_or_none()

async def create_member(session: AsyncSession, member_in: MemberCreate) -> Member:
    db_member = Member.model_validate(member_in)
    session.add(db_member)
    await session.commit()
    await session.refresh(db_member)
    return db_member

async def get_all_members(session: AsyncSession) -> list[Member]:
    statement = select(Member).order_by(Member.full_name)
    result = await session.execute(statement)
    return result.scalars().all()

async def search_members(session: AsyncSession, query: str) -> list[Member]:
    search_term = f"%{query.lower()}%"
    statement = select(Member).where(
        or_(
            Member.full_name.ilike(search_term),
            Member.phone_number.ilike(search_term)
        )
    ).order_by(Member.full_name)
    result = await session.execute(statement)
    return result.scalars().all()

async def get_member_by_id(session: AsyncSession, member_id: int) -> Member | None:
    member = await session.get(Member, member_id)
    return member

async def update_member(session: AsyncSession, db_member: Member, member_in: MemberUpdate) -> Member:
    member_data = member_in.model_dump(exclude_unset=True)
    for key, value in member_data.items():
        setattr(db_member, key, value)
    session.add(db_member)
    await session.commit()
    await session.refresh(db_member)
    return db_member

# --- ADD THIS NEW FUNCTION ---
async def delete_member_by_id(session: AsyncSession, db_member: Member):
    """Deletes a member from the database."""
    await session.delete(db_member)
    await session.commit()