from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TradingViewConnect(BaseModel):
    session_id: str


class TradingViewCredentialResponse(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    session_id: Optional[str] = None
    is_connected: bool
    last_check_at: Optional[datetime] = None
    connection_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TradingViewTestResponse(BaseModel):
    success: bool
    message: str
    is_connected: bool
    update_mode: Optional[str] = None  # streaming or delayed

