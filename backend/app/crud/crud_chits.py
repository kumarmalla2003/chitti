# backend/app/crud/crud_chits.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chits import ChitGroup
from datetime import date
from dateutil.relativedelta import relativedelta
from app.schemas.chits import ChitGroupResponse

async def get_group_by_id(session: AsyncSession, group_id: int) -> ChitGroup | None:
    """Gets a single chit group by its ID."""
    group = await session.get(ChitGroup, group_id)
    return group

# --- ADD THIS NEW HELPER FUNCTION ---
async def get_group_by_id_with_details(session: AsyncSession, group_id: int) -> ChitGroupResponse | None:
    """Gets a group and constructs the full response model with dynamic fields."""
    db_group = await session.get(ChitGroup, group_id)
    if not db_group:
        return None

    today = date.today()
    status = "Active" if db_group.start_date <= today <= db_group.end_date else "Inactive"
    
    if status == "Active":
        delta = relativedelta(today, db_group.start_date)
        months_passed = delta.years * 12 + delta.months + 1
        chit_cycle = f"{months_passed}/{db_group.duration_months}"
    else:
        chit_cycle = f"-/{db_group.duration_months}"

    return ChitGroupResponse(
        id=db_group.id, name=db_group.name, chit_value=db_group.chit_value,
        group_size=db_group.group_size, monthly_installment=db_group.monthly_installment,
        duration_months=db_group.duration_months, start_date=db_group.start_date,
        end_date=db_group.end_date, status=status, chit_cycle=chit_cycle
    )

async def delete_group_by_id(session: AsyncSession, db_group: ChitGroup):
    """Deletes a chit group from the database."""
    await session.delete(db_group)
    await session.commit()