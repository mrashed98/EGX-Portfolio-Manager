from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    stock_ids: Mapped[list[int]] = mapped_column(ARRAY(Integer), nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="portfolios")
    snapshots: Mapped[list["PortfolioSnapshot"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")
    history: Mapped[list["PortfolioHistory"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")
    holdings: Mapped[list["Holding"]] = relationship("Holding", back_populates="portfolio", foreign_keys="[Holding.portfolio_id]")

