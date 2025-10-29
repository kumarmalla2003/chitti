# backend/app/api/routers/chits.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import date
import calendar
from dateutil.relativedelta import relativedelta


from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.schemas.chits import ChitGroupCreate, ChitGroupUpdate, ChitGroupResponse, ChitGroupListResponse, ChitGroupPatch
from app.schemas.assignments import ChitAssignmentPublic, ChitAssignmentListResponse
from app.schemas.members import MemberPublic # <-- ADD THIS IMPORT
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
    
    # Check for duplicate name (case-insensitive)
    trimmed_name = chit_group.name.strip()
    existing_group = await session.execute(
        select(ChitGroup).where(func.lower(ChitGroup.name) == func.lower(trimmed_name))
    )
    if existing_group.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A chit group with this name already exists. Please choose a different name."
        )

    # Calculate end_date based on duration_months from start_date
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

    # Sort groups: primarily by status (Active first), secondarily by start_date (desc)
    response_groups.sort(key=lambda g: (g.status != 'Active', g.start_date), reverse=False)

    return {"groups": response_groups}

# --- ENDPOINT HAS BEEN UPDATED ---
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
    
    # Manually construct the response to include calculated fields
    response_assignments = []
    for assignment in assignments:
        # Get the detailed group response with calculated fields
        group_with_details = await crud_chits.get_group_by_id_with_details(session, group_id=assignment.chit_group_id)
        
        # --- ADD THIS BLOCK TO CONSTRUCT THE MEMBER RESPONSE ---
        member_public = MemberPublic(
            id=assignment.member.id,
            full_name=assignment.member.full_name,
            phone_number=assignment.member.phone_number,
        )

        # Create the final assignment response object
        assignment_public = ChitAssignmentPublic(
            id=assignment.id,
            chit_month=assignment.chit_month,
            member=member_public, # <-- USE THE NEWLY CREATED OBJECT
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
    
    # Recalculate end_date
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

    # Strip name if provided and check for duplicates
    if "name" in group_data:
        trimmed_name = group_data["name"].strip()
        # Check if another group has this name (excluding current group)
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
    
    # If date or duration changes, recalculate the end date
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

    # Safety Check: Ensure no members are assigned to this group
    assignments = await crud_assignments.get_assignments_by_group_id(session, group_id=group_id)
    if assignments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete group: Members are still assigned to it."
        )

    await crud_chits.delete_group_by_id(session=session, db_group=db_group)
    return