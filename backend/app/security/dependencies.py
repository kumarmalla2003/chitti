# backend/app/security/dependencies.py

from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.auth import AuthorizedPhone
from app.schemas.auth import TokenData

# ⚠️ DEVELOPMENT ONLY: Set to True to bypass authentication
# Remember to set this back to False before deploying to production!
DEV_BYPASS_AUTH = True

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token") # No longer used for bearer token extraction

async def get_current_user(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    # Development bypass - return first user or mock user
    if DEV_BYPASS_AUTH:
        # Try to get the first authorized user from database
        result = await session.execute(select(AuthorizedPhone).limit(1))
        db_user = result.scalar_one_or_none()
        if db_user:
            return db_user
        # If no users exist, create a mock object (won't be persisted)
        return AuthorizedPhone(id=1, phone_number="dev_user")

    token = request.cookies.get("access_token")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

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