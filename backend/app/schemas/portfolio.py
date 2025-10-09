from datetime import datetime
from pydantic import BaseModel


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

