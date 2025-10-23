# backend/app/api/routers/chits.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import date
import calendar
from dateutil.relativedelta import relativedelta


from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.schemas.chits import ChitGroupCreate, ChitGroupUpdate, ChitGroupResponse, ChitGroupListResponse
from app.models.chits import ChitGroup
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_chits, crud_assignments

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

    # Calculate end_date based on duration_months from start_date
    end_date = chit_group.start_date + relativedelta(months=chit_group.duration_months -1)


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
    
    # Manually construct the response to include dynamic fields
    today = date.today()
    status = "Active" if db_chit_group.start_date <= today <= db_chit_group.end_date else "Inactive"
    
    if status == "Active":
        delta = relativedelta(today, db_chit_group.start_date)
        months_passed = delta.years * 12 + delta.months + 1
        chit_cycle = f"{months_passed}/{db_chit_group.duration_months}"
    else:
        chit_cycle = f"-/{db_chit_group.duration_months}"


    return ChitGroupResponse(
        id=db_chit_group.id,
        name=db_chit_group.name,
        chit_value=db_chit_group.chit_value,
        group_size=db_chit_group.group_size,
        monthly_installment=db_chit_group.monthly_installment,
        duration_months=db_chit_group.duration_months,
        start_date=db_chit_group.start_date,
        end_date=db_chit_group.end_date,
        status=status,
        chit_cycle=chit_cycle
    )


@router.get("/", response_model=ChitGroupListResponse)
async def read_chit_groups(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a list of all chit groups, calculates their status and cycle,
    and sorts them.
    """
    statement = select(ChitGroup)
    result = await session.execute(statement)
    groups = result.scalars().all()
    
    today = date.today()
    
    response_groups = []
    for group in groups:
        # Calculate Status
        status = "Active" if group.start_date <= today <= group.end_date else "Inactive"
        
        # Calculate Chit Cycle
        if status == "Active":
            delta = relativedelta(today, group.start_date)
            # +1 because the first month is cycle 1
            months_passed = delta.years * 12 + delta.months + 1
            chit_cycle = f"{months_passed}/{group.duration_months}"
        else:
            chit_cycle = f"-/{group.duration_months}"

        response_groups.append(ChitGroupResponse(
            id=group.id,
            name=group.name,
            chit_value=group.chit_value,
            group_size=group.group_size,
            monthly_installment=group.monthly_installment,
            duration_months=group.duration_months,
            start_date=group.start_date,
            end_date=group.end_date,
            status=status,
            chit_cycle=chit_cycle
        ))

    # Sort groups: primarily by status (Active first), secondarily by start_date (desc)
    response_groups.sort(key=lambda g: (g.status != 'Active', g.start_date), reverse=False)

    return {"groups": response_groups}

@router.get("/{group_id}", response_model=ChitGroupResponse)
async def read_chit_group(
    group_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a single chit group by its ID.
    """
    db_chit_group = await session.get(ChitGroup, group_id)
    if not db_chit_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found")

    today = date.today()
    status = "Active" if db_chit_group.start_date <= today <= db_chit_group.end_date else "Inactive"
    
    if status == "Active":
        delta = relativedelta(today, db_chit_group.start_date)
        months_passed = delta.years * 12 + delta.months + 1
        chit_cycle = f"{months_passed}/{db_chit_group.duration_months}"
    else:
        chit_cycle = f"-/{db_chit_group.duration_months}"

    return ChitGroupResponse(
        id=db_chit_group.id,
        name=db_chit_group.name,
        chit_value=db_chit_group.chit_value,
        group_size=db_chit_group.group_size,
        monthly_installment=db_chit_group.monthly_installment,
        duration_months=db_chit_group.duration_months,
        start_date=db_chit_group.start_date,
        end_date=db_chit_group.end_date,
        status=status,
        chit_cycle=chit_cycle
    )

@router.put("/{group_id}", response_model=ChitGroupResponse)
async def update_chit_group(
    group_id: int,
    chit_group: ChitGroupUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Updates an existing chit group.
    """
    db_chit_group = await session.get(ChitGroup, group_id)
    if not db_chit_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found")

    group_data = chit_group.model_dump(exclude_unset=True)
    for key, value in group_data.items():
        setattr(db_chit_group, key, value)
    
    # Recalculate end_date
    db_chit_group.end_date = db_chit_group.start_date + relativedelta(months=db_chit_group.duration_months - 1)

    session.add(db_chit_group)
    await session.commit()
    await session.refresh(db_chit_group)

    today = date.today()
    status = "Active" if db_chit_group.start_date <= today <= db_chit_group.end_date else "Inactive"
    
    if status == "Active":
        delta = relativedelta(today, db_chit_group.start_date)
        months_passed = delta.years * 12 + delta.months + 1
        chit_cycle = f"{months_passed}/{db_chit_group.duration_months}"
    else:
        chit_cycle = f"-/{db_chit_group.duration_months}"

    return ChitGroupResponse(
        id=db_chit_group.id,
        name=db_chit_group.name,
        chit_value=db_chit_group.chit_value,
        group_size=db_chit_group.group_size,
        monthly_installment=db_chit_group.monthly_installment,
        duration_months=db_chit_group.duration_months,
        start_date=db_chit_group.start_date,
        end_date=db_chit_group.end_date,
        status=status,
        chit_cycle=chit_cycle
    )

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chit_group(
    group_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Deletes a chit group, only if it has no members assigned to it.
    """
    db_group = await crud_chits.get_group_by_id(session, group_id=group_id)
    if not db_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found")

    # Safety Check: Ensure no members are assigned to this group
    assignments = await crud_assignments.get_assignments_by_group_id(session, group_id=group_id)
    if assignments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete group: Members are still assigned to it."
        )

    await crud_chits.delete_group_by_id(session=session, db_group=db_group)
    return