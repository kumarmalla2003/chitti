# backend/app/api/routers/assignments.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_assignments, crud_chits, crud_members
from app.crud import crud_collections
from app.schemas import assignments as assignments_schemas
from app.schemas.members import MemberPublic

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.post("", response_model=assignments_schemas.ChitAssignmentPublic, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment_in: assignments_schemas.ChitAssignmentCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Assigns a member to a chit for a specific month.
    """
    # Validate that member exists
    member = await crud_members.get_member_by_id(session, member_id=assignment_in.member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    # Validate that chit exists
    chit_with_details = await crud_chits.get_chit_by_id_with_details(session, chit_id=assignment_in.chit_id)
    if not chit_with_details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    # Create the new assignment in the database
    new_assignment = await crud_assignments.create_assignment(session=session, assignment_in=assignment_in)

    member_public = MemberPublic.model_validate(member)

    total_paid = 0
    due_amount = chit_with_details.monthly_installment
    collection_status = "Unpaid"

    return assignments_schemas.ChitAssignmentPublic(
        id=new_assignment.id,
        chit_month=new_assignment.chit_month,
        member=member_public,
        chit=chit_with_details,
        total_paid=total_paid,
        due_amount=due_amount,
        collection_status=collection_status
    )


@router.post("/chit/{chit_id}/bulk-assign", status_code=status.HTTP_201_CREATED)
async def create_bulk_assignments(
    chit_id: int,
    bulk_data: assignments_schemas.ChitAssignmentBulkCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Assigns multiple members to multiple months for a single chit in one transaction.
    """
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    try:
        await crud_assignments.create_bulk_assignments(
            session=session,
            chit_id=chit_id,
            assignments_in=bulk_data.assignments
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create assignments. Error: {str(e)}"
        )
    
    return {"message": "Assignments created successfully."}


@router.get("/unassigned-months/{chit_id}", response_model=assignments_schemas.UnassignedMonthResponse)
async def get_unassigned_months(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Gets a list of available (unassigned) months for a specific chit.
    """
    months = await crud_assignments.get_unassigned_months_for_chit(session, chit_id=chit_id)
    return {"available_months": months}


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_member(
    assignment_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Deletes a specific chit assignment (unassigns a member).
    """
    
    # Check if any collections are associated with this assignment
    # --- FIXED CALL HERE ---
    collections = await crud_collections.collections.get_by_assignment(
        session, 
        assignment_id=assignment_id
    )
    if collections:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot unassign member: Collections have already been logged for this assignment."
        )

    success = await crud_assignments.delete_assignment(session, assignment_id=assignment_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    return