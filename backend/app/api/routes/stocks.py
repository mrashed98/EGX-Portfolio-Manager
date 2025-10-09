from fastapi import APIRouter, Depends, HTTPException, status, Query as QueryParam
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.stock import Stock
from app.models.strategy import Strategy
from app.models.holding import Holding
from app.schemas.stock import StockResponse, StockCreate, StockDetailResponse
from app.services.tradingview_service import tradingview_service
from app.services.strategy_service import strategy_service

router = APIRouter(prefix="/stocks", tags=["stocks"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[StockResponse])
async def list_stocks(
    skip: int = 0,
    limit: int = 500,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    query = select(Stock)
    
    if search:
        query = query.where(
            Stock.symbol.ilike(f"%{search}%") | 
            Stock.name.ilike(f"%{search}%")
        )
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    stocks = result.scalars().all()
    
    return stocks


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_stocks(
    q: str = QueryParam(..., min_length=1, description="Search query for stock symbol or name"),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Search for stocks on TradingView by symbol or company name"""
    
    try:
        # Search TradingView
        results = await tradingview_service.search_stocks_by_query(q)
        
        return {
            "query": q,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error searching stocks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search stocks: {str(e)}"
        )


@router.get("/{stock_id}", response_model=StockResponse)
async def get_stock(
    stock_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(select(Stock).where(Stock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    
    return stock


@router.get("/{stock_id}/history", status_code=status.HTTP_200_OK)
async def get_stock_history(
    stock_id: int,
    interval: str = QueryParam(default="1D", description="Time interval (1D, 1W, 1M)"),
    range: str = QueryParam(default="1M", description="Time range (1W, 1M, 3M, 6M, 1Y, ALL)"),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get historical price data for a stock"""
    result = await db.execute(select(Stock).where(Stock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    
    try:
        # Fetch historical data from TradingView service
        history = await tradingview_service.get_stock_history(
            symbol=stock.symbol,
            interval=interval,
            range_param=range
        )
        
        return {
            "symbol": stock.symbol,
            "interval": interval,
            "range": range,
            "data": history
        }
    except Exception as e:
        logger.error(f"Error fetching history for stock {stock.symbol}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch historical data: {str(e)}"
        )


@router.get("/{stock_id}/details", response_model=StockDetailResponse)
async def get_stock_details(
    stock_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get detailed stock information with technical analysis"""
    result = await db.execute(select(Stock).where(Stock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    
    # Return stock details directly from database
    return StockDetailResponse(
        id=stock.id,
        symbol=stock.symbol,
        name=stock.name,
        exchange=stock.exchange,
        current_price=stock.current_price,
        logo_url=stock.logo_url,
        sector=stock.sector,
        industry=stock.industry,
        last_updated=stock.last_updated,
        open_price=stock.open_price,
        high_price=stock.high_price,
        low_price=stock.low_price,
        volume=stock.volume,
        change=stock.change,
        change_percent=stock.change_percent,
        recommendation=stock.recommendation,
    )


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_all_stocks(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Sync all EGX stocks from TradingView screener - adds new stocks and updates existing ones"""
    # Fetch all stocks from TradingView screener
    tv_stocks = await tradingview_service.fetch_all_egx_stocks()
    
    if not tv_stocks:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to fetch stocks from TradingView"
        )
    
    added_count = 0
    updated_count = 0
    
    for tv_stock in tv_stocks:
        symbol = tv_stock["symbol"]
        
        # Check if stock exists
        result = await db.execute(select(Stock).where(Stock.symbol == symbol))
        existing_stock = result.scalar_one_or_none()
        
        if existing_stock:
            # Update existing stock
            existing_stock.name = tv_stock["name"]
            existing_stock.current_price = tv_stock.get("price", existing_stock.current_price)
            # Update logo if provided
            if tv_stock.get("logo"):
                existing_stock.logo_url = tv_stock["logo"]
            # Update sector and industry
            if tv_stock.get("sector"):
                existing_stock.sector = tv_stock["sector"]
            if tv_stock.get("industry"):
                existing_stock.industry = tv_stock["industry"]
            # Update OHLC data
            existing_stock.open_price = tv_stock.get("open")
            existing_stock.high_price = tv_stock.get("high")
            existing_stock.low_price = tv_stock.get("low")
            existing_stock.volume = tv_stock.get("volume")
            existing_stock.change = tv_stock.get("change")
            existing_stock.change_percent = tv_stock.get("change_percent")
            existing_stock.recommendation = tv_stock.get("recommendation")
            updated_count += 1
        else:
            # Add new stock
            # Use logo from fetch response, or generate avatar as fallback
            logo_url = tv_stock.get("logo")
            if not logo_url:
                logo_url = tradingview_service._generate_logo_url(symbol)
            
            new_stock = Stock(
                symbol=symbol,
                name=tv_stock["name"],
                exchange=tv_stock["exchange"],
                current_price=tv_stock.get("price", 100.0),
                logo_url=logo_url,
                sector=tv_stock.get("sector"),
                industry=tv_stock.get("industry"),
                open_price=tv_stock.get("open"),
                high_price=tv_stock.get("high"),
                low_price=tv_stock.get("low"),
                volume=tv_stock.get("volume"),
                change=tv_stock.get("change"),
                change_percent=tv_stock.get("change_percent"),
                recommendation=tv_stock.get("recommendation")
            )
            db.add(new_stock)
            added_count += 1
    
    await db.commit()
    
    return {
        "message": f"Stock sync completed",
        "added": added_count,
        "updated": updated_count,
        "total": len(tv_stocks)
    }


@router.delete("/{stock_id}", status_code=status.HTTP_200_OK)
async def delete_stock(
    stock_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Delete a stock from the database (admin function)"""
    # Get the stock
    result = await db.execute(select(Stock).where(Stock.id == stock_id))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    
    # Check if there are holdings associated with this stock
    holdings_result = await db.execute(
        select(Holding).where(Holding.stock_id == stock_id)
    )
    holdings = holdings_result.scalars().all()
    
    if holdings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete stock: {len(holdings)} holdings are associated with it"
        )
    
    # Delete the stock
    await db.delete(stock)
    await db.commit()
    
    return {
        "message": f"Stock {stock.symbol} deleted successfully",
        "symbol": stock.symbol,
        "name": stock.name
    }


@router.delete("/by-symbol/{symbol}", status_code=status.HTTP_200_OK)
async def delete_stock_by_symbol(
    symbol: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Delete a stock by symbol (admin function)"""
    # Get the stock
    result = await db.execute(select(Stock).where(Stock.symbol == symbol))
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with symbol {symbol} not found"
        )
    
    # Check if there are holdings associated with this stock
    holdings_result = await db.execute(
        select(Holding).where(Holding.stock_id == stock.id)
    )
    holdings = holdings_result.scalars().all()
    
    if holdings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete stock: {len(holdings)} holdings are associated with it. Please remove holdings first."
        )
    
    # Delete the stock
    await db.delete(stock)
    await db.commit()
    
    return {
        "message": f"Stock {symbol} deleted successfully",
        "symbol": stock.symbol,
        "name": stock.name
    }


@router.post("/add-custom", status_code=status.HTTP_201_CREATED)
async def add_custom_stock(
    symbol: str = QueryParam(..., min_length=1, description="Stock symbol to add"),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Add a custom stock from TradingView to the database"""
    # Check if stock already exists
    result = await db.execute(select(Stock).where(Stock.symbol == symbol.upper()))
    existing_stock = result.scalar_one_or_none()
    
    if existing_stock:
        return {
            "message": f"Stock {symbol} already exists in database",
            "stock": existing_stock,
            "created": False
        }
    
    # Fetch stock data from TradingView
    stock_data = await tradingview_service.fetch_single_stock_data(symbol)
    
    if not stock_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock {symbol} not found on TradingView"
        )
    
    # Create new stock in database
    logo_url = stock_data.get("logo")
    if not logo_url:
        logo_url = tradingview_service._generate_logo_url(stock_data["symbol"])
    
    new_stock = Stock(
        symbol=stock_data["symbol"],
        name=stock_data["name"],
        exchange=stock_data["exchange"],
        current_price=stock_data.get("price", 0.0),
        logo_url=logo_url,
        sector=stock_data.get("sector"),
        industry=stock_data.get("industry"),
        open_price=stock_data.get("open"),
        high_price=stock_data.get("high"),
        low_price=stock_data.get("low"),
        volume=stock_data.get("volume"),
        change=stock_data.get("change"),
        change_percent=stock_data.get("change_percent"),
        recommendation=stock_data.get("recommendation")
    )
    
    db.add(new_stock)
    await db.commit()
    await db.refresh(new_stock)
    
    return {
        "message": f"Stock {symbol} added successfully",
        "stock": new_stock,
        "created": True
    }


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_stock_prices(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Refresh stock prices from TradingView
    await tradingview_service.refresh_prices(db)
    
    # Update all holdings' current values based on new stock prices
    holdings_result = await db.execute(
        select(Holding, Stock)
        .join(Stock, Holding.stock_id == Stock.id)
    )
    holdings_with_stocks = holdings_result.all()
    
    for holding, stock in holdings_with_stocks:
        holding.current_value = holding.quantity * stock.current_price
    
    await db.commit()
    
    # Get all unique strategies that need snapshot updates
    strategies_result = await db.execute(select(Strategy))
    strategies = strategies_result.scalars().all()
    
    # Create new snapshots for all strategies
    for strategy in strategies:
        await strategy_service.create_snapshot(db, strategy.id)
    
    return {"message": "Stock prices and holdings refreshed successfully"}

