import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from decimal import Decimal

class RestockItem(Base):
    __tablename__ = "restock_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restock_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restocks.id"))
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("items.id"))
    quantity: Mapped[Decimal]

    restock: Mapped["Restock"] = relationship(back_populates="restock_items")
    item: Mapped["Item"] = relationship(back_populates="restock_items")
