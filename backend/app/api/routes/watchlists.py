from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.watchlist import Watchlist
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistResponse

router = APIRouter(prefix="/watchlists", tags=["watchlists"])


@router.get("", response_model=list[WatchlistResponse])
async def list_watchlists(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Watchlist).where(Watchlist.user_id == user_id)
    )
    watchlists = result.scalars().all()
    return watchlists


@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def create_watchlist(
    watchlist_data: WatchlistCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    new_watchlist = Watchlist(
        user_id=user_id,
        name=watchlist_data.name,
        stock_ids=watchlist_data.stock_ids
    )
    
    db.add(new_watchlist)
    await db.commit()
    await db.refresh(new_watchlist)
    
    return new_watchlist


@router.get("/{watchlist_id}", response_model=WatchlistResponse)
async def get_watchlist(
    watchlist_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        )
    )
    watchlist = result.scalar_one_or_none()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    return watchlist


@router.put("/{watchlist_id}", response_model=WatchlistResponse)
async def update_watchlist(
    watchlist_id: int,
    watchlist_data: WatchlistUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        )
    )
    watchlist = result.scalar_one_or_none()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    watchlist.name = watchlist_data.name
    watchlist.stock_ids = watchlist_data.stock_ids
    
    await db.commit()
    await db.refresh(watchlist)
    
    return watchlist


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watchlist(
    watchlist_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        )
    )
    watchlist = result.scalar_one_or_none()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    await db.delete(watchlist)
    await db.commit()
    
    return None


@router.post("/{watchlist_id}/stocks/{stock_id}", response_model=WatchlistResponse)
async def add_stock_to_watchlist(
    watchlist_id: int,
    stock_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        )
    )
    watchlist = result.scalar_one_or_none()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    if stock_id not in watchlist.stock_ids:
        watchlist.stock_ids = watchlist.stock_ids + [stock_id]
        await db.commit()
        await db.refresh(watchlist)
    
    return watchlist


@router.delete("/{watchlist_id}/stocks/{stock_id}", response_model=WatchlistResponse)
async def remove_stock_from_watchlist(
    watchlist_id: int,
    stock_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        )
    )
    watchlist = result.scalar_one_or_none()
    
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found"
        )
    
    if stock_id in watchlist.stock_ids:
        watchlist.stock_ids = [sid for sid in watchlist.stock_ids if sid != stock_id]
        await db.commit()
        await db.refresh(watchlist)
    
    return watchlist

