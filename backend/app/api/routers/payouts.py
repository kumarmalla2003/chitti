# backend/app/api/routers/payouts.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, List, Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.auth import AuthorizedPhone
from app.security.dependencies import get_current_user
from app.crud import crud_payouts, crud_chits, crud_members
from app.schemas.payouts import PayoutResponse, PayoutListResponse, PayoutUpdate

router = APIRouter(prefix="/payouts", tags=["payouts"])

@router.get("", response_model=PayoutListResponse)
async def read_all_payouts_including_unpaid(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all payouts (both paid and unpaid) for schedule display."""
    payouts_list = await crud_payouts.payouts.get_all(session)
    return {"payouts": payouts_list}

@router.get("/all", response_model=PayoutListResponse)
async def read_all_payouts(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    chit_id: Optional[int] = Query(default=None),
    member_id: Optional[int] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
):
    payouts_list = await crud_payouts.payouts.get_all_paid(
        session,
        chit_id=chit_id,
        member_id=member_id,
        start_date=start_date,
        end_date=end_date
    )
    return {"payouts": payouts_list}

@router.get("/chit/{chit_id}", response_model=PayoutListResponse)
async def read_payouts_by_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    payouts_list = await crud_payouts.payouts.get_by_chit(session, chit_id)
    return {"payouts": payouts_list}

@router.get("/member/{member_id}", response_model=PayoutListResponse)
async def read_payouts_by_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    payouts_list = await crud_payouts.payouts.get_by_member(session, member_id)
    return {"payouts": payouts_list}

@router.get("/{payout_id}", response_model=PayoutResponse)
async def read_payout(
    payout_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    payout = await crud_payouts.payouts.get(session, payout_id)
    if not payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    return payout

@router.put("/{payout_id}", response_model=PayoutResponse)
async def update_payout(
    payout_id: int,
    payout_in: PayoutUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Updates a payout (planning or recording)."""
    db_payout = await crud_payouts.payouts.get(session, payout_id)
    if not db_payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    
    # --- AUCTION LOGIC: Auto-calculate Payout Amount if Bid Amount is present ---
    if payout_in.bid_amount is not None:
        # Load Chit to check type and value
        await session.refresh(db_payout, ["chit"])
        if db_payout.chit and db_payout.chit.chit_type == "auction":
            # Payout = Chit Value - Bid Amount
            calculated_amount = db_payout.chit.chit_value - payout_in.bid_amount
            if calculated_amount < 0:
                 raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                    detail="Bid amount cannot be greater than Chit value."
                )
            # Auto-set the amount
            payout_in.amount = float(calculated_amount)
    # --------------------------------------------------------------------------

    # 1. Update the record
    await crud_payouts.payouts.update(db=session, db_obj=db_payout, obj_in=payout_in)
    
    # 2. Re-fetch the record to ensure all relationships (Member, Chit, Assignment) are loaded
    # This fixes the issue of details missing in the immediate response
    updated_payout_with_relations = await crud_payouts.payouts.get(session, payout_id)
    
    return updated_payout_with_relations

@router.delete("/{payout_id}", response_model=PayoutResponse)
async def reset_payout(
    payout_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Resets transaction details for a payout (keeps the schedule)."""
    db_payout = await crud_payouts.payouts.get(session, payout_id)
    if not db_payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    
    await crud_payouts.payouts.reset_transaction(db=session, db_obj=db_payout)
    
    # Re-fetch to return clean state with relationships
    return await crud_payouts.payouts.get(session, payout_id)