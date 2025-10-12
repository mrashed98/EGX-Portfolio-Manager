from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HoldingResponse(BaseModel):
    id: int
    user_id: int
    strategy_id: Optional[int] = None
    portfolio_id: Optional[int] = None
    stock_id: int
    quantity: int
    average_price: float
    current_value: float
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_manual: bool = False

    class Config:
        from_attributes = True


class HoldingWithStock(HoldingResponse):
    stock_symbol: str
    stock_name: str
    stock_logo_url: str | None = None
    current_stock_price: float
    stock_sector: str | None = None
    strategy_name: str | None = None
    portfolio_name: str | None = None


class ManualHoldingCreate(BaseModel):
    stock_id: int
    quantity: int
    average_price: float
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None


class HoldingUpdate(BaseModel):
    quantity: Optional[int] = None
    average_price: Optional[float] = None
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None


class HoldingMap(BaseModel):
    strategy_id: Optional[int] = None
    portfolio_id: Optional[int] = None


class CSVHoldingImport(BaseModel):
    stock_symbol: str
    quantity: int
    purchase_price: float
    purchase_date: Optional[str] = None
    notes: Optional[str] = None

