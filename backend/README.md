# EGX Stock Portfolio Manager - Backend

FastAPI backend for the EGX Stock Portfolio Manager application.

## Features

- User authentication with JWT
- **Real-time stock data from TradingView** for EGX (Egyptian Exchange)
- Portfolio management
- Strategy management with automated rebalancing
- Holdings tracking
- Watchlist management
- Technical analysis indicators and recommendations

## Setup

### Prerequisites

- Python 3.11+
- UV package manager
- PostgreSQL 16+

### Installation

1. Install dependencies using UV:
```bash
uv pip install -r pyproject.toml
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
alembic upgrade head
```

4. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

## TradingView Integration

The backend uses the `tradingview-ta` package ([documentation](https://python-tradingview-ta.readthedocs.io/en/latest/)) to fetch real-time stock data from TradingView for the Egyptian Exchange (EGX).

### Features:
- **Real-time prices**: Fetches current stock prices from TradingView
- **Technical indicators**: Close, Open, High, Low, Volume
- **Analysis**: Buy/Sell/Neutral signals and recommendations
- **Auto-refresh**: Prices are automatically refreshed every 5 minutes

### Dynamic Stock Discovery:
The system **automatically fetches ALL EGX stocks** from TradingView's screener API on first run:
- ✅ No manual stock list maintenance
- ✅ Automatically discovers all EGX-listed stocks
- ✅ Sorted by market capitalization
- ✅ Up to 150 stocks supported
- ✅ Includes stock names and initial prices
- ✅ Fallback to minimal list if screener unavailable

### Manual Price Refresh:
Use the `/api/stocks/refresh` endpoint to manually trigger a price refresh for all stocks.

## Docker

Build and run with Docker:
```bash
docker build -t portfolio-backend .
docker run -p 8000:8000 --env-file .env portfolio-backend
```

Or use Docker Compose (from project root):
```bash
docker-compose up backend
```

