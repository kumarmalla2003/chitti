# backend/app/api/routers/collections.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.auth import AuthorizedPhone
from app.models.collections import Collection, CollectionStatus
from app.security.dependencies import get_current_user
from app.crud.crud_collections import collections as crud_collections
from app.crud import crud_chits, crud_members
from app.schemas.collections import CollectionResponse, CollectionListResponse, CollectionUpdate
from app.schemas.members import MemberPublic
from app.schemas.chits import ChitNested
from app.schemas.assignments import ChitAssignmentSimple

router = APIRouter(prefix="/collections", tags=["collections"])


def collection_to_response(collection: Collection) -> dict:
    """
    Transform a Collection model into a response dict with computed payment fields.
    Aggregates payment data from the payments relationship.
    """
    payments = collection.payments or []
    
    # Sum of all payment amounts (in rupees)
    amount_paid = sum(p.amount for p in payments if p.amount is not None)
    
    # Get the most recent payment for date/method/notes
    sorted_payments = sorted(
        [p for p in payments if p.date is not None],
        key=lambda p: p.date,
        reverse=True
    )
    latest_payment = sorted_payments[0] if sorted_payments else None
    
    # Compute collection_status based on paid amount vs expected (both in rupees)
    expected_amount = collection.expected_amount or 0
    
    if amount_paid == 0:
        collection_status = "Unpaid"
    elif amount_paid >= expected_amount:
        collection_status = "Paid"
    else:
        collection_status = "Partial"
    
    # Build response dict
    response_data = {
        "id": collection.id,
        "month": collection.month,
        "expected_amount": collection.expected_amount,
        "chit_id": collection.chit_id,
        "status": collection.status,
        "member_id": collection.member_id,
        "chit_assignment_id": collection.chit_assignment_id,
        "created_at": collection.created_at,
        "updated_at": collection.updated_at,
        # Nested objects
        "member": MemberPublic.model_validate(collection.member) if collection.member else None,
        "chit": ChitNested.model_validate(collection.chit) if collection.chit else None,
        "assignment": ChitAssignmentSimple.model_validate(collection.assignment) if collection.assignment else None,
        # Computed payment fields
        "amount_paid": amount_paid,
        "collection_date": latest_payment.date if latest_payment else None,
        "collection_method": latest_payment.method.value if latest_payment and latest_payment.method else None,
        "collection_status": collection_status,
        "notes": latest_payment.notes if latest_payment else None,
    }
    
    return response_data


def collections_to_response_list(collections: List[Collection]) -> List[dict]:
    """Transform a list of collections to response dicts."""
    return [collection_to_response(c) for c in collections]


@router.get("", response_model=CollectionListResponse)
async def read_all_collections(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[CollectionStatus] = Query(default=None, alias="status"),
):
    """Get all collections. Optional status filter."""
    if status_filter:
        collections_list = await crud_collections.get_by_status(session, status_filter)
    else:
        collections_list = await crud_collections.get_multi(session)
    return {"collections": collections_to_response_list(collections_list)}

@router.get("/chit/{chit_id}", response_model=CollectionListResponse)
async def read_collections_by_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all collections for a specific chit."""
    db_chit = await crud_chits.get_chit_by_id(session, chit_id=chit_id)
    if not db_chit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit not found")
    
    collections_list = await crud_collections.get_by_chit(session, chit_id)
    return {"collections": collections_to_response_list(collections_list)}

@router.get("/member/{member_id}", response_model=CollectionListResponse)
async def read_collections_by_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all collections for a specific member."""
    db_member = await crud_members.get_member_by_id(session, member_id=member_id)
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    collections_list = await crud_collections.get_multi(session, member_id=member_id)
    return {"collections": collections_to_response_list(collections_list)}

@router.get("/{collection_id}", response_model=CollectionResponse)
async def read_collection(
    collection_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a specific collection by ID."""
    collection = await crud_collections.get(session, collection_id)
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return collection_to_response(collection)

@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    collection_in: CollectionUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a collection schedule (expected_amount, status, member assignment)."""
    db_collection = await crud_collections.get(session, collection_id)
    if not db_collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    
    await crud_collections.update(db=session, db_obj=db_collection, obj_in=collection_in)
    
    # Re-fetch with relationships
    updated_collection = await crud_collections.get(session, collection_id)
    return collection_to_response(updated_collection)

@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a collection schedule."""
    db_collection = await crud_collections.get(session, collection_id)
    if not db_collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    
    await crud_collections.delete(db=session, db_obj=db_collection)
