from datetime import datetime
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    exchange: Mapped[str] = mapped_column(String(50), nullable=False)
    current_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    logo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    sector: Mapped[str] = mapped_column(String(100), nullable=True)
    industry: Mapped[str] = mapped_column(String(100), nullable=True)
    open_price: Mapped[float] = mapped_column(Float, nullable=True)
    high_price: Mapped[float] = mapped_column(Float, nullable=True)
    low_price: Mapped[float] = mapped_column(Float, nullable=True)
    volume: Mapped[float] = mapped_column(Float, nullable=True)
    change: Mapped[float] = mapped_column(Float, nullable=True)
    change_percent: Mapped[float] = mapped_column(Float, nullable=True)
    recommendation: Mapped[str] = mapped_column(String(50), nullable=True)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

