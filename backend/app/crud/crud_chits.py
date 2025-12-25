# backend/app/crud/crud_chits.py

from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chits import Chit
from app.models.assignments import ChitAssignment
from datetime import date, datetime, timezone
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

    # Count distinct members assigned to this chit
    members_count_result = await session.execute(
        select(func.count(func.distinct(ChitAssignment.member_id)))
        .where(ChitAssignment.chit_id == chit_id)
    )
    members_count = members_count_result.scalar() or 0

    # Handle chit_type - convert enum to string if needed
    chit_type_value = db_chit.chit_type.value if hasattr(db_chit.chit_type, 'value') else db_chit.chit_type

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
        members_count=members_count,
        collection_day=db_chit.collection_day,
        payout_day=db_chit.payout_day,
        # Chit type fields
        chit_type=chit_type_value,
        monthly_installment=db_chit.monthly_installment,
        payout_premium_percent=db_chit.payout_premium_percent,
        foreman_commission_percent=db_chit.foreman_commission_percent,
        # Optional notes field
        notes=db_chit.notes,
        # Audit timestamps
        created_at=db_chit.created_at,
        updated_at=db_chit.updated_at,
    )

async def delete_chit_by_id(session: AsyncSession, db_chit: Chit):
    await session.delete(db_chit)
    await session.commit()

async def update_chit_timestamp(db_chit: Chit) -> None:
    """Update the updated_at timestamp for a chit."""
    db_chit.updated_at = datetime.now(timezone.utc)