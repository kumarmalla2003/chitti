# backend/app/security/dependencies.py

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.auth import AuthorizedPhone
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], 
    session: Annotated[AsyncSession, Depends(get_session)],
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone_number: str = payload.get("sub")
        if phone_number is None:
            raise credentials_exception
        token_data = TokenData(phone_number=phone_number)
    except JWTError:
        raise credentials_exception
    user = await session.execute(
        select(AuthorizedPhone).where(AuthorizedPhone.phone_number == token_data.phone_number)
    )
    db_user = user.scalar_one_or_none()
    if db_user is None:
        raise credentials_exception
    return db_user