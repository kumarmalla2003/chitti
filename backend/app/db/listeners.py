# backend/app/db/listeners.py

"""
SQLAlchemy event listeners for automatic timestamp management.
Automatically updates `updated_at` field before any UPDATE operation.
"""

from datetime import datetime, timezone
from sqlalchemy import event


def utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


def before_update_listener(mapper, connection, target):
    """
    Automatically update updated_at before any UPDATE.
    This listener is triggered for all mapped instances before they are updated.
    """
    if hasattr(target, 'updated_at'):
        target.updated_at = utc_now()


def register_listeners():
    """
    Register event listeners for all models that have updated_at field.
    Must be called after all models are imported.
    """
    from app.models.chits import Chit
    from app.models.members import Member
    from app.models.slots import ChitSlot
    from app.models.payments import Payment
    from app.models.auth import AuthorizedPhone, Credential
    
    MODELS_WITH_TIMESTAMPS = [
        Chit,
        Member,
        ChitSlot,
        Payment,
        AuthorizedPhone,
        Credential
    ]
    
    for model in MODELS_WITH_TIMESTAMPS:
        event.listen(model, 'before_update', before_update_listener)
