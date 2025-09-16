# backend/app/crud/crud_auth.py

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import auth as auth_models

async def get_authorized_phone(session: AsyncSession, phone_number: str):
    statement = select(auth_models.AuthorizedPhone).where(auth_models.AuthorizedPhone.phone_number == phone_number)
    result = await session.execute(statement) # Changed from session.exec
    return result.scalar_one_or_none() # Changed from result.first() for clarity

async def get_credential(session: AsyncSession):
    statement = select(auth_models.Credential)
    result = await session.execute(statement) # Changed from session.exec
    return result.scalar_one_or_none() # Changed from result.first() for clarity