from pydantic import BaseModel


class WatchlistBase(BaseModel):
    name: str
    stock_ids: list[int]


class WatchlistCreate(WatchlistBase):
    pass


class WatchlistUpdate(WatchlistBase):
    pass


class WatchlistResponse(WatchlistBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

