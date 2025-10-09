# TradingView Screener Integration Guide

## 📊 Overview

This project uses the **`tradingview-screener`** package (not `tradingview-ta`) for fetching stock data from TradingView. This is a more robust, maintained, and feature-rich solution based on the [shner-elmo/tradingview-screener](https://github.com/shner-elmo/tradingview-screener) project.

## 🎯 Why tradingview-screener?

### Advantages over tradingview-ta:
- ✅ **Official TradingView API** - Uses TradingView's actual screener endpoint
- ✅ **No web scraping** - Direct API access, more reliable
- ✅ **Future-proof** - Automatically updated, no hard-coded values
- ✅ **Comprehensive data** - 3000+ fields available
- ✅ **Multiple markets** - Stocks, crypto, forex, CFDs, futures, bonds
- ✅ **All timeframes** - 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1d, 1w, 1mo
- ✅ **SQL-like filtering** - Powerful query syntax with AND/OR logic
- ✅ **Real company logos** - Via `logoid` field
- ✅ **Rich metadata** - Sector, industry, market cap, etc.

## 📦 Installation

```bash
pip install tradingview-screener
```

Or with `uv`:
```bash
cd backend
uv pip install tradingview-screener
```

## 🚀 How We Use It

### Fetching All EGX Stocks

```python
from tradingview_screener import Query

count, df = (Query()
    .set_markets('egypt')  # Filter by Egyptian market
    .select(
        'name',          # Ticker symbol
        'description',   # Company name
        'close',         # Current price
        'logoid',        # Logo ID for URL construction
        'sector',        # Business sector
        'industry',      # Industry classification
        'market_cap_basic',
        'volume',
        'exchange'
    )
    .order_by('market_cap_basic', ascending=False)
    .limit(200)
    .get_scanner_data())
```

### Field Mapping

| TradingView Field | Our Usage | Example |
|-------------------|-----------|---------|
| `name` | Stock symbol/ticker | "ORWE" |
| `description` | Company name | "Oriental Weavers" |
| `close` | Current price | 104.37 |
| `logoid` | Logo identifier | "oriental-weavers" |
| `sector` | Business sector | "Consumer Cyclical" |
| `industry` | Industry | "Textile Manufacturing" |
| `market_cap_basic` | Market capitalization | 5000000000 |
| `volume` | Trading volume | 1234567 |

### Logo URL Construction

TradingView provides a `logoid` field that we use to construct logo URLs:

```python
logoid = "commercial-international-bank"
logo_url = f"https://s3-symbol-logo.tradingview.com/{logoid}.svg"
# Result: https://s3-symbol-logo.tradingview.com/commercial-international-bank.svg
```

**Benefits:**
- High-quality SVG logos
- Hosted on TradingView's CDN
- Automatically maintained by TradingView
- No manual mapping needed!

### Getting Single Stock Data

```python
from tradingview_screener import Query

count, df = (Query()
    .set_markets('egypt')
    .select('name', 'description', 'close', 'open', 'high', 'low', 'volume')
    .where(Query.col('name') == 'ORWE')
    .limit(1)
    .get_scanner_data())
```

### Refreshing All Prices (Efficient)

```python
# Get all prices in one query (much faster than individual queries)
symbols = ['ORWE', 'CIB', 'ETEL', ...]

count, df = (Query()
    .set_markets('egypt')
    .select('name', 'close')
    .where(Query.col('name').isin(symbols))
    .limit(500)
    .get_scanner_data())

# Returns DataFrame with all prices
```

## 📋 Available Fields

The package supports 3000+ fields! Here are some useful ones for stocks:

### Price & Volume
- `close`, `open`, `high`, `low`
- `volume`, `relative_volume_10d_calc`
- `change`, `change_abs`

### Fundamental Data
- `market_cap_basic`
- `price_earnings_ttm`
- `earnings_per_share_basic_ttm`
- `revenue_per_share_ttm`
- `dividend_yield_recent`

### Technical Indicators
- `RSI`, `MACD.macd`, `MACD.signal`
- `Stoch.K`, `Stoch.D`
- `ADX`, `CCI20`

### Company Info
- `description` (company name)
- `sector`
- `industry`
- `logoid` (for logo URL)
- `type` (stock, crypto, etc.)
- `currency`

### Recommendations
- `Recommend.All` (overall recommendation -1 to 1)
- `Recommend.MA` (moving average recommendation)
- `Recommend.Other` (oscillators recommendation)

Full field list: https://shner-elmo.github.io/TradingView-Screener/fields/

## 🔍 Query Examples

### Filter by Market Cap

```python
Query().where(
    Query.col('market_cap_basic').between(1_000_000, 50_000_000)
).get_scanner_data()
```

### Filter by Multiple Conditions

```python
Query().where(
    Query.col('market_cap_basic') > 1_000_000,
    Query.col('volume') > 100_000,
    Query.col('RSI') < 30  # Oversold
).get_scanner_data()
```

### Order by Volume

```python
Query().order_by('volume', ascending=False).get_scanner_data()
```

### Pagination

```python
Query().offset(50).limit(50).get_scanner_data()  # Get items 51-100
```

## 🌍 Supported Markets

Available markets (use with `.set_markets()`):
- `'egypt'` - Egyptian Exchange (EGX)
- `'america'` - US markets
- `'uk'` - United Kingdom
- `'india'` - India
- `'china'` - China
- `'crypto'` - Cryptocurrencies
- `'forex'` - Foreign exchange
- And many more...

## 🎨 Our Implementation

### Service Structure

```python
class TradingViewService:
    async def fetch_all_egx_stocks(self) -> List[Dict]:
        """Fetch ALL EGX stocks with logos and metadata"""
        
    async def get_stock_price(self, symbol: str) -> float:
        """Get current price for one stock"""
        
    async def get_stock_data(self, symbol: str) -> Dict:
        """Get comprehensive data for one stock"""
        
    async def refresh_prices(self, db: AsyncSession):
        """Efficiently refresh all prices at once"""
```

### Key Features

1. **Batch Fetching** - Gets all stocks in one query (fast!)
2. **Real Logos** - Uses `logoid` to construct logo URLs
3. **Rich Metadata** - Stores sector, industry, market cap
4. **Efficient Updates** - Refreshes all prices in one query
5. **Fallback Avatars** - Generates color-coded avatars if logo unavailable

## 📖 Documentation

- **Package Docs**: https://shner-elmo.github.io/TradingView-Screener/
- **GitHub**: https://github.com/shner-elmo/tradingview-screener
- **Fields**: https://shner-elmo.github.io/TradingView-Screener/fields/
- **PyPI**: https://pypi.org/project/tradingview-screener/

## 🔄 Migration from tradingview-ta

### What Changed

| Old (tradingview-ta) | New (tradingview-screener) |
|---------------------|---------------------------|
| `TA_Handler()` | `Query()` |
| `get_analysis()` | `get_scanner_data()` |
| `search()` for names | `.select('description')` |
| Manual logo mapping | `logoid` field |
| Individual queries | Batch queries |
| Limited fields | 3000+ fields |

### Benefits of Migration

✅ **Faster** - Batch queries instead of individual requests
✅ **More Reliable** - Official API, not web scraping
✅ **Richer Data** - Sector, industry, fundamentals, etc.
✅ **Better Logos** - Direct from TradingView via logoid
✅ **Future-Proof** - Automatically maintained
✅ **No Rate Limits** - Efficient batch processing

## 🚀 Quick Start

```bash
# 1. Rebuild backend
docker-compose down
docker-compose up --build backend

# 2. Navigate to Stocks page
# 3. Click "Sync All Stocks"
# 4. See ALL EGX stocks with real logos!
```

## 📊 Expected Results

After syncing:
- **50-200 EGX stocks** (depending on TradingView's data)
- **Real company names** (not tickers)
- **Real logos** (SVG from TradingView)
- **Sector & industry** information
- **Market cap** data
- **Sorted by market cap** (largest first)

## 🎯 Summary

The `tradingview-screener` package is:
- ✅ More powerful than `tradingview-ta`
- ✅ Official API (not web scraping)
- ✅ Returns real company names and logos
- ✅ Supports rich metadata (sector, industry, etc.)
- ✅ Efficient batch processing
- ✅ Future-proof and well-maintained

Perfect for building a professional stock portfolio manager! 🎊

