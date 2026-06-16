from decimal import Decimal
import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class RecipeItem(Base):
    __tablename__ = "recipe_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"))
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("items.id"))
    quantity: Mapped[Decimal]
    unit: Mapped[str]

    product: Mapped["Product"] = relationship(back_populates="recipe_items")
    item: Mapped["Item"] = relationship(back_populates="recipe_items")
