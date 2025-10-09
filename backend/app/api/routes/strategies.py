from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.strategy import Strategy
from app.models.strategy_snapshot import StrategySnapshot
from app.models.rebalancing_history import RebalancingHistory
from app.models.stock import Stock
from app.schemas.strategy import StrategyCreate, StrategyUpdate, StrategyResponse, StrategySnapshotResponse
from app.services.strategy_service import strategy_service
from app.services.rebalancing_service import rebalancing_service
from app.schemas.rebalancing import RebalancingCalculation, RebalancingHistoryResponse

router = APIRouter(prefix="/strategies", tags=["strategies"])


@router.get("", response_model=list[StrategyResponse])
async def list_strategies(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Strategy).where(Strategy.user_id == user_id)
    )
    strategies = result.scalars().all()
    return strategies


@router.post("", response_model=StrategyResponse, status_code=status.HTTP_201_CREATED)
async def create_strategy(
    strategy_data: StrategyCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Convert portfolio allocations to dict format for storage
    portfolio_allocations_dict = [
        {
            "portfolio_id": alloc.portfolio_id,
            "percentage": alloc.percentage,
            "stock_allocations": alloc.stock_allocations
        }
        for alloc in strategy_data.portfolio_allocations
    ]
    
    new_strategy = Strategy(
        user_id=user_id,
        name=strategy_data.name,
        total_funds=strategy_data.total_funds,
        portfolio_allocations=portfolio_allocations_dict
    )
    
    db.add(new_strategy)
    await db.commit()
    await db.refresh(new_strategy)
    
    # Calculate initial holdings
    await strategy_service.calculate_initial_holdings(db, new_strategy)
    
    return new_strategy


@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    return strategy


@router.put("/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(
    strategy_id: int,
    strategy_data: StrategyUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    # Update strategy fields
    if strategy_data.name is not None:
        strategy.name = strategy_data.name
    
    if strategy_data.total_funds is not None:
        strategy.total_funds = strategy_data.total_funds
    
    allocation_changed = False
    if strategy_data.portfolio_allocations is not None:
        portfolio_allocations_dict = [
            {
                "portfolio_id": alloc.portfolio_id,
                "percentage": alloc.percentage,
                "stock_allocations": alloc.stock_allocations
            }
            for alloc in strategy_data.portfolio_allocations
        ]
        strategy.portfolio_allocations = portfolio_allocations_dict
        allocation_changed = True
    
    await db.commit()
    await db.refresh(strategy)
    
    # Trigger rebalancing check if allocations changed
    if allocation_changed:
        await rebalancing_service.calculate_rebalancing(db, strategy_id)
    
    return strategy


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strategy(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    await db.delete(strategy)
    await db.commit()
    
    return None


@router.get("/{strategy_id}/rebalance/pending", response_model=RebalancingCalculation)
async def get_pending_rebalancing(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get the latest pending (not executed) rebalancing actions for a strategy"""
    # Verify strategy ownership
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    # Get the latest pending rebalancing record
    history_result = await db.execute(
        select(RebalancingHistory)
        .where(
            RebalancingHistory.strategy_id == strategy_id,
            RebalancingHistory.executed == False
        )
        .order_by(RebalancingHistory.created_at.desc())
        .limit(1)
    )
    history = history_result.scalar_one_or_none()
    
    if not history or not history.actions:
        # No pending actions - return empty
        return RebalancingCalculation(
            strategy_id=strategy_id,
            current_value=0,
            target_value=0,
            actions=[]
        )
    
    # Convert saved actions to RebalancingAction objects
    from app.schemas.rebalancing import RebalancingAction
    actions = [
        RebalancingAction(
            action=action["action"],
            stock_id=action["stock_id"],
            stock_symbol="",  # Will need to fetch
            quantity=action["quantity"],
            price=action["price"],
            total_amount=action["quantity"] * action["price"]
        )
        for action in history.actions
    ]
    
    # Fetch stock symbols
    stock_ids = [action["stock_id"] for action in history.actions]
    stocks_result = await db.execute(
        select(Stock).where(Stock.id.in_(stock_ids))
    )
    stocks = {stock.id: stock for stock in stocks_result.scalars().all()}
    
    # Update stock symbols
    for action in actions:
        if action.stock_id in stocks:
            action.stock_symbol = stocks[action.stock_id].symbol
    
    return RebalancingCalculation(
        strategy_id=strategy_id,
        current_value=0,  # Not needed for frontend display
        target_value=0,   # Not needed for frontend display
        actions=actions
    )


@router.post("/{strategy_id}/rebalance/calculate", response_model=RebalancingCalculation)
async def calculate_rebalancing(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    rebalancing_calculation = await rebalancing_service.calculate_rebalancing(db, strategy_id)
    return rebalancing_calculation


@router.post("/{strategy_id}/rebalance/execute", status_code=status.HTTP_200_OK)
async def execute_rebalancing(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    await rebalancing_service.execute_rebalancing(db, strategy_id)
    return {"message": "Rebalancing executed successfully"}


@router.get("/{strategy_id}/snapshots", response_model=list[StrategySnapshotResponse])
async def get_strategy_snapshots(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Verify strategy ownership
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    # Get snapshots
    snapshots_result = await db.execute(
        select(StrategySnapshot)
        .where(StrategySnapshot.strategy_id == strategy_id)
        .order_by(StrategySnapshot.snapshot_date.desc())
        .limit(30)  # Last 30 snapshots
    )
    snapshots = snapshots_result.scalars().all()
    
    return snapshots


@router.get("/{strategy_id}/rebalancing-history", response_model=list[RebalancingHistoryResponse])
async def get_rebalancing_history(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Verify strategy ownership
    result = await db.execute(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id
        )
    )
    strategy = result.scalar_one_or_none()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )
    
    # Get rebalancing history (only executed ones)
    history_result = await db.execute(
        select(RebalancingHistory)
        .where(
            RebalancingHistory.strategy_id == strategy_id,
            RebalancingHistory.executed == True
        )
        .order_by(RebalancingHistory.created_at.desc())
        .limit(50)  # Last 50 executed rebalancing actions
    )
    history = history_result.scalars().all()
    
    return history

