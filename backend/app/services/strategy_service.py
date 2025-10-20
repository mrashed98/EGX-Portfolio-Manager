from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from math import floor

from app.models.strategy import Strategy
from app.models.holding import Holding
from app.models.stock import Stock
from app.models.portfolio import Portfolio
from app.models.strategy_snapshot import StrategySnapshot


class StrategyService:
    async def calculate_initial_holdings(self, db: AsyncSession, strategy: Strategy):
        """Calculate and create initial holdings based on strategy allocations"""
        
        total_invested = 0.0
        
        # Get all portfolios in the strategy
        portfolio_ids = [alloc["portfolio_id"] for alloc in strategy.portfolio_allocations]
        result = await db.execute(
            select(Portfolio).where(Portfolio.id.in_(portfolio_ids))
        )
        portfolios = {p.id: p for p in result.scalars().all()}
        
        # Calculate holdings for each portfolio
        for alloc in strategy.portfolio_allocations:
            portfolio_id = alloc["portfolio_id"]
            portfolio_percentage = alloc["percentage"]
            stock_allocations = alloc["stock_allocations"]
            
            portfolio = portfolios.get(portfolio_id)
            if not portfolio:
                continue
            
            # Calculate funds for this portfolio
            portfolio_funds = strategy.total_funds * (portfolio_percentage / 100.0)
            
            # Get stock prices
            stock_ids = [int(sid) for sid in stock_allocations.keys()]
            stock_result = await db.execute(
                select(Stock).where(Stock.id.in_(stock_ids))
            )
            stocks = {s.id: s for s in stock_result.scalars().all()}
            
            # Calculate holdings for each stock in the portfolio
            for stock_id_str, stock_percentage in stock_allocations.items():
                stock_id = int(stock_id_str)
                stock = stocks.get(stock_id)
                
                if not stock:
                    continue
                
                # Calculate funds for this stock
                stock_funds = portfolio_funds * (stock_percentage / 100.0)
                
                # Calculate quantity (use floor method)
                quantity = floor(stock_funds / stock.current_price)
                
                if quantity > 0:
                    actual_cost = quantity * stock.current_price
                    total_invested += actual_cost
                    
                    # Create holding
                    holding = Holding(
                        user_id=strategy.user_id,
                        strategy_id=strategy.id,
                        portfolio_id=portfolio_id,
                        stock_id=stock_id,
                        quantity=quantity,
                        average_price=stock.current_price,
                        current_value=actual_cost,
                        purchase_date=datetime.utcnow()
                    )
                    db.add(holding)
        
        # Calculate remaining cash
        strategy.remaining_cash = strategy.total_funds - total_invested
        
        await db.commit()
        
        # Create initial snapshot
        await self.create_snapshot(db, strategy.id)
    
    async def create_snapshot(self, db: AsyncSession, strategy_id: int):
        """Create a snapshot of strategy performance"""
        
        # Get strategy
        result = await db.execute(
            select(Strategy).where(Strategy.id == strategy_id)
        )
        strategy = result.scalar_one_or_none()
        
        if not strategy:
            return
        
        # Get all holdings for this strategy
        holdings_result = await db.execute(
            select(Holding).where(Holding.strategy_id == strategy_id)
        )
        holdings = holdings_result.scalars().all()
        
        # Calculate total value (holdings + remaining cash)
        holdings_value = sum(h.current_value for h in holdings)
        total_value = holdings_value + strategy.remaining_cash
        
        # Calculate performance percentage (comparing total portfolio value vs initial funds)
        performance_percentage = ((total_value - strategy.total_funds) / strategy.total_funds) * 100 if strategy.total_funds > 0 else 0.0
        
        # Create snapshot
        snapshot = StrategySnapshot(
            strategy_id=strategy_id,
            total_value=total_value,
            performance_percentage=performance_percentage
        )
        db.add(snapshot)
        await db.commit()
    
    async def update_holdings_current_value(self, db: AsyncSession, strategy_id: int):
        """Update current value of all holdings based on latest stock prices"""
        
        holdings_result = await db.execute(
            select(Holding, Stock)
            .join(Stock, Holding.stock_id == Stock.id)
            .where(Holding.strategy_id == strategy_id)
        )
        holdings_with_stocks = holdings_result.all()
        
        for holding, stock in holdings_with_stocks:
            holding.current_value = holding.quantity * stock.current_price
        
        await db.commit()


strategy_service = StrategyService()

