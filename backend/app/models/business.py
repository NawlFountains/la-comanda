import uuid
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(unique=True)
    name: Mapped[str]
    phone: Mapped[str | None]
    created_at: Mapped[str] = mapped_column(server_default=func.now())

    customers: Mapped[list["Customer"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    products: Mapped[list["Product"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    items: Mapped[list["Item"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    restocks: Mapped[list["Restock"]] = relationship(back_populates="business", cascade="all, delete-orphan")
