# backend/app/api/routers/assignments.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_assignments, crud_chits, crud_members
# No need to import crud_payments, as a new assignment has no payments
from app.schemas import assignments as assignments_schemas
from app.schemas.members import MemberPublic

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.post("/", response_model=assignments_schemas.ChitAssignmentPublic, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment_in: assignments_schemas.ChitAssignmentCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Assigns a member to a chit group for a specific month.
    """
    # 1. Create the new assignment in the database
    new_assignment = await crud_assignments.create_assignment(session=session, assignment_in=assignment_in)
    
    # 2. Fetch the full details for the related objects
    group_with_details = await crud_chits.get_group_by_id_with_details(session, group_id=new_assignment.chit_group_id)
    member = await crud_members.get_member_by_id(session, member_id=new_assignment.member_id)

    if not group_with_details or not member:
        raise HTTPException(status_code=500, detail="Could not retrieve created assignment details after creation.")

    # 3. Construct the Pydantic models for the response
    member_public = MemberPublic.model_validate(member)

    # --- START OF FIX ---
    # For a new assignment, payment status is always "Unpaid"
    # and due_amount is the full monthly_installment.
    
    total_paid = 0.0
    due_amount = group_with_details.monthly_installment
    payment_status = "Unpaid"
    # --- END OF FIX ---

    # 4. Assemble and return the final, valid response object
    return assignments_schemas.ChitAssignmentPublic(
        id=new_assignment.id,
        chit_month=new_assignment.chit_month,
        member=member_public,
        chit_group=group_with_details,
        
        # --- PASS THE NEW FIELDS ---
        total_paid=total_paid,
        due_amount=due_amount,
        payment_status=payment_status
    )


@router.get("/unassigned-months/{group_id}", response_model=assignments_schemas.UnassignedMonthResponse)
async def get_unassigned_months(
    group_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Gets a list of available (unassigned) months for a specific chit group.
    """
    months = await crud_assignments.get_unassigned_months_for_group(session, group_id=group_id)
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
    success = await crud_assignments.delete_assignment(session, assignment_id=assignment_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return