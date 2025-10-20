from sqlalchemy import Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional

from app.core.database import Base


class TradingViewCredential(Base):
    __tablename__ = "tradingview_credentials"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    encrypted_password: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted (deprecated)
    session_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # TradingView session cookie
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_check_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    connection_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="tradingview_credential")

