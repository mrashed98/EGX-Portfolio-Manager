# EGX Stock Portfolio Manager

A comprehensive stock portfolio management system for the Egyptian Exchange (EGX) with automated rebalancing capabilities.

## Features

- **User Management**: Secure authentication with JWT
- **Stock Tracking**: Real-time tracking of all EGX stocks with TradingView integration
- **Portfolio Management**: Create and manage collections of stocks
- **Strategy Management**: Allocate funds across multiple portfolios with custom percentages
- **Holdings Tracker**: Track all holdings across strategies
- **Watchlists**: Create custom watchlists for stocks
- **Automated Rebalancing**: Calculate and execute rebalancing actions with floor-based stock quantities
- **Performance Tracking**: Monitor strategy performance over time

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI Components
- Axios for API calls

### Backend
- FastAPI (Python)
- PostgreSQL (Database)
- SQLAlchemy (ORM with async support)
- Alembic (Database migrations)
- UV (Python package manager)
- TradingView API integration

### Infrastructure
- Docker & Docker Compose
- Multi-stage Docker builds

## Quick Start

### Prerequisites
- Docker and Docker Compose
- UV (for local backend development)
- Node.js 20+ (for local frontend development)

### Running with Docker Compose

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-portfolio-manager
```

2. Start all services:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development

#### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies with UV:
```bash
uv pip install -r pyproject.toml
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the development server:
```bash
uvicorn app.main:app --reload
```

#### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with API URL
```

4. Start the development server:
```bash
npm run dev
```

## Database Schema

### Core Tables
- **users**: User authentication and profile data
- **stocks**: EGX stock information with current prices
- **portfolios**: Collections of stocks (no allocations)
- **strategies**: Fund allocation across portfolios with stock-level percentages
- **holdings**: Integer-based stock holdings (floor method)
- **strategy_snapshots**: Performance tracking over time
- **watchlists**: User-created stock watchlists
- **rebalancing_history**: Record of rebalancing actions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Stocks
- `GET /api/stocks` - List all EGX stocks
- `GET /api/stocks/search` - Search stocks
- `GET /api/stocks/{id}` - Get stock details
- `POST /api/stocks/refresh` - Manually refresh prices

### Portfolios
- `GET /api/portfolios` - List user portfolios
- `POST /api/portfolios` - Create portfolio
- `PUT /api/portfolios/{id}` - Update portfolio
- `DELETE /api/portfolios/{id}` - Delete portfolio

### Strategies
- `GET /api/strategies` - List user strategies
- `POST /api/strategies` - Create strategy
- `PUT /api/strategies/{id}` - Update strategy
- `DELETE /api/strategies/{id}` - Delete strategy
- `POST /api/strategies/{id}/rebalance/calculate` - Calculate rebalancing
- `POST /api/strategies/{id}/rebalance/execute` - Execute rebalancing

### Holdings
- `GET /api/holdings` - List all holdings
- `GET /api/holdings/strategy/{id}` - List holdings for strategy

### Watchlists
- `GET /api/watchlists` - List user watchlists
- `POST /api/watchlists` - Create watchlist
- `PUT /api/watchlists/{id}` - Update watchlist
- `DELETE /api/watchlists/{id}` - Delete watchlist

## Rebalancing Logic

The rebalancing system follows these principles:

1. **Floor Method**: Stock quantities are always integers (using floor function)
2. **Manual + Auto Trigger**: Rebalancing can be triggered manually or when portfolio changes
3. **Action Generation**: System calculates required buy/sell actions
4. **In-App Notifications**: Users receive rebalancing recommendations in the UI

### Rebalancing Scenarios

#### Portfolio Stock Removal
- System identifies stocks to sell
- User sells stocks
- System automatically recalculates remaining holdings

#### Portfolio Stock Addition
- System calculates which stocks to sell to buy new ones
- Rebalancing actions generated

#### Mixed Changes
- Sell removed stocks first
- Check current strategy value
- Reallocate with new stocks
- Generate final rebalancing actions

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/portfolio_db
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development Notes

- Backend uses UV for package management (faster than pip)
- Frontend uses only ShadCN UI components (no other UI libraries)
- Periodic price refresh every 30 seconds + manual refresh option
- JWT-based stateless authentication
- All stock quantities use floor method (no partial stocks)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

