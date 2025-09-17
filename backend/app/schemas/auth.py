# backend/app/schemas/auth.py

from pydantic import BaseModel

class PhoneVerificationRequest(BaseModel):
    phone_number: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserData(BaseModel):
    phone: str

# New schema for token payload
class TokenData(BaseModel):
    phone_number: str | None = None