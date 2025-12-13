# backend/app/crud/crud_chits.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chits import Chit
from datetime import date
from dateutil.relativedelta import relativedelta
from app.schemas.chits import ChitResponse

async def get_chit_by_id(session: AsyncSession, chit_id: int) -> Chit | None:
    return await session.get(Chit, chit_id)

async def get_chit_by_id_with_details(session: AsyncSession, chit_id: int) -> ChitResponse | None:
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
        size=db_chit.size, 
        duration_months=db_chit.duration_months,
        start_date=db_chit.start_date,
        end_date=db_chit.end_date,
        status=status,
        chit_cycle=chit_cycle,
        collection_day=db_chit.collection_day,
        payout_day=db_chit.payout_day,
        # Chit type fields
        chit_type=db_chit.chit_type,
        monthly_installment=db_chit.monthly_installment,
        installment_before_payout=db_chit.installment_before_payout,
        installment_after_payout=db_chit.installment_after_payout,
    )

async def delete_chit_by_id(session: AsyncSession, db_chit: Chit):
    await session.delete(db_chit)
    await session.commit()