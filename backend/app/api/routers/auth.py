# backend/app/api/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated

from app.crud import crud_auth
from app.schemas import auth as auth_schemas
from app.security import core as security
from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/verify-phone")
async def verify_phone_exists(
    phone_data: auth_schemas.PhoneVerificationRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    db_phone = await crud_auth.get_authorized_phone(session=session, phone_number=phone_data.phone_number)
    if not db_phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not authorized",
        )
    return {"message": "Phone number is authorized"}


@router.post("/token", response_model=auth_schemas.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    phone_number = form_data.username
    pin = form_data.password

    db_phone = await crud_auth.get_authorized_phone(session=session, phone_number=phone_number)
    if not db_phone:
        raise HTTPException(status_code=404, detail="Phone number not authorized")
    
    credential = await crud_auth.get_credential(session=session)
    if not credential or not security.verify_pin(pin, credential.hashed_pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect PIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(data={"sub": phone_number})
    return {"access_token": access_token, "token_type": "bearer"}