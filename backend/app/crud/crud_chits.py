# backend/app/crud/crud_chits.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chits import Chit, Payout
from datetime import date
from dateutil.relativedelta import relativedelta
from app.schemas.chits import ChitResponse, PayoutCreate, PayoutUpdate

async def get_chit_by_id(session: AsyncSession, chit_id: int) -> Chit | None:
    """Gets a single chit by its ID."""
    chit = await session.get(Chit, chit_id)
    return chit

async def get_chit_by_id_with_details(session: AsyncSession, chit_id: int) -> ChitResponse | None:
    """Gets a chit and constructs the full response model with dynamic fields."""
    db_chit = await session.get(Chit, chit_id)
    if not db_chit:
        return None

    today = date.today()
    status = "Active" if db_chit.start_date <= today <= db_chit.end_date else "Inactive"
    
    if status == "Active":
        delta = relativedelta(today, db_chit.start_date)
        months_passed = delta.years * 12 + delta.months + 1
        chit_cycle = f"{months_passed}/{db_chit.duration_months}"
    else:
        chit_cycle = f"-/{db_chit.duration_months}"

    return ChitResponse(
        id=db_chit.id,
        name=db_chit.name,
        chit_value=db_chit.chit_value,
        group_size=db_chit.group_size,
        monthly_installment=db_chit.monthly_installment,
        duration_months=db_chit.duration_months,
        start_date=db_chit.start_date,
        end_date=db_chit.end_date,
        status=status,
        chit_cycle=chit_cycle,
        collection_day=db_chit.collection_day,
        payout_day=db_chit.payout_day,
    )

async def delete_chit_by_id(session: AsyncSession, db_chit: Chit):
    """Deletes a chit from the database."""
    await session.delete(db_chit)
    await session.commit()

# --- Payout CRUD Functions ---

async def create_payouts_for_chit(session: AsyncSession, chit_id: int, duration_months: int):
    """Creates initial payout entries for a new chit."""
    payouts = [
        Payout(chit_id=chit_id, month=month, payout_amount=0.0)
        for month in range(1, duration_months + 1)
    ]
    session.add_all(payouts)
    await session.commit()

async def get_payouts_by_chit_id(session: AsyncSession, chit_id: int) -> list[Payout]:
    """Retrieves all payouts for a specific chit."""
    result = await session.execute(
        select(Payout).where(Payout.chit_id == chit_id).order_by(Payout.month)
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