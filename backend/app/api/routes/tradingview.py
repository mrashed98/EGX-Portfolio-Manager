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
    Connect TradingView account by storing encrypted credentials.
    Tests credentials before saving.
    """
    # Test credentials first
    success, message = tradingview_service.test_credentials(
        credentials.username,
        credentials.password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    # Check if credentials already exist for this user
    result = await db.execute(
        select(TradingViewCredential).where(TradingViewCredential.user_id == user_id)
    )
    existing_cred = result.scalar_one_or_none()
    
    # Encrypt the password
    encrypted_password = encrypt_credential(credentials.password)
    
    if existing_cred:
        # Update existing credentials
        existing_cred.username = credentials.username
        existing_cred.encrypted_password = encrypted_password
        existing_cred.is_connected = True
        existing_cred.last_check_at = datetime.utcnow()
        existing_cred.connection_error = None
        existing_cred.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(existing_cred)
        
        # Initialize service with new credentials
        tradingview_service.initialize_with_credentials(credentials.username, credentials.password)
        
        return existing_cred
    else:
        # Create new credentials
        new_cred = TradingViewCredential(
            user_id=user_id,
            username=credentials.username,
            encrypted_password=encrypted_password,
            is_connected=True,
            last_check_at=datetime.utcnow(),
        )
        
        db.add(new_cred)
        await db.commit()
        await db.refresh(new_cred)
        
        # Initialize service with new credentials
        tradingview_service.initialize_with_credentials(credentials.username, credentials.password)
        
        return new_cred


@router.post("/test", response_model=TradingViewTestResponse)
async def test_connection(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Test the TradingView connection using stored credentials.
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
    
    # Test actual connection to TradingView
    try:
        # Decrypt password and test
        decrypted_password = decrypt_credential(cred.encrypted_password)
        success, message = tradingview_service.test_credentials(cred.username, decrypted_password)
        
        # Update last check
        cred.last_check_at = datetime.utcnow()
        cred.is_connected = success
        cred.connection_error = None if success else message
        
        await db.commit()
        
        return TradingViewTestResponse(
            success=success,
            message=message,
            is_connected=success
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
            is_connected=False
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

