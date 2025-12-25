# backend/app/crud/__init__.py

# Import modules as they are (with function-based patterns)
from app.crud import crud_chits
from app.crud import crud_members
from app.crud import crud_assignments
from app.crud import crud_payments

# Import class-based CRUD singletons
from app.crud.crud_collections import collections
from app.crud.crud_payouts import payouts

__all__ = [
    "crud_chits",
    "crud_members",
    "crud_assignments",
    "crud_payments",
    "collections",
    "payouts",
]
