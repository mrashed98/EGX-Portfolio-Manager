from datetime import datetime
from pydantic import BaseModel


class StockBase(BaseModel):
    symbol: str
    name: str
    exchange: str


class StockCreate(StockBase):
    current_price: float = 0.0


class StockUpdate(BaseModel):
    current_price: float


class StockResponse(StockBase):
    id: int
    current_price: float
    logo_url: str | None = None
    sector: str | None = None
    industry: str | None = None
    last_updated: datetime

    class Config:
        from_attributes = True


class StockDetailResponse(StockResponse):
    """Detailed stock response with technical analysis"""
    open_price: float | None = None
    high_price: float | None = None
    low_price: float | None = None
    volume: float | None = None
    change: float | None = None
    change_percent: float | None = None
    recommendation: str | None = None

