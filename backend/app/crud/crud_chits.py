# backend/app/crud/crud_chits.py

from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chits import Chit
from app.models.slots import ChitSlot
from datetime import date, datetime, timezone
from dateutil.relativedelta import relativedelta
from app.schemas.chits import ChitResponse


async def get_chit_by_id(session: AsyncSession, chit_id: int) -> Chit | None:
    return await session.get(Chit, chit_id)


async def get_chit_by_id_with_details(session: AsyncSession, chit_id: int) -> ChitResponse | None:
    db_chit = await session.get(Chit, chit_id)
    if not db_chit:
        return None

    today = date.today()
    status = "Active" if db_chit.start_date <= today <= db_chit.end_date else "Inactive"
    
    if status == "Active":
        delta = relativedelta(today, db_chit.start_date)
        months_passed = delta.years * 12 + delta.months + 1
        chit_cycle = f"{months_passed}/{db_chit.duration_months}"
    else:
        chit_cycle = f"-/{db_chit.duration_months}"

    # Count total assigned slots for this chit (slots with member_id set)
    members_count_result = await session.execute(
        select(func.count(ChitSlot.id))
        .where(ChitSlot.chit_id == chit_id, ChitSlot.member_id.isnot(None))
    )
    members_count = members_count_result.scalar() or 0

    # Handle chit_type - convert enum to string if needed
    chit_type_value = db_chit.chit_type.value if hasattr(db_chit.chit_type, 'value') else db_chit.chit_type

    return ChitResponse(
        id=db_chit.id,
        name=db_chit.name,
        chit_value=db_chit.chit_value,
        size=db_chit.size, 
        duration_months=db_chit.duration_months,
        start_date=db_chit.start_date,
        end_date=db_chit.end_date,
        status=status,
        chit_cycle=chit_cycle,
        members_count=members_count,
        collection_day=db_chit.collection_day,
        payout_day=db_chit.payout_day,
        # Chit type fields
        chit_type=chit_type_value,
        base_contribution=db_chit.base_contribution,
        premium_contribution=db_chit.premium_contribution,
        payout_premium_percent=db_chit.payout_premium_percent,
        foreman_commission_percent=db_chit.foreman_commission_percent,
        # Optional notes field
        notes=db_chit.notes,
        # Audit timestamps
        created_at=db_chit.created_at,
        updated_at=db_chit.updated_at,
    )


async def delete_chit_by_id(session: AsyncSession, db_chit: Chit):
    await session.delete(db_chit)
    await session.commit()


async def update_chit_timestamp(db_chit: Chit) -> None:
    """Update the updated_at timestamp for a chit."""
    db_chit.updated_at = datetime.now(timezone.utc)


async def record_auction_month(
    session: AsyncSession,
    chit_id: int,
    month: int,
    bid_amount: int,
    member_id: int | None = None
) -> dict:
    """
    Record or Update an auction for a specific month.
    Calculates dividends based on Chit Size (Total Members) and updates the slot.
    """
    # 1. Fetch Chit details
    db_chit = await session.get(Chit, chit_id)
    if not db_chit:
        raise ValueError("Chit not found")
    
    if db_chit.chit_type != "auction":
        raise ValueError(f"Chit is not an Auction type (Type: {db_chit.chit_type})")

    # 2. Use Chit Size (Total Slots) for calculation
    total_slots = db_chit.size
    
    if total_slots == 0:
        raise ValueError("Chit size is 0, cannot calculate dividends")

    # 3. Calculate Financials
    # Foreman Commission Amount
    commission_amount = int(db_chit.chit_value * db_chit.foreman_commission_percent / 100)
    
    # Total Discount (Bid Amount)
    total_discount = bid_amount
    
    # Distributable Dividend
    distributable_dividend = total_discount - commission_amount
    if distributable_dividend < 0:
        distributable_dividend = 0
        
    # Dividend Per Member (Integer division by Total Slots)
    dividend_per_member = int(distributable_dividend / total_slots)
    
    # Base Monthly Installment = Chit Value / Size
    base_installment = int(db_chit.chit_value / total_slots)
    
    # Net Payable (expected contribution) for this month
    net_payable = base_installment - dividend_per_member
    
    # Payout Amount (to the winner)
    payout_amount = db_chit.chit_value - bid_amount

    # 4. Update/Create Slot Record
    slot_stmt = select(ChitSlot).where(ChitSlot.chit_id == chit_id, ChitSlot.month == month)
    slot_result = await session.execute(slot_stmt)
    db_slot = slot_result.scalar_one_or_none()
    
    if db_slot:
        if member_id is not None:
            db_slot.member_id = member_id
        db_slot.payout_amount = payout_amount
        db_slot.bid_amount = bid_amount
        db_slot.expected_contribution = net_payable  # Store per-member contribution for auction
        db_slot.updated_at = datetime.now(timezone.utc)
        session.add(db_slot)
    else:
        # Create new slot record if not exists (shouldn't happen normally)
        db_slot = ChitSlot(
            chit_id=chit_id,
            month=month,
            member_id=member_id,
            payout_amount=payout_amount,
            bid_amount=bid_amount,
            expected_contribution=net_payable
        )
        session.add(db_slot)

    await session.commit()
    
    return {
        "dividend_per_member": dividend_per_member,
        "net_payable_per_member": net_payable,
        "total_monthly_collection": net_payable * total_slots,
        "payout_to_winner": payout_amount,
        "commission_amount": commission_amount,
        "total_dividend_distributed": distributable_dividend
    }