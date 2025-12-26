# backend/app/api/routers/collections.py
# STUB ENDPOINT - Collections table has been removed
# This stub allows the frontend to function while it's being refactored

from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("")
async def get_all_collections(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    chit_id: Optional[int] = Query(None),
    member_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
):
    """
    STUB: Returns empty collections list.
    Collections are now managed via Payments with payment_type='collection'.
    """
    return {"collections": []}


@router.get("/chit/{chit_id}")
async def get_collections_by_chit(
    chit_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """STUB: Returns empty collections list for a chit."""
    return {"collections": []}


@router.get("/member/{member_id}")
async def get_collections_by_member(
    member_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """STUB: Returns empty collections list for a member."""
    return {"collections": []}


@router.get("/{collection_id}")
async def get_collection_by_id(
    collection_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """STUB: Returns 404 since collections no longer exist."""
    from fastapi import HTTPException, status
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Collections have been deprecated. Use Payments API with payment_type='collection'."
    )
