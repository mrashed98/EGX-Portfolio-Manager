# Getting Started with EGX Portfolio Manager

## Quick Start

### 1. Start the Application

The easiest way to run the entire application is with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 8000
- Frontend on port 3000

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. First Steps

1. **Register an Account**
   - Go to http://localhost:3000
   - Click "Register"
   - Create your account with email and password

2. **Login**
   - Use your credentials to login
   - You'll be redirected to the dashboard

3. **Explore EGX Stocks**
   - Navigate to "Stocks" in the sidebar
   - View all available EGX stocks
   - Use the refresh button to update prices
   - Prices auto-refresh every 30 seconds

4. **Create a Portfolio**
   - Go to "Portfolios"
   - Click "Create Portfolio"
   - Add stocks to your portfolio
   - Note: Portfolios are just collections of stocks (no allocations here)

5. **Create a Strategy**
   - Go to "Strategies"
   - Click "Create Strategy"
   - Set your total funds amount
   - Select portfolios and allocate percentages (must sum to 100%)
   - For each portfolio, set stock allocations (must sum to 100%)
   - System will calculate holdings using floor method (integer quantities)

6. **View Holdings**
   - Go to "Holdings"
   - See all your stock positions across all strategies
   - View profit/loss for each holding

7. **Rebalance Strategy**
   - When portfolio stocks change, you'll be notified
   - Go to strategy and click "Calculate Rebalance"
   - System will show buy/sell actions needed
   - Execute rebalancing to update holdings

## Development Setup

### Backend Development

1. Navigate to backend:
```bash
cd backend
```

2. Create virtual environment and install dependencies with UV:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r pyproject.toml
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start development server:
```bash
uvicorn app.main:app --reload
```

### Frontend Development

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with API URL
```

4. Start development server:
```bash
npm run dev
```

## Database Migrations

### Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "description of changes"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback last migration:
```bash
alembic downgrade -1
```

## Key Features Explained

### Portfolio vs Strategy

- **Portfolio**: A simple collection of stock IDs (e.g., ["CIB", "COMI", "ORWE"])
- **Strategy**: Allocates funds across one or more portfolios with:
  - Total funds amount
  - Portfolio allocations (percentage per portfolio)
  - Stock allocations within each portfolio (percentage per stock)

### Rebalancing Logic

The system uses a sophisticated rebalancing algorithm:

1. **Floor Method**: All stock quantities are integers (no fractional shares)
2. **Current Value Calculation**: Based on current holdings × current prices
3. **Target Allocation**: Calculated from strategy percentages and current total value
4. **Action Generation**: System calculates minimal buy/sell actions needed

### Auto-Rebalancing Triggers

Rebalancing is triggered:
- **Manually**: User clicks "Calculate Rebalance"
- **On Portfolio Change**: When stocks are added/removed from a portfolio used in a strategy

### Rebalancing Scenarios

**Scenario 1: Stock Removed from Portfolio**
- System notifies user to sell that stock
- After selling, remaining funds are reallocated

**Scenario 2: Stock Added to Portfolio**
- System calculates which current stocks to partially sell
- Uses proceeds to buy new stock
- Maintains target allocations

**Scenario 3: Mixed Changes**
- Sell removed stocks first
- Recalculate current value
- Reallocate with new stock mix
- Generate final buy/sell actions

## Architecture Overview

### Backend Stack
- **FastAPI**: High-performance Python web framework
- **PostgreSQL**: Relational database
- **SQLAlchemy**: Async ORM
- **Alembic**: Database migrations
- **UV**: Fast Python package manager
- **JWT**: Stateless authentication

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS
- **ShadCN UI**: Beautiful, accessible components
- **Axios**: HTTP client

### Database Schema

**Core Tables:**
- `users`: User accounts
- `stocks`: EGX stock data
- `portfolios`: Stock collections
- `strategies`: Fund allocation strategies
- `holdings`: Actual stock positions (integer quantities)
- `strategy_snapshots`: Performance tracking over time
- `watchlists`: User watchlists
- `rebalancing_history`: Rebalancing action history

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart the database
docker-compose restart postgres
```

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Ensure migrations are applied
docker-compose exec backend alembic upgrade head
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules .next
npm install
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
# Or stop conflicting services:
lsof -ti:3000 | xargs kill  # Frontend
lsof -ti:8000 | xargs kill  # Backend
lsof -ti:5432 | xargs kill  # PostgreSQL
```

## Next Steps

1. **Enhance TradingView Integration**: Currently uses sample data. Integrate real TradingView API.
2. **Add Create/Edit Forms**: Implement full CRUD dialogs for portfolios, strategies, and watchlists.
3. **Performance Charts**: Add charts using recharts for strategy performance over time.
4. **Notifications System**: Implement persistent notifications for rebalancing alerts.
5. **Email Notifications**: Optional email alerts for rebalancing needs.
6. **Export/Import**: Add ability to export strategies and holdings to CSV.
7. **Multi-Currency Support**: Support for USD and other currencies.

## Support

For issues or questions:
1. Check the API documentation at http://localhost:8000/docs
2. Review the logs: `docker-compose logs -f`
3. Check database state using a PostgreSQL client

## License

MIT License - feel free to modify and use as needed.

