from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.api.routes import auth, stocks, portfolios, strategies, holdings, watchlists, tradingview
from app.services.tradingview_service import tradingview_service
from app.core.database import AsyncSessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize EGX stocks
    async with AsyncSessionLocal() as db:
        await tradingview_service.initialize_egx_stocks(db)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="EGX Stock Portfolio Manager API",
    description="API for managing stock portfolios on the Egyptian Exchange",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(stocks.router, prefix="/api")
app.include_router(portfolios.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(holdings.router, prefix="/api")
app.include_router(watchlists.router, prefix="/api")
app.include_router(tradingview.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "EGX Stock Portfolio Manager API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

