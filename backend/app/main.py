# backend/app/main.py

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routers import (
    auth as auth_router, 
    chits as chits_router, 
    members as members_router,             
    slots as slots_router,     
    payouts as payouts_router,
    payments as payments_router,
    collections as collections_router  # Stub for backwards compatibility
)
from app.core.config import settings
from app.db.session import engine, AsyncSessionLocal
from app.models import (
    auth as auth_models, 
    chits as chits_models,
    members as members_models,             
    slots as slots_models,
    payments as payments_models
)
from app.security import core as security

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    print("Initializing database...")
    async with engine.begin() as conn:
        await conn.run_sync(auth_models.SQLModel.metadata.create_all)
        await conn.run_sync(chits_models.SQLModel.metadata.create_all)
        await conn.run_sync(members_models.SQLModel.metadata.create_all)
        await conn.run_sync(slots_models.SQLModel.metadata.create_all)
        await conn.run_sync(payments_models.SQLModel.metadata.create_all)

    print("Seeding initial data...")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            result = await session.execute(select(auth_models.Credential))
            if not result.scalar_one_or_none():
                if settings.UNIVERSAL_PIN:
                    hashed_pin = security.get_pin_hash(settings.UNIVERSAL_PIN)
                    new_credential = auth_models.Credential(hashed_pin=hashed_pin)
                    session.add(new_credential)
                    print("Seeded universal PIN.")
                else:
                    print("WARNING: No UNIVERSAL_PIN found in .env to seed.")

            for number in settings.AUTHORIZED_PHONE_NUMBERS:
                if number and number.strip():
                    result = await session.execute(select(auth_models.AuthorizedPhone).where(auth_models.AuthorizedPhone.phone_number == number))
                    if not result.scalar_one_or_none():
                        new_phone = auth_models.AuthorizedPhone(phone_number=number)
                        session.add(new_phone)
                        print(f"Seeded phone number: {number}")
    print("Database initialization complete.")
    
    yield

    print("Shutting down...")
    await engine.dispose()

app = FastAPI(lifespan=lifespan, title="Chitti API")

origins = [
    "http://localhost:5173",
]
if settings.CLIENT_ORIGIN:
    origins.append(settings.CLIENT_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(chits_router.router)
app.include_router(members_router.router)
app.include_router(slots_router.router)
app.include_router(payouts_router.router)
app.include_router(payments_router.router)
app.include_router(collections_router.router)  # Stub for backwards compatibility

@app.get("/")
def read_root():
    return {"message": "Welcome to Chitti API"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and deployment verification."""
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )