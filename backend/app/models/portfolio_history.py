from datetime import datetime
from sqlalchemy import DateTime, Integer, String, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PortfolioHistory(Base):
    __tablename__ = "portfolio_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    portfolio_id: Mapped[int] = mapped_column(Integer, ForeignKey("portfolios.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # 'created', 'added_stocks', 'removed_stocks', 'renamed'
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # changes structure: {"added": [stock_ids], "removed": [stock_ids], "old_name": "", "new_name": ""}
    changes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship(back_populates="history")

