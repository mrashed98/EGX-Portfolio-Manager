from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.portfolio import Portfolio
from app.models.stock import Stock
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
from app.services.import_export_service import import_export_service

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


# ===== IMPORT/EXPORT ENDPOINTS =====

@router.get("/import-template")
async def download_portfolio_template():
    """Download CSV template for portfolio import"""
    template = import_export_service.generate_portfolio_template()
    
    return StreamingResponse(
        template,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=portfolio_import_template.csv"}
    )


@router.post("/import")
async def import_portfolios(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Import portfolios from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )
    
    try:
        content = await file.read()
        portfolios_data = await import_export_service.parse_portfolio_csv(content)
        
        created_portfolios = []
        errors = []
        
        for portfolio_data in portfolios_data:
            try:
                # Look up stocks by symbol
                stock_symbols = portfolio_data['symbols']
                result = await db.execute(
                    select(Stock).where(Stock.symbol.in_(stock_symbols))
                )
                stocks = result.scalars().all()
                stock_ids = [stock.id for stock in stocks]
                
                # Check for missing symbols
                found_symbols = {stock.symbol for stock in stocks}
                missing_symbols = set(stock_symbols) - found_symbols
                if missing_symbols:
                    errors.append({
                        'portfolio': portfolio_data['name'],
                        'error': f"Stocks not found: {', '.join(missing_symbols)}"
                    })
                    continue
                
                # Create portfolio
                new_portfolio = Portfolio(
                    user_id=user_id,
                    name=portfolio_data['name'],
                    stock_ids=stock_ids
                )
                db.add(new_portfolio)
                await db.commit()
                await db.refresh(new_portfolio)
                
                # Create snapshot and log
                await portfolio_service.create_snapshot(db, new_portfolio.id)
                await portfolio_service.log_modification(
                    db,
                    new_portfolio.id,
                    action="created",
                    description=f"Portfolio '{new_portfolio.name}' imported with {len(stock_ids)} stocks",
                    changes={"added": stock_ids, "stock_count": len(stock_ids)}
                )
                
                created_portfolios.append(new_portfolio)
                
            except Exception as e:
                errors.append({
                    'portfolio': portfolio_data['name'],
                    'error': str(e)
                })
        
        return {
            "message": f"Imported {len(created_portfolios)} portfolios",
            "created": len(created_portfolios),
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV file: {str(e)}"
        )


@router.get("/{portfolio_id}/export")
async def export_portfolio(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Export single portfolio to Excel"""
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
    
    # Get stocks
    stocks = []
    if portfolio.stock_ids:
        stocks_result = await db.execute(
            select(Stock).where(Stock.id.in_(portfolio.stock_ids))
        )
        stocks = stocks_result.scalars().all()
    
    # Generate Excel
    excel_file = await import_export_service.create_portfolio_excel(db, portfolio, stocks)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=portfolio_{portfolio.name.replace(' ', '_')}.xlsx"}
    )


@router.get("/export-all")
async def export_all_portfolios(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Export all user portfolios to Excel"""
    # Get all portfolios
    result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == user_id)
    )
    portfolios = result.scalars().all()
    
    if not portfolios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No portfolios found"
        )
    
    # Get all stocks
    all_stock_ids = []
    for portfolio in portfolios:
        all_stock_ids.extend(portfolio.stock_ids)
    
    # Only query stocks if there are any stock IDs
    stocks = {}
    if all_stock_ids:
        stocks_result = await db.execute(
            select(Stock).where(Stock.id.in_(all_stock_ids))
        )
        stocks = {stock.id: stock for stock in stocks_result.scalars().all()}
    
    # Generate Excel
    excel_file = await import_export_service.create_all_portfolios_excel(db, portfolios, stocks)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=all_portfolios.xlsx"}
    )


@router.get("/{portfolio_id}/history/export")
async def export_portfolio_history(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Export portfolio history to Excel"""
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
    
    # Get history
    history = await portfolio_service.get_history(db, portfolio_id)
    
    # Generate Excel
    excel_file = await import_export_service.create_portfolio_history_excel(db, portfolio, history)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=portfolio_{portfolio.name.replace(' ', '_')}_history.xlsx"}
    )


@router.get("/comparison/export")
async def export_portfolio_comparison(
    portfolio_ids: str,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Export portfolio comparison to Excel"""
    try:
        ids = [int(id_str) for id_str in portfolio_ids.split(',')]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio IDs format"
        )
    
    # Get portfolios and their performance
    comparison_data = []
    for portfolio_id in ids:
        result = await db.execute(
            select(Portfolio).where(
                Portfolio.id == portfolio_id,
                Portfolio.user_id == user_id
            )
        )
        portfolio = result.scalar_one_or_none()
        
        if portfolio:
            try:
                performance = await portfolio_service.calculate_performance(db, portfolio_id)
                comparison_data.append({
                    'portfolio_id': portfolio_id,
                    'portfolio_name': portfolio.name,
                    'current_value': performance.current_value,
                    'initial_value': performance.initial_value,
                    'change': performance.change,
                    'change_percent': performance.change_percent,
                    'stock_count': performance.stock_count,
                    'time_series': performance.time_series
                })
            except Exception:
                # If performance calculation fails, add basic info
                comparison_data.append({
                    'portfolio_id': portfolio_id,
                    'portfolio_name': portfolio.name,
                    'current_value': 0,
                    'initial_value': 0,
                    'change': 0,
                    'change_percent': 0,
                    'stock_count': len(portfolio.stock_ids),
                    'time_series': []
                })
    
    if not comparison_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid portfolios found"
        )
    
    # Generate Excel
    excel_file = await import_export_service.create_comparison_excel(db, comparison_data)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=portfolio_comparison.xlsx"}
    )

