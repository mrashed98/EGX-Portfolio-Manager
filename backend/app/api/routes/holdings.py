from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.holding import Holding
from app.models.stock import Stock
from app.models.strategy import Strategy
from app.models.portfolio import Portfolio
from app.schemas.holding import (
    HoldingWithStock,
    ManualHoldingCreate,
    HoldingUpdate,
    HoldingMap,
    CSVHoldingImport
)

router = APIRouter(prefix="/holdings", tags=["holdings"])


async def _get_strategy_name(db: AsyncSession, strategy_id: Optional[int]) -> Optional[str]:
    """Helper function to get strategy name"""
    if not strategy_id:
        return None
    result = await db.execute(select(Strategy).where(Strategy.id == strategy_id))
    strategy = result.scalar_one_or_none()
    return strategy.name if strategy else None


async def _get_portfolio_name(db: AsyncSession, portfolio_id: Optional[int]) -> Optional[str]:
    """Helper function to get portfolio name"""
    if not portfolio_id:
        return None
    result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    portfolio = result.scalar_one_or_none()
    return portfolio.name if portfolio else None


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
    
    holdings_list = []
    for holding, stock in holdings_with_stocks:
        strategy_name = await _get_strategy_name(db, holding.strategy_id)
        portfolio_name = await _get_portfolio_name(db, holding.portfolio_id)
        
        holdings_list.append(HoldingWithStock(
            id=holding.id,
            user_id=holding.user_id,
            strategy_id=holding.strategy_id,
            portfolio_id=holding.portfolio_id,
            stock_id=holding.stock_id,
            quantity=holding.quantity,
            average_price=holding.average_price,
            current_value=holding.current_value,
            purchase_date=holding.purchase_date,
            notes=holding.notes,
            is_manual=holding.is_manual,
            stock_symbol=stock.symbol,
            stock_name=stock.name,
            stock_logo_url=stock.logo_url,
            current_stock_price=stock.current_price,
            stock_sector=stock.sector,
            strategy_name=strategy_name,
            portfolio_name=portfolio_name
        ))
    
    return holdings_list


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
    
    holdings_list = []
    for holding, stock in holdings_with_stocks:
        strategy_name = await _get_strategy_name(db, holding.strategy_id)
        portfolio_name = await _get_portfolio_name(db, holding.portfolio_id)
        
        holdings_list.append(HoldingWithStock(
            id=holding.id,
            user_id=holding.user_id,
            strategy_id=holding.strategy_id,
            portfolio_id=holding.portfolio_id,
            stock_id=holding.stock_id,
            quantity=holding.quantity,
            average_price=holding.average_price,
            current_value=holding.current_value,
            purchase_date=holding.purchase_date,
            notes=holding.notes,
            is_manual=holding.is_manual,
            stock_symbol=stock.symbol,
            stock_name=stock.name,
            stock_logo_url=stock.logo_url,
            current_stock_price=stock.current_price,
            stock_sector=stock.sector,
            strategy_name=strategy_name,
            portfolio_name=portfolio_name
        ))
    
    return holdings_list


# New endpoints for manual holdings

@router.get("/unmapped", response_model=list[HoldingWithStock])
async def list_unmapped_holdings(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get all holdings that are not mapped to any strategy or portfolio"""
    result = await db.execute(
        select(Holding, Stock)
        .join(Stock, Holding.stock_id == Stock.id)
        .where(
            Holding.user_id == user_id,
            Holding.strategy_id.is_(None),
            Holding.portfolio_id.is_(None)
        )
    )
    holdings_with_stocks = result.all()
    
    holdings_list = []
    for holding, stock in holdings_with_stocks:
        holdings_list.append(HoldingWithStock(
            id=holding.id,
            user_id=holding.user_id,
            strategy_id=holding.strategy_id,
            portfolio_id=holding.portfolio_id,
            stock_id=holding.stock_id,
            quantity=holding.quantity,
            average_price=holding.average_price,
            current_value=holding.current_value,
            purchase_date=holding.purchase_date,
            notes=holding.notes,
            is_manual=holding.is_manual,
            stock_symbol=stock.symbol,
            stock_name=stock.name,
            stock_logo_url=stock.logo_url,
            current_stock_price=stock.current_price,
            stock_sector=stock.sector,
            strategy_name=None,
            portfolio_name=None
        ))
    
    return holdings_list


@router.post("/manual", response_model=HoldingWithStock, status_code=status.HTTP_201_CREATED)
async def create_manual_holding(
    holding_data: ManualHoldingCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Create a manual holding without a strategy"""
    # Verify stock exists
    stock_result = await db.execute(
        select(Stock).where(Stock.id == holding_data.stock_id)
    )
    stock = stock_result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with id {holding_data.stock_id} not found"
        )
    
    # Create the holding
    current_value = holding_data.quantity * stock.current_price
    
    new_holding = Holding(
        user_id=user_id,
        stock_id=holding_data.stock_id,
        quantity=holding_data.quantity,
        average_price=holding_data.average_price,
        current_value=current_value,
        purchase_date=holding_data.purchase_date or datetime.utcnow(),
        notes=holding_data.notes,
        is_manual=True
    )
    
    db.add(new_holding)
    await db.commit()
    await db.refresh(new_holding)
    
    return HoldingWithStock(
        id=new_holding.id,
        user_id=new_holding.user_id,
        strategy_id=new_holding.strategy_id,
        portfolio_id=new_holding.portfolio_id,
        stock_id=new_holding.stock_id,
        quantity=new_holding.quantity,
        average_price=new_holding.average_price,
        current_value=new_holding.current_value,
        purchase_date=new_holding.purchase_date,
        notes=new_holding.notes,
        is_manual=new_holding.is_manual,
        stock_symbol=stock.symbol,
        stock_name=stock.name,
        stock_logo_url=stock.logo_url,
        current_stock_price=stock.current_price,
        stock_sector=stock.sector,
        strategy_name=None,
        portfolio_name=None
    )


@router.put("/{holding_id}", response_model=HoldingWithStock)
async def update_holding(
    holding_id: int,
    holding_data: HoldingUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Update holding details"""
    result = await db.execute(
        select(Holding).where(
            Holding.id == holding_id,
            Holding.user_id == user_id
        )
    )
    holding = result.scalar_one_or_none()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found"
        )
    
    # Update fields if provided
    if holding_data.quantity is not None:
        holding.quantity = holding_data.quantity
    if holding_data.average_price is not None:
        holding.average_price = holding_data.average_price
    if holding_data.purchase_date is not None:
        holding.purchase_date = holding_data.purchase_date
    if holding_data.notes is not None:
        holding.notes = holding_data.notes
    
    # Recalculate current value
    stock_result = await db.execute(select(Stock).where(Stock.id == holding.stock_id))
    stock = stock_result.scalar_one()
    holding.current_value = holding.quantity * stock.current_price
    
    await db.commit()
    await db.refresh(holding)
    
    strategy_name = await _get_strategy_name(db, holding.strategy_id)
    portfolio_name = await _get_portfolio_name(db, holding.portfolio_id)
    
    return HoldingWithStock(
        id=holding.id,
        user_id=holding.user_id,
        strategy_id=holding.strategy_id,
        portfolio_id=holding.portfolio_id,
        stock_id=holding.stock_id,
        quantity=holding.quantity,
        average_price=holding.average_price,
        current_value=holding.current_value,
        purchase_date=holding.purchase_date,
        notes=holding.notes,
        is_manual=holding.is_manual,
        stock_symbol=stock.symbol,
        stock_name=stock.name,
        stock_logo_url=stock.logo_url,
        current_stock_price=stock.current_price,
        stock_sector=stock.sector,
        strategy_name=strategy_name,
        portfolio_name=portfolio_name
    )


@router.put("/{holding_id}/map", response_model=HoldingWithStock)
async def map_holding(
    holding_id: int,
    map_data: HoldingMap,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Map a holding to a strategy or portfolio"""
    result = await db.execute(
        select(Holding).where(
            Holding.id == holding_id,
            Holding.user_id == user_id
        )
    )
    holding = result.scalar_one_or_none()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found"
        )
    
    # Verify strategy or portfolio exists if provided
    if map_data.strategy_id:
        strategy_result = await db.execute(
            select(Strategy).where(
                Strategy.id == map_data.strategy_id,
                Strategy.user_id == user_id
            )
        )
        if not strategy_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Strategy not found"
            )
        holding.strategy_id = map_data.strategy_id
    
    if map_data.portfolio_id:
        portfolio_result = await db.execute(
            select(Portfolio).where(
                Portfolio.id == map_data.portfolio_id,
                Portfolio.user_id == user_id
            )
        )
        if not portfolio_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        holding.portfolio_id = map_data.portfolio_id
    
    await db.commit()
    await db.refresh(holding)
    
    # Get stock info
    stock_result = await db.execute(select(Stock).where(Stock.id == holding.stock_id))
    stock = stock_result.scalar_one()
    
    strategy_name = await _get_strategy_name(db, holding.strategy_id)
    portfolio_name = await _get_portfolio_name(db, holding.portfolio_id)
    
    return HoldingWithStock(
        id=holding.id,
        user_id=holding.user_id,
        strategy_id=holding.strategy_id,
        portfolio_id=holding.portfolio_id,
        stock_id=holding.stock_id,
        quantity=holding.quantity,
        average_price=holding.average_price,
        current_value=holding.current_value,
        purchase_date=holding.purchase_date,
        notes=holding.notes,
        is_manual=holding.is_manual,
        stock_symbol=stock.symbol,
        stock_name=stock.name,
        stock_logo_url=stock.logo_url,
        current_stock_price=stock.current_price,
        stock_sector=stock.sector,
        strategy_name=strategy_name,
        portfolio_name=portfolio_name
    )


@router.delete("/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holding(
    holding_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Delete a manual holding"""
    result = await db.execute(
        select(Holding).where(
            Holding.id == holding_id,
            Holding.user_id == user_id,
            Holding.is_manual == True
        )
    )
    holding = result.scalar_one_or_none()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manual holding not found"
        )
    
    await db.delete(holding)
    await db.commit()
    
    return None

