from datetime import datetime
from sqlalchemy import DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StrategySnapshot(Base):
    __tablename__ = "strategy_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    strategy_id: Mapped[int] = mapped_column(Integer, ForeignKey("strategies.id"), nullable=False)
    total_value: Mapped[float] = mapped_column(Float, nullable=False)
    performance_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    snapshot_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    strategy: Mapped["Strategy"] = relationship(back_populates="snapshots")

