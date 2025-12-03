# backend/app/crud/crud_assignments.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import date
from dateutil.relativedelta import relativedelta
from typing import List

from app.models.assignments import ChitAssignment
from app.models.chits import Chit # <-- RENAMED
# --- IMPORT NEW BULK SCHEMA ---
from app.schemas.assignments import ChitAssignmentCreate, ChitAssignmentBulkItem

async def create_assignment(session: AsyncSession, assignment_in: ChitAssignmentCreate) -> ChitAssignment:
    db_assignment = ChitAssignment.model_validate(assignment_in)
    session.add(db_assignment)
    await session.commit()
    await session.refresh(db_assignment)
    return db_assignment

# --- ADD NEW BULK CREATE FUNCTION ---
async def create_bulk_assignments(
    session: AsyncSession, 
    chit_id: int,
    assignments_in: List[ChitAssignmentBulkItem]
) -> bool:
    """
    Creates multiple chit assignments for a chit in a single transaction.
    """
    db_assignments = [
        ChitAssignment(
            member_id=item.member_id,
            chit_month=item.chit_month,
            chit_id=chit_id
        )
        for item in assignments_in
    ]
    
    if not db_assignments:
        return True # Nothing to add, but operation is "successful"

    session.add_all(db_assignments)
    await session.commit()
    return True

async def get_unassigned_months_for_chit(session: AsyncSession, chit_id: int) -> list[date]:
    # 1. Get the chit details
    chit = await session.get(Chit, chit_id) # <-- RENAMED
    if not chit:
        return []

    # 2. Generate all possible chit months for the chit's duration
    all_possible_months = set()
    current_month = chit.start_date
    for _ in range(chit.duration_months):
        all_possible_months.add(current_month)
        current_month += relativedelta(months=1)

    # 3. Get all months that are already assigned for this chit
    assigned_months_statement = select(ChitAssignment.chit_month).where(ChitAssignment.chit_id == chit_id)
    assigned_months_result = await session.execute(assigned_months_statement)
    assigned_months = set(assigned_months_result.scalars().all())

    # 4. Find the difference
    available_months = sorted(list(all_possible_months - assigned_months))

    return available_months

async def get_assignments_by_member_id(session: AsyncSession, member_id: int) -> list[ChitAssignment]:
    statement = (
        select(ChitAssignment)
        .where(ChitAssignment.member_id == member_id)
        .options(
            selectinload(ChitAssignment.chit),
            selectinload(ChitAssignment.member)
        )
        .order_by(ChitAssignment.chit_month)
    )
    result = await session.execute(statement)
    return result.scalars().all()


async def get_assignments_by_chit_id(session: AsyncSession, chit_id: int) -> list[ChitAssignment]:
    """Retrieves all assignments for a specific chit, eagerly loading members."""
    statement = (
        select(ChitAssignment)
        .where(ChitAssignment.chit_id == chit_id)
        .options(
            selectinload(ChitAssignment.member),
            selectinload(ChitAssignment.chit)
        ) 
        .order_by(ChitAssignment.chit_month)
    )
    result = await session.execute(statement)
    return result.scalars().all()

async def delete_assignment(session: AsyncSession, assignment_id: int) -> bool:
    """Deletes an assignment by its ID. Returns True if successful."""
    assignment = await session.get(ChitAssignment, assignment_id)
    if not assignment:
        return False
    await session.delete(assignment)
    await session.commit()
    return True