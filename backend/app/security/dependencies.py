# backend/app/security/dependencies.py

from typing import Annotated
from fastapi import Depends, HTTPException, status, Cookie
from jose import JWTError, jwt
from app.core.config import settings
from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.auth import AuthorizedPhone
from app.schemas.auth import TokenData

async def get_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None,
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    if not access_token:
        raise credentials_exception

    # access_token cookie format is "Bearer <token>"
    if access_token.startswith("Bearer "):
        token = access_token.split(" ")[1]
    else:
        token = access_token

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone_number: str = payload.get("sub")
        if phone_number is None:
            raise credentials_exception
        token_data = TokenData(phone_number=phone_number)
    except JWTError:
        raise credentials_exception

    # Ensure session is not None
    if session is None:
        raise HTTPException(status_code=500, detail="Database session not available")

    user = await session.execute(
        select(AuthorizedPhone).where(AuthorizedPhone.phone_number == token_data.phone_number)
    )
    db_user = user.scalar_one_or_none()
    if db_user is None:
        raise credentials_exception
    return db_user
