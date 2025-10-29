# backend/app/crud/crud_chits.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chits import ChitGroup, Payout
from datetime import date
from dateutil.relativedelta import relativedelta
from app.schemas.chits import ChitGroupResponse, PayoutCreate, PayoutUpdate

async def get_group_by_id(session: AsyncSession, group_id: int) -> ChitGroup | None:
    """Gets a single chit group by its ID."""
    group = await session.get(ChitGroup, group_id)
    return group

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
        id=db_group.id,
        name=db_group.name,
        chit_value=db_group.chit_value,
        group_size=db_group.group_size,
        monthly_installment=db_group.monthly_installment,
        duration_months=db_group.duration_months,
        start_date=db_group.start_date,
        end_date=db_group.end_date,
        status=status,
        chit_cycle=chit_cycle,
        collection_day=db_group.collection_day,
        payout_day=db_group.payout_day,
    )

async def delete_group_by_id(session: AsyncSession, db_group: ChitGroup):
    """Deletes a chit group from the database."""
    await session.delete(db_group)
    await session.commit()

# --- Payout CRUD Functions ---

async def create_payouts_for_group(session: AsyncSession, group_id: int, duration_months: int):
    """Creates initial payout entries for a new chit group."""
    payouts = [
        Payout(chit_group_id=group_id, month=month, payout_amount=0.0)
        for month in range(1, duration_months + 1)
    ]
    session.add_all(payouts)
    await session.commit()

async def get_payouts_by_group_id(session: AsyncSession, group_id: int) -> list[Payout]:
    """Retrieves all payouts for a specific chit group."""
    result = await session.execute(
        select(Payout).where(Payout.chit_group_id == group_id).order_by(Payout.month)
    )
    return result.scalars().all()

async def update_payout(session: AsyncSession, payout_id: int, payout_data: PayoutUpdate) -> Payout | None:
    """Updates a payout amount."""
    db_payout = await session.get(Payout, payout_id)
    if db_payout:
        db_payout.payout_amount = payout_data.payout_amount
        session.add(db_payout)
        await session.commit()
        await session.refresh(db_payout)
    return db_payout