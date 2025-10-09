# Recommendation Threshold Fix

**Date:** October 9, 2025  
**Issue:** RACC showing "BUY" instead of "STRONG_BUY"

---

## Problem

RACC stock was showing **BUY** recommendation, but it should have shown **STRONG_BUY** because its recommendation score from TradingView was ~0.56.

---

## Root Cause

There were **inconsistent thresholds** between two methods in `tradingview_service.py`:

### Method 1: `fetch_all_egx_stocks()` (Initial Fetch)
```python
if recommend_val > 0.5:
    recommendation = "STRONG_BUY"
elif recommend_val > 0.1:
    recommendation = "BUY"
elif recommend_val < -0.5:
    recommendation = "STRONG_SELL"
elif recommend_val < -0.1:
    recommendation = "SELL"
else:
    recommendation = "NEUTRAL"
```

### Method 2: `refresh_prices()` (Price Updates) - WRONG!
```python
# ❌ WRONG - Different thresholds!
if rec_value >= 0.5:
    stock.recommendation = "STRONG_BUY" if rec_value >= 0.7 else "BUY"
elif rec_value <= -0.5:
    stock.recommendation = "STRONG_SELL" if rec_value <= -0.7 else "SELL"
else:
    stock.recommendation = "NEUTRAL"
```

### The Problem
For RACC with score **0.56**:
- **Initial fetch:** 0.56 > 0.5 → ✅ **STRONG_BUY**
- **After refresh:** 0.56 >= 0.5 but < 0.7 → ❌ **BUY** (WRONG!)

Every time prices were refreshed, RACC's recommendation would incorrectly change from STRONG_BUY to BUY.

---

## Solution

Updated `refresh_prices()` to use the **same thresholds** as `fetch_all_egx_stocks()`:

```python
# ✅ CORRECT - Consistent thresholds
if rec_value > 0.5:
    stock.recommendation = "STRONG_BUY"
elif rec_value > 0.1:
    stock.recommendation = "BUY"
elif rec_value < -0.5:
    stock.recommendation = "STRONG_SELL"
elif rec_value < -0.1:
    stock.recommendation = "SELL"
else:
    stock.recommendation = "NEUTRAL"
```

---

## Unified Recommendation Thresholds

Now **all methods** use the same thresholds:

| Score Range | Recommendation | Example Stocks |
|-------------|----------------|----------------|
| **> 0.5** | **STRONG_BUY** | RACC (0.56), TMGH, HRHO |
| **0.1 to 0.5** | **BUY** | COMI, ORWE, SWDY |
| **-0.1 to 0.1** | **NEUTRAL** | - |
| **-0.5 to -0.1** | **SELL** | PHDC |
| **< -0.5** | **STRONG_SELL** | - |

---

## Verification Results

After applying the fix and refreshing:

```
=== RACC Stock ===
Symbol: RACC
Name: Raya Contact Center
Price: 10.68 EGP
Recommendation: STRONG_BUY ✅ (was showing BUY before)
Change: +7.12%
```

### Sample of Other Stocks
```
Symbol     Recommendation  Change %
-----------------------------------
COMI       BUY             +0.86%
ORWE       BUY             +0.22%
TMGH       STRONG_BUY      +2.76%
HRHO       STRONG_BUY      +2.13%
PHDC       SELL            -1.22%
SWDY       BUY             +0.88%
```

All recommendations now correctly reflect the TradingView scores!

---

## Files Modified

**File:** `/backend/app/services/tradingview_service.py`

**Location:** Line 349-361 in `refresh_prices()` method

**Change:** Updated recommendation threshold logic to match `fetch_all_egx_stocks()`

---

## Impact

### Before Fix
- ❌ Inconsistent recommendations between initial fetch and refresh
- ❌ Stocks would change recommendation categories without score changes
- ❌ RACC incorrectly showing BUY instead of STRONG_BUY

### After Fix
- ✅ Consistent recommendations across all methods
- ✅ Recommendations only change when TradingView score changes
- ✅ RACC correctly showing STRONG_BUY
- ✅ All stocks now use unified, predictable thresholds

---

## Testing Performed

- ✅ RACC now shows STRONG_BUY (was BUY)
- ✅ Verified other stocks have correct recommendations
- ✅ Confirmed thresholds are consistent across all 3 methods:
  - `fetch_all_egx_stocks()`
  - `get_stock_data()`
  - `refresh_prices()`
- ✅ Multiple refresh operations maintain correct recommendations

---

## Summary

Fixed the inconsistent recommendation thresholds that caused RACC (and potentially other stocks) to show incorrect recommendations after price refresh. Now all methods use the same unified thresholds where **> 0.5 = STRONG_BUY**.

**Status:** ✅ RESOLVED

