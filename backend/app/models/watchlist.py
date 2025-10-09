from sqlalchemy import String, Integer, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    stock_ids: Mapped[list[int]] = mapped_column(ARRAY(Integer), nullable=False, default=list)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="watchlists")

