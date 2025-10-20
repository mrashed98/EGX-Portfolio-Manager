from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.strategy import Strategy
from app.models.strategy_snapshot import StrategySnapshot
from app.models.rebalancing_history import RebalancingHistory
from app.models.stock import Stock
from app.models.holding import Holding
from app.models.portfolio import Portfolio
from app.schemas.strategy import StrategyCreate, StrategyUpdate, StrategyResponse, StrategySnapshotResponse
from app.services.strategy_service import strategy_service
from app.services.rebalancing_service import rebalancing_service
from app.services.import_export_service import import_export_service
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
    stocks = {}
    if stock_ids:
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


@router.post("/{strategy_id}/rebalance/{rebalancing_id}/undo", status_code=status.HTTP_200_OK)
async def undo_rebalancing(
    strategy_id: int,
    rebalancing_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Undo an executed rebalancing action"""
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
    
    # Verify rebalancing record belongs to this strategy
    rebalancing_result = await db.execute(
        select(RebalancingHistory).where(
            RebalancingHistory.id == rebalancing_id,
            RebalancingHistory.strategy_id == strategy_id
        )
    )
    rebalancing = rebalancing_result.scalar_one_or_none()
    
    if not rebalancing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rebalancing record not found"
        )
    
    try:
        await rebalancing_service.undo_rebalancing(db, rebalancing_id)
        return {"message": "Rebalancing undone successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


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


# ===== IMPORT/EXPORT ENDPOINTS =====

@router.get("/import-template")
async def download_strategy_template():
    """Download Excel template for strategy import"""
    template = import_export_service.generate_strategy_template()
    
    return StreamingResponse(
        template,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=strategy_import_template.xlsx"}
    )


@router.post("/import")
async def import_strategy(
    strategy_name: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Import strategy with holdings from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xlsx, .xls) are supported"
        )
    
    try:
        content = await file.read()
        parsed_data = await import_export_service.parse_strategy_excel(content, db)
        holdings_data = parsed_data.get('holdings', [])
        
        if not holdings_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No holdings data found in file"
            )
        
        # Look up all stocks
        symbols = [h['symbol'] for h in holdings_data]
        stocks_result = await db.execute(
            select(Stock).where(Stock.symbol.in_(symbols))
        )
        stocks = {stock.symbol: stock for stock in stocks_result.scalars().all()}
        
        # Check for missing stocks
        found_symbols = set(stocks.keys())
        missing_symbols = set(symbols) - found_symbols
        if missing_symbols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stocks not found: {', '.join(missing_symbols)}"
            )
        
        # Create holdings without a strategy first (manual holdings)
        created_holdings = []
        for holding_data in holdings_data:
            stock = stocks[holding_data['symbol']]
            current_value = holding_data['quantity'] * stock.current_price
            
            new_holding = Holding(
                user_id=user_id,
                stock_id=stock.id,
                quantity=holding_data['quantity'],
                average_price=holding_data['purchase_price'],
                current_value=current_value,
                purchase_date=holding_data['purchase_date'],
                notes=holding_data['notes'],
                is_manual=True
            )
            db.add(new_holding)
            created_holdings.append(new_holding)
        
        await db.commit()
        
        return {
            "message": f"Imported {len(created_holdings)} holdings for strategy '{strategy_name}'",
            "holdings_count": len(created_holdings),
            "note": "Holdings created as manual entries. You can now create a strategy and map these holdings to it."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Excel file: {str(e)}"
        )


@router.get("/{strategy_id}/export")
async def export_strategy(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Export strategy with all allocations and holdings"""
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
    
    # Get holdings
    holdings_result = await db.execute(
        select(Holding).where(Holding.strategy_id == strategy_id)
    )
    holdings = holdings_result.scalars().all()
    
    # Get all relevant stocks
    stock_ids = [h.stock_id for h in holdings]
    for alloc in strategy.portfolio_allocations:
        stock_ids.extend([int(sid) for sid in alloc.get('stock_allocations', {}).keys()])
    
    stocks = {}
    if stock_ids:
        stocks_result = await db.execute(
            select(Stock).where(Stock.id.in_(stock_ids))
        )
        stocks = {stock.id: stock for stock in stocks_result.scalars().all()}
    
    # Get portfolios
    portfolio_ids = [alloc['portfolio_id'] for alloc in strategy.portfolio_allocations]
    portfolios_result = await db.execute(
        select(Portfolio).where(Portfolio.id.in_(portfolio_ids))
    )
    portfolios = {p.id: p for p in portfolios_result.scalars().all()}
    
    # Generate Excel
    excel_file = await import_export_service.create_strategy_excel(
        db, strategy, holdings, stocks, portfolios
    )
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=strategy_{strategy.name.replace(' ', '_')}.xlsx"}
    )


@router.get("/{strategy_id}/history/export")
async def export_strategy_history(
    strategy_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Export strategy rebalancing history"""
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
    
    # Get rebalancing history
    history_result = await db.execute(
        select(RebalancingHistory)
        .where(RebalancingHistory.strategy_id == strategy_id)
        .order_by(RebalancingHistory.created_at.desc())
    )
    history = history_result.scalars().all()
    
    # Get all relevant stocks
    stock_ids = set()
    for entry in history:
        if isinstance(entry.actions, list):
            for action in entry.actions:
                if 'stock_id' in action:
                    stock_ids.add(action['stock_id'])
    
    stocks = {}
    if stock_ids:
        stocks_result = await db.execute(
            select(Stock).where(Stock.id.in_(stock_ids))
        )
        stocks = {stock.id: stock for stock in stocks_result.scalars().all()}
    
    # Generate Excel
    excel_file = await import_export_service.create_strategy_history_excel(
        db, strategy, history, stocks
    )
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=strategy_{strategy.name.replace(' ', '_')}_history.xlsx"}
    )

