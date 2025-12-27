# backend/app/db/session.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings

if not settings.DATABASE_URL:
    raise ValueError("No DATABASE_URL found in environment variables")

# Create an asynchronous engine
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# Define an async session maker
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Register event listeners for auto-updating timestamps
from app.db.listeners import register_listeners
register_listeners()

async def get_session() -> AsyncSession:
    """Dependency to get an async database session."""
    async with AsyncSessionLocal() as session:
        yield session

async def create_db_and_tables():
    """Creates database tables asynchronously."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)