# backend/app/crud/crud_assignments.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import date
from dateutil.relativedelta import relativedelta

from app.models.assignments import ChitAssignment
from app.models.chits import ChitGroup
from app.schemas.assignments import ChitAssignmentCreate

async def create_assignment(session: AsyncSession, assignment_in: ChitAssignmentCreate) -> ChitAssignment:
    db_assignment = ChitAssignment.model_validate(assignment_in)
    session.add(db_assignment)
    await session.commit()
    await session.refresh(db_assignment)
    return db_assignment

async def get_unassigned_months_for_group(session: AsyncSession, group_id: int) -> list[date]:
    # 1. Get the chit group details
    chit_group = await session.get(ChitGroup, group_id)
    if not chit_group:
        return []

    # 2. Generate all possible chit months for the group's duration
    all_possible_months = set()
    current_month = chit_group.start_date
    for _ in range(chit_group.duration_months):
        all_possible_months.add(current_month)
        current_month += relativedelta(months=1)

    # 3. Get all months that are already assigned for this group
    assigned_months_statement = select(ChitAssignment.chit_month).where(ChitAssignment.chit_group_id == group_id)
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
            selectinload(ChitAssignment.chit_group),
            selectinload(ChitAssignment.member)  # Eagerly load the member as well
        )
        .order_by(ChitAssignment.chit_month)
    )
    result = await session.execute(statement)
    return result.scalars().all()

# --- ADD THIS NEW FUNCTION ---
async def get_assignments_by_group_id(session: AsyncSession, group_id: int) -> list[ChitAssignment]:
    """Retrieves all assignments for a specific group."""
    statement = select(ChitAssignment).where(ChitAssignment.chit_group_id == group_id)
    result = await session.execute(statement)
    return result.scalars().all()