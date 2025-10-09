from datetime import datetime
from pydantic import BaseModel
from typing import Dict, List, Any


class PortfolioBase(BaseModel):
    name: str
    stock_ids: list[int]


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(PortfolioBase):
    pass


class PortfolioResponse(PortfolioBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioSnapshotResponse(BaseModel):
    id: int
    portfolio_id: int
    snapshot_date: datetime
    total_value: float
    stock_count: int
    stock_prices: Dict[str, float]
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioHistoryResponse(BaseModel):
    id: int
    portfolio_id: int
    action: str
    description: str
    changes: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioPerformanceResponse(BaseModel):
    current_value: float
    initial_value: float
    change: float
    change_percent: float
    initial_date: str
    time_series: List[Dict[str, Any]]
    stock_count: int


class SectorAllocationResponse(BaseModel):
    sector: str
    allocation_percent: float
    stock_count: int
    avg_change_percent: float
    stocks: List[Dict[str, Any]]

