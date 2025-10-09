from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.holding import Holding
from app.models.stock import Stock
from app.schemas.holding import HoldingWithStock

router = APIRouter(prefix="/holdings", tags=["holdings"])


@router.get("", response_model=list[HoldingWithStock])
async def list_holdings(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Holding, Stock)
        .join(Stock, Holding.stock_id == Stock.id)
        .where(Holding.user_id == user_id)
    )
    holdings_with_stocks = result.all()
    
    return [
        HoldingWithStock(
            id=holding.id,
            user_id=holding.user_id,
            strategy_id=holding.strategy_id,
            stock_id=holding.stock_id,
            quantity=holding.quantity,
            average_price=holding.average_price,
            current_value=holding.current_value,
            stock_symbol=stock.symbol,
            stock_name=stock.name,
            stock_logo_url=stock.logo_url,
            current_stock_price=stock.current_price,
            stock_sector=stock.sector
        )
        for holding, stock in holdings_with_stocks
    ]


@router.get("/strategy/{strategy_id}", response_model=list[HoldingWithStock])
async def list_strategy_holdings(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Holding, Stock)
        .join(Stock, Holding.stock_id == Stock.id)
        .where(
            Holding.user_id == user_id,
            Holding.strategy_id == strategy_id
        )
    )
    holdings_with_stocks = result.all()
    
    return [
        HoldingWithStock(
            id=holding.id,
            user_id=holding.user_id,
            strategy_id=holding.strategy_id,
            stock_id=holding.stock_id,
            quantity=holding.quantity,
            average_price=holding.average_price,
            current_value=holding.current_value,
            stock_symbol=stock.symbol,
            stock_name=stock.name,
            stock_logo_url=stock.logo_url,
            current_stock_price=stock.current_price,
            stock_sector=stock.sector
        )
        for holding, stock in holdings_with_stocks
    ]

