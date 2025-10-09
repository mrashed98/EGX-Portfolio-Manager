from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.portfolio import Portfolio
from app.models.portfolio_snapshot import PortfolioSnapshot
from app.models.portfolio_history import PortfolioHistory
from app.models.stock import Stock


class PortfolioService:
    """Service for portfolio operations including snapshots, performance tracking, and analytics."""

    async def create_snapshot(
        self,
        db: AsyncSession,
        portfolio_id: int,
        snapshot_date: Optional[datetime] = None
    ) -> PortfolioSnapshot:
        """
        Create a snapshot of the portfolio's current value.
        
        Args:
            db: Database session
            portfolio_id: ID of the portfolio
            snapshot_date: Date for the snapshot (defaults to now)
            
        Returns:
            Created PortfolioSnapshot instance
        """
        if snapshot_date is None:
            snapshot_date = datetime.utcnow()

        # Get portfolio
        result = await db.execute(
            select(Portfolio).where(Portfolio.id == portfolio_id)
        )
        portfolio = result.scalar_one_or_none()
        
        if not portfolio:
            raise ValueError(f"Portfolio {portfolio_id} not found")

        # Get stocks in portfolio
        stock_result = await db.execute(
            select(Stock).where(Stock.id.in_(portfolio.stock_ids))
        )
        stocks = stock_result.scalars().all()

        # Build stock prices map and calculate total value
        stock_prices = {}
        total_value = 0.0
        
        for stock in stocks:
            stock_prices[str(stock.id)] = stock.current_price
            total_value += stock.current_price

        # Create snapshot
        snapshot = PortfolioSnapshot(
            portfolio_id=portfolio_id,
            snapshot_date=snapshot_date,
            total_value=total_value,
            stock_count=len(portfolio.stock_ids),
            stock_prices=stock_prices
        )

        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)

        return snapshot

    async def calculate_performance(
        self,
        db: AsyncSession,
        portfolio_id: int
    ) -> Dict[str, Any]:
        """
        Calculate portfolio performance metrics.
        
        Args:
            db: Database session
            portfolio_id: ID of the portfolio
            
        Returns:
            Dictionary with performance metrics
        """
        # Get portfolio
        result = await db.execute(
            select(Portfolio).where(Portfolio.id == portfolio_id)
        )
        portfolio = result.scalar_one_or_none()
        
        if not portfolio:
            raise ValueError(f"Portfolio {portfolio_id} not found")

        # Get all snapshots ordered by date
        snapshots_result = await db.execute(
            select(PortfolioSnapshot)
            .where(PortfolioSnapshot.portfolio_id == portfolio_id)
            .order_by(PortfolioSnapshot.snapshot_date.asc())
        )
        snapshots = snapshots_result.scalars().all()

        # Calculate current value
        stock_result = await db.execute(
            select(Stock).where(Stock.id.in_(portfolio.stock_ids))
        )
        stocks = stock_result.scalars().all()
        current_value = sum(stock.current_price for stock in stocks)

        # Get initial value (first snapshot or current if no snapshots)
        if snapshots:
            initial_value = snapshots[0].total_value
            initial_date = snapshots[0].snapshot_date
        else:
            initial_value = current_value
            initial_date = portfolio.created_at

        # Calculate performance
        change = current_value - initial_value
        change_percent = (change / initial_value * 100) if initial_value > 0 else 0.0

        # Build time series data
        time_series = []
        for snapshot in snapshots:
            time_series.append({
                "date": snapshot.snapshot_date.isoformat(),
                "value": snapshot.total_value
            })

        # Add current value as latest point if not already captured today
        if not snapshots or (datetime.utcnow() - snapshots[-1].snapshot_date).days > 0:
            time_series.append({
                "date": datetime.utcnow().isoformat(),
                "value": current_value
            })

        return {
            "current_value": current_value,
            "initial_value": initial_value,
            "change": change,
            "change_percent": change_percent,
            "initial_date": initial_date.isoformat(),
            "time_series": time_series,
            "stock_count": len(portfolio.stock_ids)
        }

    async def calculate_sector_allocation(
        self,
        db: AsyncSession,
        portfolio_id: int
    ) -> List[Dict[str, Any]]:
        """
        Calculate sector allocation with equal weight per stock.
        
        Args:
            db: Database session
            portfolio_id: ID of the portfolio
            
        Returns:
            List of sector allocations with performance data
        """
        # Get portfolio
        result = await db.execute(
            select(Portfolio).where(Portfolio.id == portfolio_id)
        )
        portfolio = result.scalar_one_or_none()
        
        if not portfolio:
            raise ValueError(f"Portfolio {portfolio_id} not found")

        # Get stocks in portfolio
        stock_result = await db.execute(
            select(Stock).where(Stock.id.in_(portfolio.stock_ids))
        )
        stocks = stock_result.scalars().all()

        if not stocks:
            return []

        # Group stocks by sector
        sector_map = {}
        total_stocks = len(stocks)
        
        for stock in stocks:
            sector = stock.sector or "Unknown"
            
            if sector not in sector_map:
                sector_map[sector] = {
                    "sector": sector,
                    "stock_count": 0,
                    "stocks": [],
                    "total_change_percent": 0.0
                }
            
            sector_map[sector]["stock_count"] += 1
            sector_map[sector]["stocks"].append({
                "id": stock.id,
                "symbol": stock.symbol,
                "name": stock.name,
                "current_price": stock.current_price,
                "change_percent": stock.change_percent or 0.0
            })
            sector_map[sector]["total_change_percent"] += (stock.change_percent or 0.0)

        # Calculate allocation percentages and average performance
        allocations = []
        for sector_data in sector_map.values():
            stock_count = sector_data["stock_count"]
            allocation_percent = (stock_count / total_stocks) * 100
            avg_change_percent = sector_data["total_change_percent"] / stock_count if stock_count > 0 else 0.0
            
            allocations.append({
                "sector": sector_data["sector"],
                "allocation_percent": allocation_percent,
                "stock_count": stock_count,
                "avg_change_percent": avg_change_percent,
                "stocks": sector_data["stocks"]
            })

        # Sort by allocation percentage descending
        allocations.sort(key=lambda x: x["allocation_percent"], reverse=True)

        return allocations

    async def log_modification(
        self,
        db: AsyncSession,
        portfolio_id: int,
        action: str,
        description: str,
        changes: Dict[str, Any]
    ) -> PortfolioHistory:
        """
        Log a portfolio modification.
        
        Args:
            db: Database session
            portfolio_id: ID of the portfolio
            action: Action type (created, added_stocks, removed_stocks, renamed)
            description: Human-readable description
            changes: Dictionary of changes
            
        Returns:
            Created PortfolioHistory instance
        """
        history_entry = PortfolioHistory(
            portfolio_id=portfolio_id,
            action=action,
            description=description,
            changes=changes
        )

        db.add(history_entry)
        await db.commit()
        await db.refresh(history_entry)

        return history_entry

    async def get_history(
        self,
        db: AsyncSession,
        portfolio_id: int,
        limit: Optional[int] = None
    ) -> List[PortfolioHistory]:
        """
        Get portfolio modification history.
        
        Args:
            db: Database session
            portfolio_id: ID of the portfolio
            limit: Maximum number of entries to return
            
        Returns:
            List of PortfolioHistory entries
        """
        query = select(PortfolioHistory).where(
            PortfolioHistory.portfolio_id == portfolio_id
        ).order_by(PortfolioHistory.created_at.desc())

        if limit:
            query = query.limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    async def get_snapshots(
        self,
        db: AsyncSession,
        portfolio_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[PortfolioSnapshot]:
        """
        Get portfolio snapshots within a date range.
        
        Args:
            db: Database session
            portfolio_id: ID of the portfolio
            start_date: Start date filter
            end_date: End date filter
            
        Returns:
            List of PortfolioSnapshot entries
        """
        query = select(PortfolioSnapshot).where(
            PortfolioSnapshot.portfolio_id == portfolio_id
        )

        if start_date:
            query = query.where(PortfolioSnapshot.snapshot_date >= start_date)
        if end_date:
            query = query.where(PortfolioSnapshot.snapshot_date <= end_date)

        query = query.order_by(PortfolioSnapshot.snapshot_date.asc())

        result = await db.execute(query)
        return result.scalars().all()


# Create singleton instance
portfolio_service = PortfolioService()

