# backend/app/api/routers/chits.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import date
import calendar
from dateutil.relativedelta import relativedelta


from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.schemas.chits import (
    ChitGroupCreate, ChitGroupUpdate, ChitGroupResponse, ChitGroupListResponse, 
    ChitGroupPatch, PayoutResponse, PayoutListResponse, PayoutUpdate
)
from app.schemas.assignments import ChitAssignmentPublic, ChitAssignmentListResponse
from app.schemas.members import MemberPublic
from app.models.chits import ChitGroup
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_chits, crud_assignments
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

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
    
    trimmed_name = chit_group.name.strip()
    existing_group = await session.execute(
        select(ChitGroup).where(func.lower(ChitGroup.name) == func.lower(trimmed_name))
    )
    if existing_group.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit group with this name already exists. Please choose a different name."
        )

    end_date = chit_group.start_date + relativedelta(months=chit_group.duration_months -1)

    db_chit_group = ChitGroup(
        name=trimmed_name,
        chit_value=chit_group.chit_value,
        group_size=chit_group.group_size,
        monthly_installment=chit_group.monthly_installment,
        duration_months=chit_group.duration_months,
        start_date=chit_group.start_date,
        end_date=end_date,
        collection_day=chit_group.collection_day,
        payout_day=chit_group.payout_day,
    )
    session.add(db_chit_group)
    
    try:
        await session.commit()
        await session.refresh(db_chit_group)
        # --- Create initial payouts ---
        await crud_chits.create_payouts_for_group(
            session, 
            group_id=db_chit_group.id, 
            duration_months=db_chit_group.duration_months
        )
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit group with this name already exists. Please choose a different name."
        )
    
    response_details = await crud_chits.get_group_by_id_with_details(session, group_id=db_chit_group.id)
    return response_details


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
        response_details = await crud_chits.get_group_by_id_with_details(session, group_id=group.id)
        response_groups.append(response_details)

    response_groups.sort(key=lambda g: (g.status != 'Active', g.start_date), reverse=False)

    return {"groups": response_groups}


@router.get("/{group_id}/assignments", response_model=ChitAssignmentListResponse)
async def get_group_assignments(
    group_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves all member assignments for a specific chit group.
    """
    db_group = await crud_chits.get_group_by_id(session, group_id=group_id)
    if not db_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found")
        
    assignments = await crud_assignments.get_assignments_by_group_id(session, group_id=group_id)
    
    response_assignments = []
    for assignment in assignments:
        group_with_details = await crud_chits.get_group_by_id_with_details(session, group_id=assignment.chit_group_id)
        
        member_public = MemberPublic(
            id=assignment.member.id,
            full_name=assignment.member.full_name,
            phone_number=assignment.member.phone_number,
        )

        assignment_public = ChitAssignmentPublic(
            id=assignment.id,
            chit_month=assignment.chit_month,
            member=member_public,
            chit_group=group_with_details
        )
        response_assignments.append(assignment_public)
        
    return {"assignments": response_assignments}

@router.get("/{group_id}", response_model=ChitGroupResponse)
async def read_chit_group(
    group_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a single chit group by its ID.
    """
    response_details = await crud_chits.get_group_by_id_with_details(session, group_id=group_id)
    if not response_details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found")
    return response_details


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
    
    db_chit_group.end_date = db_chit_group.start_date + relativedelta(months=db_chit_group.duration_months - 1)

    session.add(db_chit_group)
    await session.commit()
    await session.refresh(db_chit_group)

    response_details = await crud_chits.get_group_by_id_with_details(session, group_id=db_chit_group.id)
    return response_details

@router.patch("/{group_id}", response_model=ChitGroupResponse)
async def patch_chit_group(
    group_id: int,
    chit_group: ChitGroupPatch,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Partially updates an existing chit group. Only updates the fields provided.
    """
    db_chit_group = await session.get(ChitGroup, group_id)
    if not db_chit_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found")

    group_data = chit_group.model_dump(exclude_unset=True)
    date_or_duration_changed = "start_date" in group_data or "duration_months" in group_data

    if "name" in group_data:
        trimmed_name = group_data["name"].strip()
        existing_group = await session.execute(
            select(ChitGroup).where(
                func.lower(ChitGroup.name) == func.lower(trimmed_name),
                ChitGroup.id != group_id
            )
        )
        if existing_group.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A chit group with this name already exists. Please choose a different name."
            )
        group_data["name"] = trimmed_name

    for key, value in group_data.items():
        setattr(db_chit_group, key, value)
    
    if date_or_duration_changed:
        db_chit_group.end_date = db_chit_group.start_date + relativedelta(months=db_chit_group.duration_months - 1)

    session.add(db_chit_group)
    
    try:
        await session.commit()
        await session.refresh(db_chit_group)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit group with this name already exists. Please choose a different name."
        )

    response_details = await crud_chits.get_group_by_id_with_details(session, group_id=db_chit_group.id)
    return response_details

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

    assignments = await crud_assignments.get_assignments_by_group_id(session, group_id=group_id)
    if assignments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete group: Members are still assigned to it."
        )

    await crud_chits.delete_group_by_id(session=session, db_group=db_group)
    return

# --- Payout Endpoints ---

@router.get("/{group_id}/payouts", response_model=PayoutListResponse)
async def get_payouts_for_group(
    group_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves all payouts for a specific chit group.
    """
    db_group = await crud_chits.get_group_by_id(session, group_id=group_id)
    if not db_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found")
    
    payouts = await crud_chits.get_payouts_by_group_id(session, group_id=group_id)
    return {"payouts": payouts}

@router.put("/payouts/{payout_id}", response_model=PayoutResponse)
async def update_payout_amount(
    payout_id: int,
    payout: PayoutUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Updates the amount for a specific payout.
    """
    updated_payout = await crud_chits.update_payout(session, payout_id=payout_id, payout_data=payout)
    if not updated_payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    return updated_payout