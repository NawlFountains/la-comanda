import uuid
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import TIMESTAMP
from app.database import Base
from datetime import datetime

class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    phone: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True),server_default=func.now())

    customers: Mapped[list["Customer"]] = relationship(back_populates="business")
    products: Mapped[list["Product"]] = relationship(back_populates="business")
    items: Mapped[list["Items"]] = relationship(back_populates="business")
    orders: Mapped[list["Order"]] = relationship(back_populates="business")
    restocks: Mapped[list["Restock"]] = relationship(back_populates="business")
