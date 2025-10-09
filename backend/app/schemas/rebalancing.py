from datetime import datetime
from pydantic import BaseModel


class RebalancingAction(BaseModel):
    action: str  # "buy" or "sell"
    stock_id: int
    stock_symbol: str
    quantity: int
    price: float
    total_amount: float


class RebalancingCalculation(BaseModel):
    strategy_id: int
    current_value: float
    target_value: float
    actions: list[RebalancingAction]


class RebalancingHistoryResponse(BaseModel):
    id: int
    strategy_id: int
    actions: list  # List of action dictionaries
    executed: bool
    undone: bool
    undone_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True

