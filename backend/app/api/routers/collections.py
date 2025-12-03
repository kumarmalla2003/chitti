# backend/app/api/routers/collections.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated, Optional
from datetime import date
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.auth import AuthorizedPhone
from app.models.collections import Collection
from app.models.assignments import ChitAssignment 
from app.security.dependencies import get_current_user
from app.crud.crud_collections import collections as crud_collections
from app.crud import crud_chits, crud_members
from app.schemas.collections import CollectionPublic, CollectionListResponse, CollectionCreate, CollectionUpdate
from app.schemas.members import MemberPublic

router = APIRouter(prefix="/collections", tags=["collections"])

async def _get_collection_response(session: AsyncSession, collection: Collection) -> CollectionPublic:
    chit_response = await crud_chits.get_chit_by_id_with_details(session, chit_id=collection.chit_id)
    member = await crud_members.get_member_by_id(session, member_id=collection.member_id)
    member_response = MemberPublic.model_validate(member) if member else None
    
    if not collection.assignment:
        # Try to reload assignment if missing
        collection.assignment = await session.get(ChitAssignment, collection.chit_assignment_id)
        if not collection.assignment:
             raise HTTPException(status_code=500, detail="Collection is missing assignment link.")

    return CollectionPublic(
        id=collection.id,
        amount_paid=collection.amount_paid,
        collection_date=collection.collection_date,
        collection_method=collection.collection_method,
        notes=collection.notes,
        chit_assignment_id=collection.chit_assignment_id,
        chit_month=collection.assignment.chit_month,
        member=member_response,
        chit=chit_response
    )

@router.post("/", response_model=CollectionPublic, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_in: CollectionCreate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    assignment = await session.get(
        ChitAssignment, 
        collection_in.chit_assignment_id, 
        options=[selectinload(ChitAssignment.chit)]
    )
    
    if not assignment or not assignment.chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified assignment or its chit could not be found."
        )
    
    monthly_installment = assignment.chit.monthly_installment
    
    existing_collections = await crud_collections.get_by_assignment(
        session, 
        assignment_id=collection_in.chit_assignment_id
    )
    total_paid = sum(c.amount_paid for c in existing_collections)
    
    due_amount = round(monthly_installment - total_paid, 2)
    
    if collection_in.amount_paid > (due_amount + 0.001):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Collection ({collection_in.amount_paid:.2f}) exceeds the due amount of {due_amount:.2f}."
        )
    
    # Enrich input with derived IDs
    db_collection = Collection(
        **collection_in.model_dump(),
        member_id=assignment.member_id,
        chit_id=assignment.chit_id
    )
    
    session.add(db_collection)
    await session.commit()
    await session.refresh(db_collection)
    
    db_collection_with_relations = await crud_collections.get(session, db_collection.id)
    return await _get_collection_response(session, db_collection_with_relations)

@router.get("/", response_model=CollectionListResponse)
async def get_all_collections(
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    chit_id: Optional[int] = Query(default=None),
    member_id: Optional[int] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
):
    collections_list = await crud_collections.get_multi(
        session, 
        chit_id=chit_id, 
        member_id=member_id,
        start_date=start_date,
        end_date=end_date
    )
    
    chit_responses_cache = {}
    response_collections = []
    
    for c in collections_list:
        if c.chit_id not in chit_responses_cache:
            chit_responses_cache[c.chit_id] = await crud_chits.get_chit_by_id_with_details(session, chit_id=c.chit_id)
        
        assignment = await session.get(ChitAssignment, c.chit_assignment_id)
        if not assignment:
            continue 

        response_collections.append(
            CollectionPublic(
                id=c.id,
                amount_paid=c.amount_paid,
                collection_date=c.collection_date,
                collection_method=c.collection_method,
                notes=c.notes,
                chit_assignment_id=c.chit_assignment_id,
                chit_month=assignment.chit_month,
                member=MemberPublic.model_validate(c.member),
                chit=chit_responses_cache.get(c.chit_id)
            )
        )
    return {"collections": response_collections}

# --- ADDED: Missing Endpoints for Chit and Member specific collections ---

@router.get("/chit/{chit_id}", response_model=CollectionListResponse)
async def get_collections_by_chit(
    chit_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Retrieves all collections for a specific chit."""
    collections_list = await crud_collections.get_multi(session, chit_id=chit_id)
    
    chit_responses_cache = {}
    response_collections = []
    
    for c in collections_list:
        if c.chit_id not in chit_responses_cache:
            chit_responses_cache[c.chit_id] = await crud_chits.get_chit_by_id_with_details(session, chit_id=c.chit_id)
        
        if not c.assignment:
             c.assignment = await session.get(ChitAssignment, c.chit_assignment_id)

        if not c.assignment:
            continue

        response_collections.append(
            CollectionPublic(
                id=c.id,
                amount_paid=c.amount_paid,
                collection_date=c.collection_date,
                collection_method=c.collection_method,
                notes=c.notes,
                chit_assignment_id=c.chit_assignment_id,
                chit_month=c.assignment.chit_month,
                member=MemberPublic.model_validate(c.member) if c.member else None,
                chit=chit_responses_cache.get(c.chit_id)
            )
        )
    return {"collections": response_collections}


@router.get("/member/{member_id}", response_model=CollectionListResponse)
async def get_collections_by_member(
    member_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Retrieves all collections made by a specific member."""
    collections_list = await crud_collections.get_multi(session, member_id=member_id)
    
    chit_responses_cache = {}
    response_collections = []
    
    for c in collections_list:
        if c.chit_id not in chit_responses_cache:
            chit_responses_cache[c.chit_id] = await crud_chits.get_chit_by_id_with_details(session, chit_id=c.chit_id)
            
        if not c.assignment:
             c.assignment = await session.get(ChitAssignment, c.chit_assignment_id)

        if not c.assignment:
            continue

        response_collections.append(
            CollectionPublic(
                id=c.id,
                amount_paid=c.amount_paid,
                collection_date=c.collection_date,
                collection_method=c.collection_method,
                notes=c.notes,
                chit_assignment_id=c.chit_assignment_id,
                chit_month=c.assignment.chit_month,
                member=MemberPublic.model_validate(c.member) if c.member else None,
                chit=chit_responses_cache.get(c.chit_id)
            )
        )
    return {"collections": response_collections}

# --- END ADDED ENDPOINTS ---

@router.get("/{collection_id}", response_model=CollectionPublic)
async def get_collection_by_id(
    collection_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_collection = await crud_collections.get(session, id=collection_id)
    if not db_collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    
    return await _get_collection_response(session, db_collection)

@router.patch("/{collection_id}", response_model=CollectionPublic)
async def update_collection(
    collection_id: int,
    collection_in: CollectionUpdate,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_collection = await crud_collections.get(session, id=collection_id)
    if not db_collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
        
    if collection_in.amount_paid is not None:
        if not db_collection.chit:
             db_collection.chit = await session.get(ChitAssignment, db_collection.chit_assignment_id)
             if not db_collection.chit:
                 from app.models.chits import Chit
                 db_collection.chit = await session.get(Chit, db_collection.chit_id)

        monthly_installment = db_collection.chit.monthly_installment
        
        all_collections = await crud_collections.get_by_assignment(
            session, 
            assignment_id=db_collection.chit_assignment_id
        )
        
        total_paid_without_this_one = sum(
            c.amount_paid for c in all_collections if c.id != collection_id
        )
        
        due_amount = round(monthly_installment - total_paid_without_this_one, 2)
        
        if collection_in.amount_paid > (due_amount + 0.001):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Updated amount ({collection_in.amount_paid:.2f}) exceeds limit of {due_amount:.2f}."
            )
        
    updated_collection = await crud_collections.update(
        session, db_obj=db_collection, obj_in=collection_in
    )
    
    return await _get_collection_response(session, updated_collection)

@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: int,
    current_user: Annotated[AuthorizedPhone, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_collection = await crud_collections.get(session, id=collection_id)
    if not db_collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    
    await crud_collections.delete(db=session, db_obj=db_collection)
    return