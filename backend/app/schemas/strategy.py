from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator
from typing import Any


class PortfolioAllocation(BaseModel):
    portfolio_id: int
    percentage: float
    stock_allocations: dict[int, float]  # stock_id -> percentage

    @model_validator(mode='before')
    @classmethod
    def convert_string_keys_to_int(cls, data: Any) -> Any:
        """Convert string keys in stock_allocations to integers (for DB JSON deserialization)"""
        if isinstance(data, dict) and 'stock_allocations' in data:
            stock_allocs = data['stock_allocations']
            if isinstance(stock_allocs, dict):
                # Convert string keys to int keys
                data['stock_allocations'] = {
                    int(k): v for k, v in stock_allocs.items()
                }
        return data


class StrategyBase(BaseModel):
    name: str
    total_funds: float
    portfolio_allocations: list[PortfolioAllocation]

    @field_validator('portfolio_allocations')
    @classmethod
    def validate_portfolio_allocations(cls, v):
        total = sum(alloc.percentage for alloc in v)
        if abs(total - 100.0) > 0.01:
            raise ValueError('Portfolio allocations must sum to 100%')
        
        # Validate stock allocations within each portfolio
        for alloc in v:
            stock_total = sum(alloc.stock_allocations.values())
            if abs(stock_total - 100.0) > 0.01:
                raise ValueError(f'Stock allocations in portfolio {alloc.portfolio_id} must sum to 100%')
        
        return v


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: str | None = None
    total_funds: float | None = None
    portfolio_allocations: list[PortfolioAllocation] | None = None

    @field_validator('portfolio_allocations')
    @classmethod
    def validate_portfolio_allocations(cls, v):
        if v is None:
            return v
        total = sum(alloc.percentage for alloc in v)
        if abs(total - 100.0) > 0.01:
            raise ValueError('Portfolio allocations must sum to 100%')
        
        for alloc in v:
            stock_total = sum(alloc.stock_allocations.values())
            if abs(stock_total - 100.0) > 0.01:
                raise ValueError(f'Stock allocations in portfolio {alloc.portfolio_id} must sum to 100%')
        
        return v


class StrategyResponse(BaseModel):
    id: int
    user_id: int
    name: str
    total_funds: float
    remaining_cash: float
    portfolio_allocations: list[PortfolioAllocation]
    created_at: datetime

    @model_validator(mode='before')
    @classmethod
    def convert_portfolio_allocations(cls, data: Any) -> Any:
        """Convert portfolio_allocations from database JSON to PortfolioAllocation objects"""
        if isinstance(data, dict) and 'portfolio_allocations' in data:
            allocs = data['portfolio_allocations']
            if isinstance(allocs, list):
                # Convert each dict to PortfolioAllocation
                data['portfolio_allocations'] = [
                    PortfolioAllocation(**alloc) if isinstance(alloc, dict) else alloc
                    for alloc in allocs
                ]
        return data

    class Config:
        from_attributes = True


class StrategySnapshotResponse(BaseModel):
    id: int
    strategy_id: int
    total_value: float
    performance_percentage: float
    snapshot_date: datetime

    class Config:
        from_attributes = True

