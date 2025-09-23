# backend/app/api/routers/assignments.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_assignments
from app.schemas import assignments as assignments_schemas

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
    # Potential future validation: check if the month is already assigned.
    # The frontend logic should prevent this, but an API-level check would be robust.
    new_assignment = await crud_assignments.create_assignment(session=session, assignment_in=assignment_in)
    
    # We need to eagerly load the relationships to return the full public model
    # A simple way is to refetch it with loaded relationships after creation.
    # This can be optimized later if needed.
    from app.crud.crud_assignments import get_assignments_by_member_id # Re-import to avoid circular dependency issues at file-level
    
    assignments = await get_assignments_by_member_id(session, member_id=new_assignment.member_id)
    # Find the specific assignment we just created to return it with all data loaded
    for a in assignments:
        if a.id == new_assignment.id:
            return a
            
    raise HTTPException(status_code=500, detail="Could not retrieve created assignment details.")


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