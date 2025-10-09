from datetime import datetime
from sqlalchemy import DateTime, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RebalancingHistory(Base):
    __tablename__ = "rebalancing_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    strategy_id: Mapped[int] = mapped_column(Integer, ForeignKey("strategies.id"), nullable=False)
    # actions structure: [{"action": "buy|sell", "stock_id": 1, "quantity": 10, "price": 100.5}]
    actions: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    executed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    strategy: Mapped["Strategy"] = relationship(back_populates="rebalancing_history")

