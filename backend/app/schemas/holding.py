from pydantic import BaseModel


class HoldingResponse(BaseModel):
    id: int
    user_id: int
    strategy_id: int
    stock_id: int
    quantity: int
    average_price: float
    current_value: float

    class Config:
        from_attributes = True


class HoldingWithStock(HoldingResponse):
    stock_symbol: str
    stock_name: str
    stock_logo_url: str | None = None
    current_stock_price: float
    stock_sector: str | None = None

