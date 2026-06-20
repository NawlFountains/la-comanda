from sqlalchemy.engine import result

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Business, Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.dependencies.auth import get_current_business
import uuid

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("", response_model=list[CustomerResponse])
async def get_customers(
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Customer)
            .where(Customer.business_id == business.id)
            .order_by(func.lower(Customer.name))
    )
    customers = result.scalars().all()

    return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
        customer_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Customer)
            .where(
                Customer.id == customer_id,
                Customer.business_id == business.id
            )
    )

    customer = result.scalar_one_or_none()

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer

@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
        data: CustomerCreate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    customer= Customer(
            id = uuid.uuid4(),
            business_id = business.id,
            **data.model_dump()
    )

    db.add(customer)

    await db.commit()
    await db.refresh(customer)
    return customer 

@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
        customer_id: uuid.UUID,
        data: CustomerUpdate,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Customer)
            .where(
                Customer.id == customer_id,
                Customer.business_id == business.id
            )
    )

    customer = result.scalar_one_or_none()

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    if data.name is not None:
        customer.name = data.name

    if data.phone is not None:
        customer.phone = data.phone

    await db.commit()
    await db.refresh(customer)
    return customer

@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
        customer_id: uuid.UUID,
        business: Business = Depends(get_current_business),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
            select(Customer)
            .where(
                Customer.id == customer_id,
                Customer.business_id == business.id
            )
    )

    customer = result.scalar_one_or_none()

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    await db.delete(customer)
    await db.commit()
