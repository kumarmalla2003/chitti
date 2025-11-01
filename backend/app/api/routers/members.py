# backend/app/api/routers/members.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, List
from datetime import date
from dateutil.relativedelta import relativedelta

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_members, crud_assignments
from app.schemas import members as members_schemas
from app.schemas import assignments as assignments_schemas
from app.schemas.chits import ChitGroupResponse # Import for constructing response

router = APIRouter(prefix="/members", tags=["members"])

@router.post("/", response_model=members_schemas.MemberPublic, status_code=status.HTTP_201_CREATED)
async def create_member(
    member_in: members_schemas.MemberCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Creates a new unique member.
    """
    db_member = await crud_members.get_member_by_phone(session, phone_number=member_in.phone_number)
    if db_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A member with this phone number already exists.",
        )
    return await crud_members.create_member(session=session, member_in=member_in)

@router.put("/{member_id}", response_model=members_schemas.MemberPublic)
async def update_member_details(
    member_id: int,
    member_in: members_schemas.MemberUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Updates a member's details.
    """
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    if member_in.phone_number != db_member.phone_number:
        existing_member = await crud_members.get_member_by_phone(session, phone_number=member_in.phone_number)
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already registered to another member.",
            )

    return await crud_members.update_member(session=session, db_member=db_member, member_in=member_in)


# --- ADD THIS NEW ENDPOINT ---
@router.patch("/{member_id}", response_model=members_schemas.MemberPublic)
async def patch_member_details(
    member_id: int,
    member_in: members_schemas.MemberPatch,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Partially updates a member's details.
    """
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    update_data = member_in.model_dump(exclude_unset=True)

    # If phone number is being updated, check if it's already taken
    if "phone_number" in update_data and update_data["phone_number"] != db_member.phone_number:
        existing_member = await crud_members.get_member_by_phone(session, phone_number=update_data["phone_number"])
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already registered to another member.",
            )
    
    # Update the model with the new data
    for key, value in update_data.items():
        setattr(db_member, key, value)

    session.add(db_member)
    await session.commit()
    await session.refresh(db_member)
    return db_member


@router.get("/search", response_model=List[members_schemas.MemberSearchResponse])
async def search_for_members(
    query: Annotated[str, Query(min_length=2)],
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Searches for members by full name or phone number.
    """
    members = await crud_members.search_members(session, query=query)
    return members

@router.get("/{member_id}", response_model=members_schemas.MemberPublic)
async def read_member_by_id(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a single member by their ID.
    """
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if db_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return db_member

@router.get("/{member_id}/assignments", response_model=List[assignments_schemas.ChitAssignmentPublic])
async def get_member_assignments(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves all chit assignments for a specific member and builds the correct response model.
    """
    assignments = await crud_assignments.get_assignments_by_member_id(session, member_id=member_id)
    
    response_assignments = []
    today = date.today()

    for assignment in assignments:
        group = assignment.chit_group
        
        # Calculate Status
        status_str = "Active" if group.start_date <= today <= group.end_date else "Inactive"
        
        # Calculate Chit Cycle
        if status_str == "Active":
            delta = relativedelta(today, group.start_date)
            months_passed = delta.years * 12 + delta.months + 1
            chit_cycle_str = f"{months_passed}/{group.duration_months}"
        else:
            chit_cycle_str = f"-/{group.duration_months}"

        # Construct the detailed ChitGroupResponse
        chit_group_response = ChitGroupResponse(
            id=group.id, name=group.name, chit_value=group.chit_value,
            group_size=group.group_size, monthly_installment=group.monthly_installment,
            duration_months=group.duration_months, start_date=group.start_date,
            end_date=group.end_date, status=status_str, chit_cycle=chit_cycle_str,
            collection_day=group.collection_day, payout_day=group.payout_day
        )
        
        # Construct the final ChitAssignmentPublic response
        assignment_public = assignments_schemas.ChitAssignmentPublic(
            id=assignment.id,
            chit_month=assignment.chit_month,
            member=assignment.member,
            chit_group=chit_group_response
        )
        response_assignments.append(assignment_public)
        
    return response_assignments


@router.get("/", response_model=members_schemas.MemberListResponse)
async def read_all_members(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Retrieves a list of all unique members.
    """
    members = await crud_members.get_all_members(session)
    return {"members": members}

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Deletes a member, only if they have no active chit assignments.
    """
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Safety Check: Ensure member has no assignments
    assignments = await crud_assignments.get_assignments_by_member_id(session, member_id=member_id)
    if assignments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete member: They are still assigned to one or more chit groups."
        )

    await crud_members.delete_member_by_id(session=session, db_member=db_member)
    return