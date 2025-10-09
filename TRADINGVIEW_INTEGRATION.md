# TradingView Integration & Stock Details

## Overview
This document describes the real TradingView data integration and stock details feature implementation.

## Backend Changes

### 1. Database Schema
**File**: `backend/app/models/stock.py`
- Added `logo_url` field to Stock model

**Migration**: `backend/alembic/versions/add_logo_url_to_stocks.py`
- Added `logo_url` column to stocks table

### 2. TradingView Service
**File**: `backend/app/services/tradingview_service.py`

#### Real Price Fetching
```python
async def get_stock_price(self, symbol: str, exchange: str = "EGX") -> float:
    """Fetches real-time stock prices from TradingView using tradingview-ta package"""
    handler = TA_Handler(
        symbol=symbol,
        exchange=exchange,
        screener="egypt",
        interval=Interval.INTERVAL_1_DAY
    )
    analysis = handler.get_analysis()
    return float(analysis.indicators.get("close", 0))
```

#### Comprehensive Stock Data
```python
async def get_stock_data(self, symbol: str, exchange: str = "EGX") -> Dict:
    """Returns detailed stock data including:
    - Price, Open, High, Low
    - Volume, Change, Change %
    - Recommendation (BUY/SELL/NEUTRAL)
    - Buy/Sell/Neutral signals count
    """
```

#### Stock Logos
- **Primary**: Real logos from TradingView Search API (`TradingView.search()`)
  - Fetches actual company logos from TradingView's database
  - High-quality SVG/PNG logos hosted on TradingView's S3
  - Example: `https://s3-symbol-logo.tradingview.com/commercial-international-bank.svg`
- **Fallback**: Color-coded avatars from UI Avatars (https://ui-avatars.com/)
  - Used when TradingView doesn't have a logo
  - Each stock has a unique color-coded avatar
  - Format: `https://ui-avatars.com/api/?name=SYMBOL&background=COLOR&color=fff&size=128`

### 3. API Endpoints

#### Stock Details Endpoint
**Route**: `GET /api/stocks/{stock_id}/details`
**Response**: `StockDetailResponse`
- All basic stock info
- Technical analysis data
- Buy/Sell/Neutral signals
- Logo URL

### 4. Schemas
**File**: `backend/app/schemas/stock.py`
- Added `logo_url` to `StockResponse`
- Created `StockDetailResponse` with technical analysis fields

**File**: `backend/app/schemas/holding.py`
- Added `stock_logo_url` to `HoldingWithStock`

### 5. Holdings API Update
**File**: `backend/app/api/routes/holdings.py`
- Updated both endpoints to return `stock_logo_url`

## Frontend Changes

### 1. Stock Logo Component
**File**: `frontend/components/StockLogo.tsx`

Reusable component that:
- Displays stock logo from URL if available
- Falls back to colored circle with stock symbol
- Auto-generates colors based on symbol
- Customizable size

```typescript
<StockLogo 
  symbol="CIB" 
  name="Commercial International Bank"
  logoUrl={stock.logo_url}
  size={40}
/>
```

### 2. Stock Details Page
**File**: `frontend/app/dashboard/stocks/[id]/page.tsx`

Comprehensive stock details page featuring:

#### Header Section
- Large stock logo
- Stock symbol and full name
- Current price with change percentage
- Last updated timestamp

#### Price Information Cards
- Open price
- High (green)
- Low (red)
- Volume

#### Technical Analysis Section
- Overall recommendation (BUY/SELL/NEUTRAL)
- Buy/Sell/Neutral signals count
- Visual signal distribution bar

### 3. Stock Logos Everywhere

#### Stocks List Page
**File**: `frontend/app/dashboard/stocks/page.tsx`
- Logo in Symbol column
- Clickable rows navigate to stock details

#### Holdings Page
**File**: `frontend/app/dashboard/holdings/page.tsx`
- Logo in Symbol column
- Shows aggregated holdings with logos

#### Strategy Detail Page
**File**: `frontend/app/dashboard/strategies/[id]/page.tsx`
- Logo in holdings table
- Consistent logo display across all stock references

## Features

### Real-Time Data from TradingView
✅ Live stock prices from EGX market
✅ Technical indicators (Open, High, Low, Volume)
✅ Market recommendations
✅ Buy/Sell/Neutral signal analysis
✅ Auto-refresh every 5 minutes
✅ Manual refresh button

### Real Stock Logos
✅ **Automatic logo fetching from TradingView's database**
✅ High-quality company logos (SVG/PNG)
✅ Visual identification of stocks
✅ Consistent display across all pages
✅ Fallback to color-coded avatars if logo unavailable
✅ No manual mapping required

### Stock Details Page
✅ Comprehensive stock information
✅ Technical analysis visualization
✅ Market signals breakdown
✅ Professional UI with cards and charts

## Usage

### 1. Backend Setup
```bash
cd backend
uv pip install tradingview-ta>=3.3.0
alembic upgrade head
```

### 2. Start Application
```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build
```

### 3. Access Features

#### View All Stocks
Navigate to: **Dashboard > Stocks**
- See all EGX stocks with logos
- Click any stock to view details

#### View Stock Details
Click on any stock row or navigate to: **Dashboard > Stocks > [Stock Name]**
- View comprehensive technical analysis
- See buy/sell recommendations
- Check price history

#### Refresh Prices
Click **"Refresh Prices"** button in Stocks page
- Fetches latest data from TradingView
- Updates all holdings
- Creates new strategy snapshots

## Technical Details

### Package: tradingview-ta
- **Documentation**: https://python-tradingview-ta.readthedocs.io/
- **Version**: 3.3.0+
- **Features**: Technical analysis, indicators, recommendations

### EGX Market Configuration
```python
handler = TA_Handler(
    symbol="CIB",
    exchange="EGX",
    screener="egypt",  # Egyptian stock market
    interval=Interval.INTERVAL_1_DAY
)
```

### Dynamic Stock Discovery
**ALL EGX stocks are automatically discovered and loaded!**

The system uses TradingView's screener API to fetch all available stocks from the Egyptian Exchange (EGX). This means:
- ✅ **No manual stock list maintenance**
- ✅ **Automatically includes all EGX-listed stocks**
- ✅ **Sorted by market capitalization**
- ✅ **Up to 150 stocks supported**
- ✅ **Fallback list if screener unavailable**

### How It Works
```python
async def fetch_all_egx_stocks(self) -> List[Dict]:
    """Fetch all EGX stocks from TradingView's screener API"""
    payload = {
        "filter": [
            {"left": "exchange", "operation": "equal", "right": "EGX"}
        ],
        "columns": ["name", "close", "volume", "market_cap_basic"],
        "sort": {"sortBy": "market_cap_basic", "sortOrder": "desc"},
        "range": [0, 150]  # Get up to 150 stocks
    }
```

### Fallback Stocks (if screener fails)
1. **CIB** - Commercial International Bank
2. **COMI** - Commercial International Brokerage
3. **ORWE** - Oriental Weavers

## API Response Examples

### Stock Detail Response
```json
{
  "id": 1,
  "symbol": "CIB",
  "name": "Commercial International Bank",
  "exchange": "EGX",
  "current_price": 93.15,
  "logo_url": "https://ui-avatars.com/api/?name=CIB&background=0D47A1&color=fff&size=128",
  "last_updated": "2025-10-09T12:00:00",
  "open": 92.80,
  "high": 94.50,
  "low": 92.30,
  "volume": 1234567.0,
  "change": 0.35,
  "change_percent": 0.38,
  "recommendation": "BUY",
  "buy_signals": 12,
  "sell_signals": 3,
  "neutral_signals": 11
}
```

### Holding with Stock Logo
```json
{
  "id": 1,
  "stock_symbol": "CIB",
  "stock_name": "Commercial International Bank",
  "stock_logo_url": "https://ui-avatars.com/api/?name=CIB...",
  "quantity": 126,
  "average_price": 98.53,
  "current_stock_price": 93.15,
  "current_value": 11737.44
}
```

## Future Enhancements

### Potential Additions
- [ ] Historical price charts
- [ ] More technical indicators (RSI, MACD, etc.)
- [ ] Real company logos (if available)
- [ ] Stock comparison tool
- [ ] Alert system for price changes
- [ ] News integration
- [ ] Sector analysis
- [ ] Market heat maps

### Data Enhancements
- [ ] Intraday price updates
- [ ] Historical data storage
- [ ] Performance analytics
- [ ] Dividend information
- [ ] Company financials

## Troubleshooting

### Issue: Prices Not Updating
**Solution**: 
1. Check internet connection
2. Verify TradingView API is accessible
3. Check backend logs for errors
4. Try manual refresh

### Issue: Stock Logos Not Showing
**Solution**:
1. Check if `logo_url` is in database
2. Run migration: `alembic upgrade head`
3. Verify UI Avatars service is accessible

### Issue: Technical Analysis Not Available
**Solution**:
1. Verify `tradingview-ta` package is installed
2. Check if stock symbol exists on TradingView
3. Ensure correct exchange and screener settings

## Notes

- TradingView data is fetched on-demand for details page
- Prices are cached in database for performance
- Auto-refresh runs every 5 minutes (configurable)
- Rate limiting: 0.3-0.5 second delay between requests
- Fallback to database values if TradingView unavailable

## Credits

- **TradingView API**: https://www.tradingview.com/
- **Python Package**: https://github.com/brian-the-dev/python-tradingview-ta
- **UI Avatars**: https://ui-avatars.com/

