import uuid
from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import date

class Restock(Base):
    __tablename__ = "restocks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"))
    created_at: Mapped[date] = mapped_column(server_default=func.now())
    supplier: Mapped[str | None]
    notes: Mapped[str | None]

    business: Mapped["Business"] = relationship(back_populates="restocks")
    restock_items: Mapped[list["RestockItem"]] = relationship(back_populates="restock")
