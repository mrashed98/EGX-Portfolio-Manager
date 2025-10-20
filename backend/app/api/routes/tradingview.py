from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id, encrypt_credential, decrypt_credential
from app.models.tradingview_credential import TradingViewCredential
from app.schemas.tradingview import TradingViewConnect, TradingViewCredentialResponse, TradingViewTestResponse
from app.services.tradingview_service import tradingview_service

router = APIRouter(prefix="/tradingview", tags=["tradingview"])


@router.post("/connect", response_model=TradingViewCredentialResponse)
async def connect_tradingview(
    credentials: TradingViewConnect,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Connect TradingView account by storing session_id.
    Tests session_id before saving to verify real-time data access.
    """
    # Test session_id first
    test_result = await tradingview_service.test_session_id(credentials.session_id)
    
    if not test_result['success']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=test_result['message']
        )
    
    # Check if credentials already exist for this user
    result = await db.execute(
        select(TradingViewCredential).where(TradingViewCredential.user_id == user_id)
    )
    existing_cred = result.scalar_one_or_none()
    
    if existing_cred:
        # Update existing credentials
        existing_cred.session_id = credentials.session_id
        existing_cred.is_connected = test_result['is_realtime']
        existing_cred.last_check_at = datetime.utcnow()
        existing_cred.connection_error = None if test_result['is_realtime'] else f"Delayed data mode: {test_result['update_mode']}"
        existing_cred.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(existing_cred)
        
        return existing_cred
    else:
        # Create new credentials
        new_cred = TradingViewCredential(
            user_id=user_id,
            session_id=credentials.session_id,
            is_connected=test_result['is_realtime'],
            last_check_at=datetime.utcnow(),
            connection_error=None if test_result['is_realtime'] else f"Delayed data mode: {test_result['update_mode']}"
        )
        
        db.add(new_cred)
        await db.commit()
        await db.refresh(new_cred)
        
        return new_cred


@router.post("/test", response_model=TradingViewTestResponse)
async def test_connection(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Test the TradingView connection using stored session_id.
    Checks if real-time data access is available.
    """
    # Get credentials
    result = await db.execute(
        select(TradingViewCredential).where(TradingViewCredential.user_id == user_id)
    )
    cred = result.scalar_one_or_none()
    
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TradingView credentials not found"
        )
    
    if not cred.session_id:
        return TradingViewTestResponse(
            success=False,
            message="No session ID configured",
            is_connected=False,
            update_mode=None
        )
    
    # Test actual connection to TradingView
    try:
        test_result = await tradingview_service.test_session_id(cred.session_id)
        
        # Update last check
        cred.last_check_at = datetime.utcnow()
        cred.is_connected = test_result['is_realtime']
        cred.connection_error = None if test_result['is_realtime'] else f"Delayed data mode: {test_result['update_mode']}"
        
        await db.commit()
        
        return TradingViewTestResponse(
            success=test_result['success'],
            message=test_result['message'],
            is_connected=test_result['is_realtime'],
            update_mode=test_result['update_mode']
        )
    except Exception as e:
        # Update error state
        cred.is_connected = False
        cred.connection_error = str(e)
        cred.last_check_at = datetime.utcnow()
        await db.commit()
        
        return TradingViewTestResponse(
            success=False,
            message=f"Connection test failed: {str(e)}",
            is_connected=False,
            update_mode=None
        )


@router.get("/status", response_model=TradingViewCredentialResponse)
async def get_status(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get TradingView connection status.
    """
    result = await db.execute(
        select(TradingViewCredential).where(TradingViewCredential.user_id == user_id)
    )
    cred = result.scalar_one_or_none()
    
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TradingView credentials not found"
        )
    
    return cred


@router.delete("/disconnect")
async def disconnect(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Disconnect TradingView account by deleting credentials.
    """
    result = await db.execute(
        select(TradingViewCredential).where(TradingViewCredential.user_id == user_id)
    )
    cred = result.scalar_one_or_none()
    
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TradingView credentials not found"
        )
    
    await db.delete(cred)
    await db.commit()
    
    return {"message": "TradingView account disconnected successfully"}

