<!-- 45167ef2-eed6-402d-a065-586f7651e2e5 ed8f8fec-9fc9-42b5-8456-065f54ebe31c -->
# EGX Stock Portfolio Manager Implementation Plan

## Architecture Overview

**Frontend**: Next.js + Tailwind CSS + ShadCN UI → `/frontend`

**Backend**: FastAPI + PostgreSQL → `/backend`

**Containerization**: Docker + Docker Compose

**Python Management**: UV

**Market Data**: TradingView API (WebSocket + Symbol Search)

## Database Schema

### Core Tables

- **users**: id, email, password_hash, created_at
- **stocks**: id, symbol, name, exchange, current_price, last_updated
- **portfolios**: id, user_id, name, stock_ids (array), created_at
- **strategies**: id, user_id, name, total_funds, portfolio_allocations (JSONB: portfolio_id + percentage + stock_allocations), created_at
- **holdings**: id, user_id, strategy_id, stock_id, quantity (integer), average_price, current_value
- **strategy_snapshots**: id, strategy_id, total_value, performance_percentage, snapshot_date
- **watchlists**: id, user_id, name, stock_ids (array)
- **rebalancing_history**: id, strategy_id, actions (JSONB), executed, created_at

**Key Changes**:

- Portfolios are simple stock collections (no allocations)
- Strategy allocations include: portfolio_id, percentage, and stock-level allocations (percentage per stock)
- Holdings use integer quantities (floor method for purchases)
- strategy_snapshots tracks value/performance over time

## Implementation Steps

### 1. Project Setup & Infrastructure

**Backend Setup** (`/backend`):

- Initialize UV project with `pyproject.toml`
- Install dependencies: fastapi, uvicorn, sqlalchemy, asyncpg, pydantic, python-jose, passlib, bcrypt
- Create Docker multi-stage build with UV
- Set up database models with SQLAlchemy (async)
- Configure Alembic for migrations

**Frontend Setup** (`/frontend`):

- Initialize Next.js 14+ with App Router
- Configure Tailwind CSS
- Install ShadCN UI components: button, card, form, input, table, dialog, tabs, toast, badge
- Set up API client with axios/fetch for backend communication
- Create authentication context/hooks

**Docker Compose**:

- Backend service (FastAPI)
- Frontend service (Next.js)
- PostgreSQL service with volume persistence
- Environment variables management

### 2. User Authentication System

**Backend**:

- `/api/auth/register` - User registration with password hashing
- `/api/auth/login` - JWT token generation
- JWT middleware for protected routes
- User model and CRUD operations

**Frontend**:

- Login page with ShadCN form components
- Registration page
- JWT storage (httpOnly cookies or localStorage)
- Protected route wrapper
- Auth context provider

### 3. TradingView Market Data Integration

**Backend Service** (`backend/services/tradingview_service.py`):

- Implement TradingView client using the referenced package
- Symbol search functionality for EGX stocks
- WebSocket connection for real-time data
- Background task to fetch and cache EGX stocks on first run
- Periodic update service (every 30 seconds) to refresh stock prices
- API endpoints:
                                - `GET /api/stocks` - List all EGX stocks
                                - `GET /api/stocks/search` - Search stocks
                                - `GET /api/stocks/{symbol}/price` - Get current price
                                - `POST /api/stocks/refresh` - Manual refresh

**Frontend**:

- Stock list page with search/filter
- Auto-refresh mechanism (30s polling)
- Manual refresh button

### 4. Portfolio Management

**Backend**:

- Portfolio model with stocks array (symbol, allocation_percentage)
- API endpoints:
                                - `POST /api/portfolios` - Create portfolio
                                - `GET /api/portfolios` - List user portfolios
                                - `PUT /api/portfolios/{id}` - Update portfolio
                                - `DELETE /api/portfolios/{id}` - Delete portfolio
- Validation: allocations sum to 100%
- Cascade logic: when portfolio changes, trigger strategy rebalancing check

**Frontend**:

- Portfolio list page with ShadCN cards
- Create/Edit portfolio dialog
- Stock selector with allocation percentage inputs
- Validation UI feedback

### 5. Strategy Management

**Backend**:

- Strategy model with total_funds and portfolio_allocations
- API endpoints:
                                - `POST /api/strategies` - Create strategy
                                - `GET /api/strategies` - List user strategies
                                - `PUT /api/strategies/{id}` - Update strategy
                                - `DELETE /api/strategies/{id}` - Delete strategy
- Validation: portfolio allocation percentages sum to 100%
- Calculate initial holdings based on strategy allocations

**Frontend**:

- Strategy list/detail pages
- Create strategy form: fund amount + portfolio selector with percentages
- Visual breakdown of fund allocation across portfolios

### 6. Holdings Tracker

**Backend**:

- Holdings model linked to strategy and stock
- Calculate holdings from strategy allocations
- API endpoints:
                                - `GET /api/holdings` - All user holdings across strategies
                                - `GET /api/holdings/strategy/{id}` - Holdings for specific strategy
- Aggregate view: total holdings per stock across all strategies

**Frontend**:

- Holdings dashboard with ShadCN table
- Current value vs cost basis
- Profit/loss indicators
- Group by strategy or by stock

### 7. Watchlist Management

**Backend**:

- Watchlist model with stock_ids array
- API endpoints:
                                - `POST /api/watchlists` - Create watchlist
                                - `GET /api/watchlists` - List user watchlists
                                - `PUT /api/watchlists/{id}` - Update watchlist
                                - `DELETE /api/watchlists/{id}` - Delete watchlist
                                - `POST /api/watchlists/{id}/stocks` - Add stock to watchlist
                                - `DELETE /api/watchlists/{id}/stocks/{stock_id}` - Remove stock

**Frontend**:

- Watchlist page with multiple lists
- Drag-and-drop stock management
- Quick add from stock list

### 8. Rebalancing Engine

**Backend** (`backend/services/rebalancing_service.py`):

- Core rebalancing algorithm:

                                1. Calculate current strategy value based on holdings and current prices
                                2. Calculate target allocation for each stock based on strategy percentages
                                3. Compare current vs target quantities
                                4. Generate buy/sell actions (minimize transactions)

- API endpoints:
                                - `POST /api/strategies/{id}/rebalance/calculate` - Calculate rebalancing needs
                                - `POST /api/strategies/{id}/rebalance/execute` - Mark rebalancing as executed
- Automatic trigger when portfolio updated:
                                - Removed stocks → notify sell actions, recalculate
                                - Added stocks → calculate sell-to-buy actions
                                - Modified allocations → full rebalancing calculation

**Frontend**:

- Rebalancing dialog/page
- Action list: sell/buy with quantities and amounts
- Before/after comparison
- Execute button (marks as completed, updates holdings)

### 9. Portfolio Change Impact System

**Backend**:

- When portfolio updated, find affected strategies
- Calculate rebalancing impact for each strategy
- Store pending actions in rebalancing_history
- Notification system (in-app messages)

**Frontend**:

- Notification component using ShadCN toast/alert
- Pending actions badge on strategy cards
- Review actions page

### 10. UI/UX Implementation

**Key Pages**:

- `/login` - Authentication
- `/register` - User registration
- `/dashboard` - Overview (holdings, strategies summary)
- `/stocks` - Browse/search EGX stocks
- `/portfolios` - Manage portfolios
- `/strategies` - Manage strategies
- `/holdings` - Holdings tracker
- `/watchlists` - Watchlist management
- `/rebalance/:strategyId` - Rebalancing interface

**Components** (all ShadCN):

- Navigation sidebar
- Stock price card with refresh indicator
- Portfolio allocation pie chart (using recharts + ShadCN)
- Strategy card with fund breakdown
- Holdings table with sorting/filtering
- Action buttons (buy/sell) in rebalancing view

### 11. Docker Configuration

**docker-compose.yml**:

```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
  
  backend:
    build: ./backend
    depends_on: postgres
    environment: DATABASE_URL, JWT_SECRET
  
  frontend:
    build: ./frontend
    depends_on: backend
    environment: NEXT_PUBLIC_API_URL
```

**Backend Dockerfile**: Multi-stage with UV

**Frontend Dockerfile**: Node.js with Next.js production build

### 12. Final Integration & Testing

- Connect all frontend pages to backend APIs
- Implement error handling and loading states
- Test complete user flow: register → create portfolio → create strategy → rebalance
- Test edge cases: portfolio deletion with active strategies, zero-balance rebalancing
- Environment variables documentation in README

## Key Files Structure

```
/backend
  /app
    /api/routes (auth, stocks, portfolios, strategies, holdings, watchlists)
    /models (database models)
    /services (tradingview_service, rebalancing_service)
    /core (config, security, database)
    main.py
  pyproject.toml
  Dockerfile
  
/frontend
  /app
    /(auth) (login, register)
    /dashboard
    /stocks
    /portfolios
    /strategies
    /holdings
    /watchlists
  /components (ui, shared components)
  /lib (api client, utils)
  package.json
  Dockerfile
  
docker-compose.yml
README.md
```

### To-dos

- [ ] Set up Docker Compose, initialize backend with UV, initialize frontend with Next.js
- [ ] Create database models, configure SQLAlchemy, set up Alembic migrations
- [ ] Implement JWT authentication (backend API + frontend pages)
- [ ] Integrate TradingView API for EGX stock data fetching and caching
- [ ] Build portfolio management (backend API + frontend UI)
- [ ] Build strategy management (backend API + frontend UI)
- [ ] Implement holdings calculation and tracker UI
- [ ] Build watchlist management system
- [ ] Implement core rebalancing algorithm and API
- [ ] Build portfolio change detection and user notifications
- [ ] Complete all ShadCN UI components, responsive design, loading states
- [ ] Finalize Dockerfiles, docker-compose.yml, and environment configuration