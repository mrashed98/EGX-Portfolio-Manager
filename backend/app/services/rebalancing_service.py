from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from math import floor
from typing import Set

from app.models.strategy import Strategy
from app.models.holding import Holding
from app.models.stock import Stock
from app.models.portfolio import Portfolio
from app.models.rebalancing_history import RebalancingHistory
from app.schemas.rebalancing import RebalancingCalculation, RebalancingAction


class RebalancingService:
    # Threshold percentage - don't rebalance if difference is less than this
    REBALANCING_THRESHOLD_PERCENT = 1.0
    
    # Minimum thresholds for individual actions
    MIN_ACTION_QUANTITY = 5  # Don't create actions for less than 5 shares
    MIN_ACTION_VALUE = 500.0  # Don't create actions for less than 500 EGP
    
    async def calculate_rebalancing(
        self, 
        db: AsyncSession, 
        strategy_id: int
    ) -> RebalancingCalculation:
        """Calculate rebalancing actions needed for a strategy"""
        
        # Get strategy
        result = await db.execute(
            select(Strategy).where(Strategy.id == strategy_id)
        )
        strategy = result.scalar_one_or_none()
        
        if not strategy:
            raise ValueError("Strategy not found")
        
        # Get current holdings
        holdings_result = await db.execute(
            select(Holding, Stock)
            .join(Stock, Holding.stock_id == Stock.id)
            .where(Holding.strategy_id == strategy_id)
        )
        holdings_with_stocks = holdings_result.all()
        
        # Calculate current strategy value
        current_value = sum(h.quantity * s.current_price for h, s in holdings_with_stocks)
        
        # Build current holdings map - AGGREGATE quantities for same stock
        current_holdings = {}
        for holding, stock in holdings_with_stocks:
            if holding.stock_id in current_holdings:
                # Stock already exists, add to quantity
                current_holdings[holding.stock_id]["quantity"] += holding.quantity
            else:
                # First occurrence of this stock
                current_holdings[holding.stock_id] = {
                    "quantity": holding.quantity,
                    "stock": stock
                }
        
        # Calculate target allocations based on TOTAL available funds (holdings + cash)
        total_available_funds = current_value + strategy.remaining_cash
        target_allocations = await self._calculate_target_allocations(db, strategy, total_available_funds)
        
        # Check if this is primarily a "cash utilization" rebalancing
        # (when we're just using remaining cash to buy more stocks, not restructuring)
        is_cash_utilization = strategy.remaining_cash > (current_value * 0.001)  # > 0.1% of portfolio
        
        # Generate rebalancing actions
        actions = []
        
        # Process each target allocation
        for stock_id, target_data in target_allocations.items():
            target_quantity = target_data["quantity"]
            stock = target_data["stock"]
            
            current_quantity = 0
            if stock_id in current_holdings:
                current_quantity = current_holdings[stock_id]["quantity"]
            
            quantity_diff = target_quantity - current_quantity
            
            if quantity_diff > 0:
                # Need to buy
                action_quantity = quantity_diff
                action_value = action_quantity * stock.current_price
                
                # For cash utilization, allow any buy action (no minimum)
                # Otherwise, enforce minimum thresholds
                should_include = (
                    is_cash_utilization or 
                    (action_quantity >= self.MIN_ACTION_QUANTITY and action_value >= self.MIN_ACTION_VALUE)
                )
                
                if should_include:
                    actions.append(RebalancingAction(
                        action="buy",
                        stock_id=stock_id,
                        stock_symbol=stock.symbol,
                        quantity=action_quantity,
                        price=stock.current_price,
                        total_amount=action_value
                    ))
            elif quantity_diff < 0:
                # Need to sell - always check minimum thresholds for sells
                action_quantity = abs(quantity_diff)
                action_value = action_quantity * stock.current_price
                
                if action_quantity >= self.MIN_ACTION_QUANTITY and action_value >= self.MIN_ACTION_VALUE:
                    actions.append(RebalancingAction(
                        action="sell",
                        stock_id=stock_id,
                        stock_symbol=stock.symbol,
                        quantity=action_quantity,
                        price=stock.current_price,
                        total_amount=action_value
                    ))
        
        # Check for stocks to remove (in current holdings but not in target)
        # These should be sold completely regardless of thresholds
        for stock_id, holding_data in current_holdings.items():
            if stock_id not in target_allocations:
                stock = holding_data["stock"]
                quantity = holding_data["quantity"]
                # Always sell stocks that are being removed from the portfolio
                actions.append(RebalancingAction(
                    action="sell",
                    stock_id=stock_id,
                    stock_symbol=stock.symbol,
                    quantity=quantity,
                    price=stock.current_price,
                    total_amount=quantity * stock.current_price
                ))
        
        # Calculate total rebalancing amount and check threshold
        total_rebalancing_amount = sum(action.total_amount for action in actions)
        total_portfolio_value = current_value + strategy.remaining_cash
        
        # Check if there's significant unused cash that could buy stocks
        # Find the cheapest stock price
        cheapest_stock_price = min(
            (ta["stock"].current_price for ta in target_allocations.values()),
            default=float('inf')
        )
        
        # Can we buy at least 5 shares of the cheapest stock with remaining cash?
        can_utilize_cash = (
            cheapest_stock_price != float('inf') and 
            strategy.remaining_cash >= (cheapest_stock_price * self.MIN_ACTION_QUANTITY)
        )
        
        # If rebalancing amount is less than threshold percentage AND we can't utilize cash, skip it
        if total_portfolio_value > 0 and not can_utilize_cash:
            rebalancing_percentage = (total_rebalancing_amount / total_portfolio_value) * 100
            
            if rebalancing_percentage < self.REBALANCING_THRESHOLD_PERCENT:
                # Portfolio is already balanced, no actions needed
                return RebalancingCalculation(
                    strategy_id=strategy_id,
                    current_value=current_value,
                    target_value=sum(ta["quantity"] * ta["stock"].current_price for ta in target_allocations.values()),
                    actions=[]
                )
        
        # Save rebalancing history only if there are significant actions
        if actions:
            actions_dict = [
                {
                    "action": action.action,
                    "stock_id": action.stock_id,
                    "quantity": action.quantity,
                    "price": action.price
                }
                for action in actions
            ]
            
            rebalancing_history = RebalancingHistory(
                strategy_id=strategy_id,
                actions=actions_dict,
                executed=False
            )
            db.add(rebalancing_history)
            await db.commit()
        
        return RebalancingCalculation(
            strategy_id=strategy_id,
            current_value=current_value,
            target_value=sum(ta["quantity"] * ta["stock"].current_price for ta in target_allocations.values()),
            actions=actions
        )
    
    async def _calculate_target_allocations(
        self, 
        db: AsyncSession, 
        strategy: Strategy, 
        total_value: float
    ) -> dict:
        """Calculate target stock quantities based on strategy allocations"""
        
        target_allocations = {}
        
        # Get all portfolios
        portfolio_ids = [alloc["portfolio_id"] for alloc in strategy.portfolio_allocations]
        result = await db.execute(
            select(Portfolio).where(Portfolio.id.in_(portfolio_ids))
        )
        portfolios = {p.id: p for p in result.scalars().all()}
        
        # Process each portfolio allocation
        for alloc in strategy.portfolio_allocations:
            portfolio_id = alloc["portfolio_id"]
            portfolio_percentage = alloc["percentage"]
            stock_allocations = alloc["stock_allocations"]
            
            portfolio = portfolios.get(portfolio_id)
            if not portfolio:
                continue
            
            # Calculate funds for this portfolio
            portfolio_funds = total_value * (portfolio_percentage / 100.0)
            
            # Get stock prices
            stock_ids = [int(sid) for sid in stock_allocations.keys()]
            stock_result = await db.execute(
                select(Stock).where(Stock.id.in_(stock_ids))
            )
            stocks = {s.id: s for s in stock_result.scalars().all()}
            
            # Calculate target quantity for each stock
            for stock_id_str, stock_percentage in stock_allocations.items():
                stock_id = int(stock_id_str)
                stock = stocks.get(stock_id)
                
                if not stock:
                    continue
                
                # Calculate funds for this stock
                stock_funds = portfolio_funds * (stock_percentage / 100.0)
                
                # Calculate quantity (use floor method)
                quantity = floor(stock_funds / stock.current_price)
                
                # AGGREGATE if stock already exists in target (from another portfolio)
                if stock_id in target_allocations:
                    target_allocations[stock_id]["quantity"] += quantity
                    target_allocations[stock_id]["target_value"] += stock_funds
                else:
                    target_allocations[stock_id] = {
                        "quantity": quantity,
                        "stock": stock,
                        "target_value": stock_funds
                    }
        
        # GREEDY LEFTOVER REDISTRIBUTION
        # Calculate how much cash is left after floor allocations
        spent = sum(
            alloc["quantity"] * alloc["stock"].current_price
            for alloc in target_allocations.values()
        )
        remaining_cash = total_value - spent
        
        # Sort stocks by price (cheapest first) to maximize usage
        sorted_stocks = sorted(
            target_allocations.items(),
            key=lambda x: x[1]["stock"].current_price
        )
        
        # Try to buy additional shares with remaining cash
        while remaining_cash > 0:
            allocated_any = False
            
            for stock_id, alloc in sorted_stocks:
                stock_price = alloc["stock"].current_price
                
                # Can we afford one more share?
                if remaining_cash >= stock_price:
                    alloc["quantity"] += 1
                    remaining_cash -= stock_price
                    allocated_any = True
            
            # If we couldn't allocate anything in this round, stop
            if not allocated_any:
                break
        
        return target_allocations
    
    async def execute_rebalancing(self, db: AsyncSession, strategy_id: int):
        """Mark the latest rebalancing as executed and update holdings"""
        
        # Get the latest unexecuted rebalancing
        result = await db.execute(
            select(RebalancingHistory)
            .where(
                RebalancingHistory.strategy_id == strategy_id,
                RebalancingHistory.executed == False
            )
            .order_by(RebalancingHistory.created_at.desc())
            .limit(1)
        )
        rebalancing = result.scalar_one_or_none()
        
        if not rebalancing:
            return
        
        # Get strategy
        strategy_result = await db.execute(
            select(Strategy).where(Strategy.id == strategy_id)
        )
        strategy = strategy_result.scalar_one_or_none()
        
        if not strategy:
            return
        
        # Track cash flow from rebalancing
        cash_from_sales = 0.0
        cash_for_purchases = 0.0
        
        # Update holdings based on actions
        for action in rebalancing.actions:
            stock_id = action["stock_id"]
            quantity = action["quantity"]
            price = action["price"]
            action_type = action["action"]
            action_total = quantity * price
            
            # Get ALL existing holdings for this stock (may be multiple if in multiple portfolios)
            holding_result = await db.execute(
                select(Holding).where(
                    Holding.strategy_id == strategy_id,
                    Holding.stock_id == stock_id
                )
            )
            holdings = holding_result.scalars().all()
            
            # NOTE: If multiple holdings exist for the same stock (in different portfolios),
            # we apply the action to the first one. This is a simplification.
            # TODO: In future, consider distributing actions proportionally across all holdings
            holding = holdings[0] if holdings else None
            
            if action_type == "buy":
                # Spending cash to buy stocks
                cash_for_purchases += action_total
                
                if holding:
                    # Update existing holding
                    total_cost = (holding.quantity * holding.average_price) + (quantity * price)
                    holding.quantity += quantity
                    holding.average_price = total_cost / holding.quantity
                    holding.current_value = holding.quantity * price
                else:
                    # Create new holding
                    holding = Holding(
                        user_id=strategy.user_id,
                        strategy_id=strategy_id,
                        stock_id=stock_id,
                        quantity=quantity,
                        average_price=price,
                        current_value=quantity * price,
                        purchase_date=datetime.utcnow()
                    )
                    db.add(holding)
            
            elif action_type == "sell" and holding:
                # Receiving cash from selling stocks
                cash_from_sales += action_total
                
                # Reduce or remove holding
                holding.quantity -= quantity
                if holding.quantity <= 0:
                    await db.delete(holding)
                else:
                    holding.current_value = holding.quantity * price
        
        # Update strategy remaining cash
        # Cash IN from sales - Cash OUT for purchases
        net_cash_change = cash_from_sales - cash_for_purchases
        strategy.remaining_cash += net_cash_change
        
        # Mark rebalancing as executed
        rebalancing.executed = True
        
        await db.commit()
    
    async def undo_rebalancing(self, db: AsyncSession, rebalancing_id: int):
        """Undo an executed rebalancing by reversing all actions"""
        
        # Get the rebalancing record
        result = await db.execute(
            select(RebalancingHistory).where(RebalancingHistory.id == rebalancing_id)
        )
        rebalancing = result.scalar_one_or_none()
        
        if not rebalancing:
            raise ValueError("Rebalancing record not found")
        
        if not rebalancing.executed:
            raise ValueError("Cannot undo a rebalancing that hasn't been executed")
        
        if rebalancing.undone:
            raise ValueError("This rebalancing has already been undone")
        
        # Get strategy
        strategy_result = await db.execute(
            select(Strategy).where(Strategy.id == rebalancing.strategy_id)
        )
        strategy = strategy_result.scalar_one_or_none()
        
        if not strategy:
            raise ValueError("Strategy not found")
        
        # Track cash flow (reverse of execution)
        cash_from_sales = 0.0
        cash_for_purchases = 0.0
        
        # Reverse each action (BUY becomes SELL, SELL becomes BUY)
        for action in rebalancing.actions:
            stock_id = action["stock_id"]
            quantity = action["quantity"]
            price = action["price"]
            action_type = action["action"]
            action_total = quantity * price
            
            # Get ALL existing holdings for this stock
            holding_result = await db.execute(
                select(Holding).where(
                    Holding.strategy_id == rebalancing.strategy_id,
                    Holding.stock_id == stock_id
                )
            )
            holdings = holding_result.scalars().all()
            holding = holdings[0] if holdings else None
            
            if action_type == "buy":
                # Original was BUY, so we need to SELL to undo
                # Return cash by selling
                cash_from_sales += action_total
                
                if holding:
                    holding.quantity -= quantity
                    if holding.quantity <= 0:
                        await db.delete(holding)
                    else:
                        # Recalculate average price if needed
                        holding.current_value = holding.quantity * price
            
            elif action_type == "sell":
                # Original was SELL, so we need to BUY to undo
                # Spend cash to buy back
                cash_for_purchases += action_total
                
                if holding:
                    # Update existing holding
                    total_cost = (holding.quantity * holding.average_price) + (quantity * price)
                    holding.quantity += quantity
                    holding.average_price = total_cost / holding.quantity
                    holding.current_value = holding.quantity * price
                else:
                    # Create new holding (if it was completely sold)
                    holding = Holding(
                        user_id=strategy.user_id,
                        strategy_id=rebalancing.strategy_id,
                        stock_id=stock_id,
                        quantity=quantity,
                        average_price=price,
                        current_value=quantity * price,
                        purchase_date=datetime.utcnow()
                    )
                    db.add(holding)
        
        # Update strategy remaining cash (reverse of execution)
        # Cash IN from undoing buys - Cash OUT for undoing sells
        net_cash_change = cash_from_sales - cash_for_purchases
        strategy.remaining_cash += net_cash_change
        
        # Mark rebalancing as undone
        rebalancing.undone = True
        from datetime import datetime
        rebalancing.undone_at = datetime.utcnow()
        
        await db.commit()
    
    async def handle_portfolio_change(
        self,
        db: AsyncSession,
        portfolio_id: int,
        user_id: int,
        old_stock_ids: Set[int],
        new_stock_ids: Set[int]
    ):
        """Handle portfolio changes and trigger rebalancing for affected strategies"""
        
        # Find all strategies using this portfolio
        result = await db.execute(
            select(Strategy).where(Strategy.user_id == user_id)
        )
        strategies = result.scalars().all()
        
        affected_strategies = []
        for strategy in strategies:
            for alloc in strategy.portfolio_allocations:
                if alloc["portfolio_id"] == portfolio_id:
                    affected_strategies.append(strategy)
                    break
        
        # Calculate rebalancing for each affected strategy
        for strategy in affected_strategies:
            removed_stocks = old_stock_ids - new_stock_ids
            added_stocks = new_stock_ids - old_stock_ids
            
            if removed_stocks or added_stocks:
                # Update portfolio allocations in strategy
                await self._update_strategy_allocations_after_portfolio_change(
                    db, strategy, portfolio_id, removed_stocks, added_stocks
                )
                
                # Refresh strategy to get updated allocations
                await db.refresh(strategy)
                
                # Calculate rebalancing
                await self.calculate_rebalancing(db, strategy.id)
    
    async def _update_strategy_allocations_after_portfolio_change(
        self,
        db: AsyncSession,
        strategy: Strategy,
        portfolio_id: int,
        removed_stocks: Set[int],
        added_stocks: Set[int]
    ):
        """Update strategy allocations when portfolio stocks change"""
        
        # Find the portfolio allocation
        for alloc in strategy.portfolio_allocations:
            if alloc["portfolio_id"] == portfolio_id:
                stock_allocations = alloc["stock_allocations"]
                
                # Remove stocks that were removed from portfolio
                for stock_id in removed_stocks:
                    stock_allocations.pop(str(stock_id), None)
                
                # Handle added stocks
                if added_stocks:
                    # Count remaining stocks after removals
                    remaining_stocks = list(stock_allocations.keys())
                    total_stocks = len(remaining_stocks) + len(added_stocks)
                    
                    if remaining_stocks:
                        # Have existing stocks - redistribute proportionally
                        # Scale down existing allocations to make room for new stocks
                        scale_factor = len(remaining_stocks) / total_stocks
                        for stock_id in remaining_stocks:
                            stock_allocations[stock_id] *= scale_factor
                        
                        # Add new stocks with equal allocation
                        new_allocation_per_stock = 100.0 / total_stocks
                        for stock_id in added_stocks:
                            stock_allocations[str(stock_id)] = new_allocation_per_stock
                    else:
                        # No existing stocks - distribute equally among new stocks
                        allocation_per_stock = 100.0 / len(added_stocks)
                        for stock_id in added_stocks:
                            stock_allocations[str(stock_id)] = allocation_per_stock
                
                # Mark strategy as modified
                from sqlalchemy.orm import attributes
                attributes.flag_modified(strategy, "portfolio_allocations")
                
                break
        
        await db.commit()


rebalancing_service = RebalancingService()

