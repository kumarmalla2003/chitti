# backend/app/core/config.py

from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List, Any

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Initial Data Seeding
    AUTHORIZED_PHONE_NUMBERS: List[str] = []
    UNIVERSAL_PIN: str | None = None
    
    # CORS
    CLIENT_ORIGIN: str | None = None
    
    # Cookie Security
    COOKIE_SECURE: bool = False

    # Fixed validator - using mode='before' and proper type checking
    @field_validator("AUTHORIZED_PHONE_NUMBERS", mode='before')
    @classmethod
    def split_phone_numbers(cls, v: Any) -> List[str]:
        if v is None:
            return []
        if isinstance(v, str):
            # Split by comma and strip whitespace, filter out empty strings
            return [item.strip() for item in v.split(',') if item.strip()]
        elif isinstance(v, list):
            # If it's already a list, return as is
            return v
        return []

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()