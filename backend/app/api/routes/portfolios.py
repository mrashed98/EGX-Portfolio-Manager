from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.portfolio import Portfolio
from app.schemas.portfolio import (
    PortfolioCreate, 
    PortfolioUpdate, 
    PortfolioResponse,
    PortfolioSnapshotResponse,
    PortfolioHistoryResponse,
    PortfolioPerformanceResponse,
    SectorAllocationResponse
)
from app.services.rebalancing_service import rebalancing_service
from app.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("", response_model=list[PortfolioResponse])
async def list_portfolios(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == user_id)
    )
    portfolios = result.scalars().all()
    return portfolios


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    new_portfolio = Portfolio(
        user_id=user_id,
        name=portfolio_data.name,
        stock_ids=portfolio_data.stock_ids
    )
    
    db.add(new_portfolio)
    await db.commit()
    await db.refresh(new_portfolio)
    
    # Create initial snapshot
    await portfolio_service.create_snapshot(db, new_portfolio.id)
    
    # Log creation
    await portfolio_service.log_modification(
        db,
        new_portfolio.id,
        action="created",
        description=f"Portfolio '{new_portfolio.name}' created with {len(portfolio_data.stock_ids)} stocks",
        changes={
            "added": portfolio_data.stock_ids,
            "stock_count": len(portfolio_data.stock_ids)
        }
    )
    
    return new_portfolio


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    return portfolio


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: int,
    portfolio_data: PortfolioUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Store old values to detect changes
    old_stock_ids = set(portfolio.stock_ids)
    new_stock_ids = set(portfolio_data.stock_ids)
    old_name = portfolio.name
    
    # Update portfolio
    portfolio.name = portfolio_data.name
    portfolio.stock_ids = portfolio_data.stock_ids
    
    await db.commit()
    await db.refresh(portfolio)
    
    # Create snapshot if stocks changed
    if old_stock_ids != new_stock_ids:
        await portfolio_service.create_snapshot(db, portfolio_id)
        
        # Log stock changes
        added = list(new_stock_ids - old_stock_ids)
        removed = list(old_stock_ids - new_stock_ids)
        
        if added:
            await portfolio_service.log_modification(
                db,
                portfolio_id,
                action="added_stocks",
                description=f"Added {len(added)} stock(s) to portfolio",
                changes={"added": added}
            )
        
        if removed:
            await portfolio_service.log_modification(
                db,
                portfolio_id,
                action="removed_stocks",
                description=f"Removed {len(removed)} stock(s) from portfolio",
                changes={"removed": removed}
            )
        
        # Trigger rebalancing check
        await rebalancing_service.handle_portfolio_change(
            db, portfolio_id, user_id, old_stock_ids, new_stock_ids
        )
    
    # Log name change
    if old_name != portfolio_data.name:
        await portfolio_service.log_modification(
            db,
            portfolio_id,
            action="renamed",
            description=f"Portfolio renamed from '{old_name}' to '{portfolio_data.name}'",
            changes={"old_name": old_name, "new_name": portfolio_data.name}
        )
    
    return portfolio


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    await db.delete(portfolio)
    await db.commit()
    
    return None


@router.get("/{portfolio_id}/performance", response_model=PortfolioPerformanceResponse)
async def get_portfolio_performance(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get portfolio performance metrics including time series data."""
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    try:
        performance = await portfolio_service.calculate_performance(db, portfolio_id)
        return performance
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate performance: {str(e)}"
        )


@router.get("/{portfolio_id}/sector-allocation", response_model=List[SectorAllocationResponse])
async def get_portfolio_sector_allocation(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get portfolio sector allocation with equal weight per stock."""
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    try:
        allocation = await portfolio_service.calculate_sector_allocation(db, portfolio_id)
        return allocation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate sector allocation: {str(e)}"
        )


@router.get("/{portfolio_id}/snapshots", response_model=List[PortfolioSnapshotResponse])
async def get_portfolio_snapshots(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get portfolio value snapshots over time."""
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    snapshots = await portfolio_service.get_snapshots(db, portfolio_id)
    return snapshots


@router.get("/{portfolio_id}/history", response_model=List[PortfolioHistoryResponse])
async def get_portfolio_history(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get portfolio modification history."""
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    history = await portfolio_service.get_history(db, portfolio_id)
    return history

