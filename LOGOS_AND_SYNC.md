# Stock Logos & Sync Guide

## 📊 Understanding Stock Logos

### Real Logos from TradingView! 🎉

**Great News**: **TradingView DOES provide company logos** through their search API!

The `tradingview-ta` Python package provides:
- ✅ Technical analysis (indicators, signals)
- ✅ Price data (OHLC - Open, High, Low, Close)
- ✅ Volume
- ✅ Buy/Sell recommendations
- ✅ **Real company logos from TradingView's database!**

### What We're Using

We use a **hybrid logo system**:

1. **Primary**: Fetch real logos from TradingView Search API
   - Automatic for all EGX stocks
   - High-quality company logos
   - Uses `TradingView.search(symbol, "egypt")`
   - Example: Returns SVG logos from https://s3-symbol-logo.tradingview.com/

2. **Fallback**: Generate color-coded avatar badges (if logo not found)
   - Uses UI Avatars service
   - Each stock gets a unique color based on its symbol
   - Shows stock symbol letters
   - Example: https://ui-avatars.com/api/?name=ORWE&background=388E3C&color=fff&size=128

### How It Works

```python
from tradingview_ta import TradingView

# Search for stock and get logo
results = TradingView.search("CIB", "egypt")
# Returns: [{'symbol': 'CIB', 'logo': 'https://s3-symbol-logo.tradingview.com/...', ...}]

logo_url = results[0]['logo']  # Get the real logo!
```

**No manual mapping needed** - logos are automatically fetched for all stocks!

---

## 🔄 Syncing All EGX Stocks

### The Problem

Your database has only **10 hardcoded stocks** from the initial setup. To get ALL EGX stocks, you need to sync with TradingView's screener.

### The Solution

I've added a **"Sync All Stocks"** button in the Stocks page!

### How to Use

1. **Navigate to**: Dashboard → Stocks

2. **Click**: "Sync All Stocks" button (left button with download icon)

3. **What Happens**:
   ```
   1. Fetches ALL stocks from TradingView EGX screener
   2. Adds new stocks to database
   3. Updates existing stocks (names, prices)
   4. Tries to fetch real logos for new stocks
   5. Falls back to avatars if real logo not found
   ```

4. **Result**: Toast notification showing:
   ```
   Synced stocks from TradingView
   Added: 45 stocks
   Updated: 10 stocks
   Total: 55 stocks
   ```

### First Time Setup

```bash
# 1. Rebuild and restart the containers
docker-compose down
docker-compose up --build

# 2. Open the app
# http://localhost:3000

# 3. Login/Register

# 4. Go to Dashboard → Stocks

# 5. Click "Sync All Stocks"

# 6. Wait for sync to complete (may take 30-60 seconds)

# 7. Refresh the page - you'll now see ALL EGX stocks!
```

---

## 🆚 Sync vs Refresh

### Sync All Stocks (New!)
- **Endpoint**: `POST /api/stocks/sync`
- **Purpose**: Fetch ALL EGX stocks from TradingView screener
- **When to use**: 
  - First time setup
  - When you want to discover new stocks listed on EGX
  - When stock names need updating
- **What it does**:
  - Adds new stocks
  - Updates existing stock names
  - Fetches initial prices
  - Attempts to get real logos

### Refresh Prices
- **Endpoint**: `POST /api/stocks/refresh`
- **Purpose**: Update prices for existing stocks
- **When to use**: 
  - Get latest stock prices
  - Update holdings values
  - Trigger strategy snapshots
- **What it does**:
  - Updates prices for ALL stocks in database
  - Recalculates all holdings
  - Creates new strategy snapshots

---

## 🖼️ Real Logos - Automatic!

### No Setup Required! ✨

**All EGX stock logos are automatically fetched from TradingView!**

When you click **"Sync All Stocks"**, the system:
1. Fetches stock symbols from TradingView screener
2. For each stock, searches TradingView's database
3. Extracts the real company logo
4. Stores it in the database
5. Falls back to avatar if logo not found

### Logo Sources

**Primary Source**: TradingView's logo database
- High-quality SVG/PNG logos
- Automatically maintained by TradingView
- Covers most major stocks globally
- EGX stocks that are tracked by TradingView have real logos

**Fallback**: Color-coded avatars
- Only used if TradingView doesn't have the logo
- Still looks professional
- Unique color per stock

### Example Logo URLs

Real TradingView logos look like:
```
https://s3-symbol-logo.tradingview.com/commercial-international-bank.svg
https://s3-symbol-logo.tradingview.com/telecom-egypt.svg
https://s3-symbol-logo.tradingview.com/fawry.svg
```

### Manual Override (Optional)

If you want to use custom logos, you can:
1. Manually update the `logo_url` in the database
2. Or wait for a future admin UI feature to upload custom logos

---

## 🎨 Avatar Customization

The generated avatars are already customized with:
- ✅ Stock symbol displayed
- ✅ Unique colors per stock (15 color palette)
- ✅ Bold text for readability
- ✅ Consistent sizing (128px)

If you want to customize further:

**File**: `backend/app/services/tradingview_service.py`

```python
def _generate_logo_url(self, symbol: str) -> str:
    # Customize these parameters:
    return f"https://ui-avatars.com/api/?name={symbol}" \
           f"&background={color}" \
           f"&color=fff" \
           f"&size=128" \
           f"&bold=true" \
           f"&font-size=0.4" \
           # Add more UI Avatars params: rounded, uppercase, etc.
```

---

## 🔧 Troubleshooting

### Issue: "Still seeing only 10 stocks"

**Solution**:
1. Click **"Sync All Stocks"** button
2. Wait for completion
3. Refresh page

**Alternative** (if button doesn't work):
```bash
# Via curl
curl -X POST http://localhost:8000/api/stocks/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "Logos not loading"

**Cause**: Either:
- Company domain not mapped
- Clearbit doesn't have the logo
- Network issue

**Solution**:
- Check browser console for errors
- Verify logo URL in database
- Add domain mapping (see Option 1 above)

### Issue: "Sync takes too long"

**Expected**: 30-60 seconds for ~50-150 stocks

**If longer**:
- Check network connection
- Check TradingView availability
- Look at backend logs:
  ```bash
  docker-compose logs -f backend
  ```

### Issue: "Some stocks missing after sync"

**Possible causes**:
- Stock not on EGX anymore
- TradingView hasn't indexed it yet
- Network timeout

**Solution**:
- Try syncing again
- Check TradingView website directly
- Contact support if persistent

---

## 📊 Expected Results

### After First Sync

**Before**:
```
10 stocks (hardcoded)
- CIB, COMI, ORWE, TMGH, HRHO, 
  PHDC, OCDI, SWDY, ETEL, FWRY
```

**After**:
```
50-150 stocks (all EGX)
- All major EGX companies
- Sorted by market cap
- Real logos for mapped companies
- Avatars for unmapped companies
```

### Logos Breakdown

**With real logos** (if domain mapped):
- CIB → Real Commercial International Bank logo
- ETEL → Real Telecom Egypt logo
- FWRY → Real Fawry logo

**With avatars** (not mapped):
- ORWE → Green circle with "ORWE"
- TMGH → Purple circle with "TMGH"
- etc.

---

## 🚀 API Reference

### Sync All Stocks

```http
POST /api/stocks/sync
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Stock sync completed",
  "added": 45,
  "updated": 10,
  "total": 55
}
```

### Refresh Prices

```http
POST /api/stocks/refresh
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Stock prices and holdings refreshed successfully"
}
```

---

## 💡 Pro Tips

1. **Sync once, refresh often**: Sync adds new stocks (slow), refresh updates prices (fast)

2. **Contribute domain mappings**: If you find company websites, add them to help others

3. **Combine with price refresh**: After syncing, prices might be stale - click "Refresh Prices"

4. **Check logs**: Backend logs show detailed sync progress and any errors

5. **Avatar colors**: Consistent per symbol - helps visual recognition

---

## 📝 Summary

✅ **TradingView TA doesn't provide logos** - this is a limitation of the API
✅ **Use "Sync All Stocks"** button to get ALL EGX stocks
✅ **Real logos** for CIB, ETEL, FWRY, COMI (and more you can add)
✅ **Color-coded avatars** for stocks without real logos
✅ **Add domain mappings** to get more real logos
✅ **Sync is different from Refresh** - Sync adds stocks, Refresh updates prices

The system now **automatically discovers ALL EGX stocks** and uses the best available logo source! 🎉

