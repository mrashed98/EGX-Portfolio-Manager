# Stocks Page Fixes

**Date:** October 9, 2025  
**Issues Fixed:**
1. Market Cap and P/E Ratio not showing in stocks table
2. Missing recommendation filter chips (only had Strong Buy)

---

## Issue 1: Market Cap and P/E Ratio Not Showing ✅

### Problem
The stocks page was displaying dashes (`—`) for Market Cap and P/E Ratio columns because these fields were not being fetched and updated during the price refresh operation.

### Root Cause
The `refresh_prices()` method in `tradingview_service.py` was only fetching basic price data (OHLC, volume, change) but not fundamental data like market_cap and pe_ratio.

### Solution

#### Backend Changes

**File:** `/backend/app/services/tradingview_service.py`

1. **Updated data fetching in `refresh_prices()` method:**

```python
# Before: Only fetched basic price data
count, df = (Query()
    .set_markets('egypt')
    .select(
        'name', 'close', 'open', 'high', 'low', 'volume',
        'change', 'change_abs', 'Recommend.All'
    )
    .where(col('name').isin(symbols))
    .limit(500)
    .get_scanner_data(cookies=self.cookies))

# After: Now fetches comprehensive data including fundamentals
count, df = (Query()
    .set_markets('egypt')
    .select(
        'name', 'close', 'open', 'high', 'low', 'volume',
        'change', 'change_abs', 'Recommend.All',
        'market_cap_basic', 'price_earnings_ttm', 'earnings_per_share_basic_ttm',
        'beta_1_year', 'dividends_yield_current', 'price_book_fq',
        'return_on_equity', 'debt_to_equity', 'current_ratio', 'quick_ratio'
    )
    .where(col('name').isin(symbols))
    .limit(500)
    .get_scanner_data(cookies=self.cookies))
```

2. **Added code to update fundamental fields:**

```python
# Update fundamental data
if pd.notna(stock_data['market_cap_basic']) and stock_data['market_cap_basic'] > 0:
    stock.market_cap = float(stock_data['market_cap_basic'])

if pd.notna(stock_data['price_earnings_ttm']) and stock_data['price_earnings_ttm'] > 0:
    stock.pe_ratio = float(stock_data['price_earnings_ttm'])

if pd.notna(stock_data['earnings_per_share_basic_ttm']):
    stock.eps = float(stock_data['earnings_per_share_basic_ttm'])

if pd.notna(stock_data['beta_1_year']):
    stock.beta = float(stock_data['beta_1_year'])

if pd.notna(stock_data['dividends_yield_current']):
    stock.dividend_yield = float(stock_data['dividends_yield_current'])

if pd.notna(stock_data['price_book_fq']) and stock_data['price_book_fq'] > 0:
    stock.price_to_book = float(stock_data['price_book_fq'])

if pd.notna(stock_data['return_on_equity']):
    stock.roe = float(stock_data['return_on_equity'])

if pd.notna(stock_data['debt_to_equity']):
    stock.debt_to_equity = float(stock_data['debt_to_equity'])

if pd.notna(stock_data['current_ratio']):
    stock.current_ratio = float(stock_data['current_ratio'])

if pd.notna(stock_data['quick_ratio']):
    stock.quick_ratio = float(stock_data['quick_ratio'])
```

3. **Updated schema to include OHLC fields:**

**File:** `/backend/app/schemas/stock.py`

Added OHLC fields to `StockResponse`:
```python
class StockResponse(StockBase):
    id: int
    current_price: float
    logo_url: str | None = None
    sector: str | None = None
    industry: str | None = None
    open_price: float | None = None  # ← Added
    high_price: float | None = None  # ← Added
    low_price: float | None = None   # ← Added
    change: float | None = None
    change_percent: float | None = None
    volume: float | None = None
    # ... rest of fields
```

### Results

After running `/api/stocks/refresh`, all stocks now have:
- ✅ Market Cap populated (where available)
- ✅ P/E Ratio populated (where available)  
- ✅ All other fundamental metrics updated

**Example Data:**
```
COMI: Commercial International Bank
  Price: 105.9 EGP
  Market Cap: 325,203,133,446 EGP
  P/E Ratio: 5.94
  Recommendation: NEUTRAL

TMGH: Talaat Moustafa Group Holding
  Price: 57.79 EGP
  Market Cap: 119,085,185,485 EGP
  P/E Ratio: 9.96
  Recommendation: BUY
```

**Note:** Some stocks may still show N/A for P/E Ratio if:
- The company has no earnings (negative or zero)
- TradingView doesn't have this data for EGX stocks
- This is a data source limitation, not a code issue

---

## Issue 2: Missing Recommendation Filter Chips ✅

### Problem
The stocks page only had one recommendation filter chip ("Strong Buy"), but users needed to filter by all recommendation types.

### Solution

**File:** `/frontend/app/dashboard/stocks/page.tsx`

1. **Added all recommendation filter chips:**

```typescript
// Before: Only Strong Buy
const SCREENER_FILTERS = [
  { id: "all", label: "All Stocks", icon: BarChart3 },
  { id: "top_gainers", label: "Top Gainers", icon: TrendingUp },
  { id: "biggest_losers", label: "Biggest Losers", icon: TrendingDown },
  { id: "high_volume", label: "High Volume", icon: Activity },
  { id: "large_cap", label: "Large Cap", icon: TrendingUp },
  { id: "small_cap", label: "Small Cap", icon: TrendingDown },
  { id: "low_pe", label: "Low P/E", icon: TrendingUp },
  { id: "high_dividend", label: "High Dividend", icon: DollarSign },
  { id: "strong_buy", label: "Strong Buy", icon: TrendingUp },
];

// After: All recommendation types
const SCREENER_FILTERS = [
  { id: "all", label: "All Stocks", icon: BarChart3 },
  { id: "top_gainers", label: "Top Gainers", icon: TrendingUp },
  { id: "biggest_losers", label: "Biggest Losers", icon: TrendingDown },
  { id: "high_volume", label: "High Volume", icon: Activity },
  { id: "large_cap", label: "Large Cap", icon: TrendingUp },
  { id: "small_cap", label: "Small Cap", icon: TrendingDown },
  { id: "low_pe", label: "Low P/E", icon: TrendingUp },
  { id: "high_dividend", label: "High Dividend", icon: DollarSign },
  { id: "strong_buy", label: "Strong Buy", icon: TrendingUp },    // ✓
  { id: "buy", label: "Buy", icon: TrendingUp },                   // ✓ New
  { id: "neutral", label: "Neutral", icon: Activity },             // ✓ New
  { id: "sell", label: "Sell", icon: TrendingDown },               // ✓ New
  { id: "strong_sell", label: "Strong Sell", icon: TrendingDown }, // ✓ New
];
```

2. **Updated filter logic to handle all recommendation types:**

```typescript
// Added cases for new recommendation filters
case "buy":
  return stocks
    .filter((s) => s.recommendation === "BUY")
    .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0));

case "neutral":
  return stocks
    .filter((s) => s.recommendation === "NEUTRAL")
    .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0));

case "sell":
  return stocks
    .filter((s) => s.recommendation === "SELL")
    .sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0));

case "strong_sell":
  return stocks
    .filter((s) => s.recommendation === "STRONG_SELL")
    .sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0));
```

### Results

Users can now filter stocks by:
- ✅ Strong Buy
- ✅ Buy (NEW)
- ✅ Neutral (NEW)
- ✅ Sell (NEW)
- ✅ Strong Sell (NEW)

Each filter:
- Shows only stocks with that recommendation
- Sorts appropriately (buy recommendations by highest gain, sell by lowest)
- Has appropriate icon (TrendingUp for buy, TrendingDown for sell, Activity for neutral)

---

## Recommendation Mapping Logic

TradingView provides a recommendation score from -1 to +1. The mapping is:

| Score Range | Recommendation | Filter Available |
|-------------|----------------|------------------|
| ≥ 0.7 | STRONG_BUY | ✅ Yes |
| 0.5 to 0.7 | BUY | ✅ Yes |
| -0.5 to 0.5 | NEUTRAL | ✅ Yes |
| -0.7 to -0.5 | SELL | ✅ Yes |
| ≤ -0.7 | STRONG_SELL | ✅ Yes |

This mapping is applied in:
1. `fetch_all_egx_stocks()` - Initial stock discovery
2. `refresh_prices()` - Regular price updates

---

## Data Availability Notes

### Market Cap
- ✅ Available for most EGX stocks
- Shows in EGP (Egyptian Pounds)
- Used for Large Cap / Small Cap filters

### P/E Ratio
- ⚠️ Only available for profitable companies
- May show N/A for:
  - Companies with losses
  - New listings without earnings history
  - Stocks where TradingView doesn't have data
- This is a **data source limitation**, not a bug

### All Other Metrics
Similarly populated during refresh:
- EPS (Earnings Per Share)
- Beta
- Dividend Yield
- Price to Book
- ROE (Return on Equity)
- Debt to Equity
- Current Ratio
- Quick Ratio

---

## Testing Performed

### Market Cap & P/E Ratio
- ✅ Refresh endpoint updates all stocks
- ✅ Data appears in stocks list view
- ✅ Data appears in stock detail view
- ✅ Sorting by Market Cap works
- ✅ Sorting by P/E Ratio works
- ✅ Low P/E filter works correctly

### Recommendation Filters
- ✅ All 5 recommendation chips visible
- ✅ Strong Buy filter works
- ✅ Buy filter works
- ✅ Neutral filter works
- ✅ Sell filter works
- ✅ Strong Sell filter works
- ✅ Each filter shows appropriate stocks
- ✅ Sorting within each filter works

---

## Files Modified

### Backend
1. `/backend/app/services/tradingview_service.py`
   - Updated `refresh_prices()` to fetch fundamental data
   - Added code to update market_cap, pe_ratio, and other metrics

2. `/backend/app/schemas/stock.py`
   - Added `open_price`, `high_price`, `low_price` to `StockResponse`

### Frontend
3. `/frontend/app/dashboard/stocks/page.tsx`
   - Added 4 new recommendation filter chips
   - Added filter logic for Buy, Neutral, Sell, Strong Sell

---

## How to Refresh Data

To populate/update all stock data including Market Cap and P/E Ratio:

**API Endpoint:**
```bash
POST /api/stocks/refresh
```

**From Frontend:**
Click the "Refresh Prices" button on the stocks page (🔄 icon)

**From Terminal:**
```bash
curl -X POST http://localhost:8000/api/stocks/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This will update all stocks with:
- Latest prices (close, open, high, low)
- Volume and change data
- Market Cap
- P/E Ratio
- All other fundamental metrics
- Recommendations

---

## Summary

Both issues have been successfully resolved:

1. ✅ **Market Cap and P/E Ratio now showing** - Data is fetched and updated during price refresh
2. ✅ **All recommendation filters available** - Users can filter by Strong Buy, Buy, Neutral, Sell, and Strong Sell

The stocks page now provides comprehensive filtering and complete fundamental data for informed investment decisions.

