# backend/app/api/routers/chits.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import date
import calendar

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.schemas.chits import ChitGroupCreate, ChitGroupResponse, ChitGroupListResponse
from app.models.chits import ChitGroup
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/chits", tags=["chits"])

@router.post("/", response_model=ChitGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_chit_group(
    chit_group: ChitGroupCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Creates a new chit group for the authenticated user.
    """

    end_date = chit_group.start_date
    for _ in range(chit_group.duration_months):
        year = end_date.year
        month = end_date.month + 1
        if month > 12:
            month = 1
            year += 1
        day = min(end_date.day, calendar.monthrange(year, month)[1])
        end_date = date(year, month, day)

    db_chit_group = ChitGroup(
        name=chit_group.name,
        chit_value=chit_group.chit_value,
        group_size=chit_group.group_size,
        monthly_installment=chit_group.monthly_installment,
        duration_months=chit_group.duration_months,
        start_date=chit_group.start_date,
        end_date=end_date,
    )
    session.add(db_chit_group)
    await session.commit()
    await session.refresh(db_chit_group)
    return db_chit_group

@router.get("/", response_model=ChitGroupListResponse)
async def read_chit_groups(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a list of all chit groups for the authenticated user.
    """
    statement = select(ChitGroup)
    result = await session.execute(statement)
    groups = result.scalars().all()
    return {"groups": groups}