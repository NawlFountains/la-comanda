import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from decimal import Decimal

class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"))
    name: Mapped[str]
    unit: Mapped[str]
    current_stock: Mapped[Decimal]
    low_stock_threshold: Mapped[Decimal]
    notes: Mapped[str | None]

    recipe_items: Mapped[list["RecipeItem"]] = relationship(back_populates="item")
    restock_items: Mapped[list["RestockItem"]] = relationship(back_populates="item")
    business: Mapped["Business"] = relationship(back_populates="items")
