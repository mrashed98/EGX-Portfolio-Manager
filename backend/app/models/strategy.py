from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Strategy(Base):
    __tablename__ = "strategies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_funds: Mapped[float] = mapped_column(Float, nullable=False)
    remaining_cash: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # portfolio_allocations structure: 
    # [{"portfolio_id": 1, "percentage": 60, "stock_allocations": {"stock_id": percentage}}]
    portfolio_allocations: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="strategies")
    holdings: Mapped[list["Holding"]] = relationship(back_populates="strategy", cascade="all, delete-orphan")
    snapshots: Mapped[list["StrategySnapshot"]] = relationship(back_populates="strategy", cascade="all, delete-orphan")
    rebalancing_history: Mapped[list["RebalancingHistory"]] = relationship(back_populates="strategy", cascade="all, delete-orphan")

