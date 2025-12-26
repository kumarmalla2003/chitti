# backend/app/crud/__init__.py

# Import modules as they are (with function-based patterns)
from app.crud import crud_chits
from app.crud import crud_members
from app.crud import crud_payments

# Import class-based CRUD singletons
from app.crud.crud_slots import slots as crud_slots

__all__ = [
    "crud_chits",
    "crud_members",
    "crud_payments",
    "crud_slots",
]
