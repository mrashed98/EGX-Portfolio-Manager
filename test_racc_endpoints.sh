#!/bin/bash

# Comprehensive RACC Stock API Endpoint Test
# Tests all endpoints and validates returned data

echo "======================================================================"
echo "               RACC Stock API Endpoint Test Suite"
echo "======================================================================"
echo ""

# Get authentication token
echo "🔐 Authenticating..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo "✅ Authentication successful"
echo ""

STOCK_ID=115

# Test 1: Stock Details
echo "======================================================================"
echo "TEST 1: Stock Details"
echo "======================================================================"
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/stocks/$STOCK_ID")
echo "$RESPONSE" | python3 << 'EOF'
import sys, json
data = json.load(sys.stdin)
print(f"✅ Symbol: {data.get('symbol', 'N/A')}")
print(f"✅ Name: {data.get('name', 'N/A')}")
print(f"✅ Price: {data.get('current_price', 'N/A')} EGP")
print(f"✅ Change: {data.get('change', 0):+.2f} ({data.get('change_percent', 0):+.2f}%)")
print(f"✅ Volume: {data.get('volume', 0):,.0f}")
print(f"✅ Sector: {data.get('sector', 'N/A')}")
print(f"✅ Industry: {data.get('industry', 'N/A')}")
print(f"✅ Recommendation: {data.get('recommendation', 'N/A')}")
print(f"✅ Logo URL: {data.get('logo_url', 'N/A')}")
EOF
echo ""

# Test 2: Stock Metrics
echo "======================================================================"
echo "TEST 2: Stock Metrics"
echo "======================================================================"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/stocks/$STOCK_ID/metrics" | python3 << 'EOF'
import sys, json
data = json.load(sys.stdin)
metrics = data.get('metrics', {})
print(f"✅ Market Cap: {metrics.get('market_cap', 'N/A'):,.0f}" if metrics.get('market_cap') else "⚠️  Market Cap: N/A")
print(f"✅ P/E Ratio: {metrics.get('pe_ratio', 'N/A')}" if metrics.get('pe_ratio') else "⚠️  P/E Ratio: N/A (EGX limitation)")
print(f"✅ EPS (TTM): {metrics.get('eps_ttm', 'N/A')}" if metrics.get('eps_ttm') else "⚠️  EPS (TTM): N/A (EGX limitation)")
print(f"✅ Beta: {metrics.get('beta', 'N/A'):.2f}" if metrics.get('beta') else "⚠️  Beta: N/A")
print(f"✅ P/B Ratio: {metrics.get('price_to_book', 'N/A'):.2f}" if metrics.get('price_to_book') else "⚠️  P/B Ratio: N/A")
print(f"✅ Debt/Equity: {metrics.get('debt_to_equity', 'N/A'):.2f}" if metrics.get('debt_to_equity') else "⚠️  Debt/Equity: N/A")
print(f"✅ Current Ratio: {metrics.get('current_ratio', 'N/A'):.2f}" if metrics.get('current_ratio') else "⚠️  Current Ratio: N/A")
print(f"✅ Quick Ratio: {metrics.get('quick_ratio', 'N/A'):.2f}" if metrics.get('quick_ratio') else "⚠️  Quick Ratio: N/A")
print(f"✅ Dividend Yield: {metrics.get('dividend_yield', 'N/A'):.2%}" if metrics.get('dividend_yield') is not None else "⚠️  Dividend Yield: N/A")
EOF
echo ""

# Test 3: Historical Data
echo "======================================================================"
echo "TEST 3: Historical Data"
echo "======================================================================"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/stocks/$STOCK_ID/history?interval=1d&bars=5" | python3 << 'EOF'
import sys, json
data = json.load(sys.stdin)
history = data.get('data', [])
print(f"✅ Retrieved {len(history)} historical data points")
if len(history) > 0:
    latest = history[-1]
    print(f"✅ Latest date: {latest.get('date', 'N/A')}")
    print(f"✅ OHLC: O={latest.get('open'):.2f}, H={latest.get('high'):.2f}, L={latest.get('low'):.2f}, C={latest.get('close'):.2f}")
    print(f"✅ Volume: {latest.get('volume'):,.0f}")
EOF
echo ""

# Test 4: Technical Indicators
echo "======================================================================"
echo "TEST 4: Technical Indicators"
echo "======================================================================"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/stocks/$STOCK_ID/indicators?timeframe=1d" | python3 << 'EOF'
import sys, json
data = json.load(sys.stdin)
indicators = data.get('indicators', {})
count = data.get('count', 0)
print(f"✅ Retrieved {count} technical indicators")
if indicators:
    print(f"✅ RSI: {indicators.get('RSI', 'N/A'):.2f}" if indicators.get('RSI') else "⚠️  RSI: N/A")
    print(f"✅ MACD: {indicators.get('MACD.macd', 'N/A'):.2f}" if indicators.get('MACD.macd') else "⚠️  MACD: N/A")
    print(f"✅ SMA20: {indicators.get('SMA20', 'N/A'):.2f}" if indicators.get('SMA20') else "⚠️  SMA20: N/A")
    print(f"✅ SMA50: {indicators.get('SMA50', 'N/A'):.2f}" if indicators.get('SMA50') else "⚠️  SMA50: N/A")
    print(f"✅ EMA20: {indicators.get('EMA20', 'N/A'):.2f}" if indicators.get('EMA20') else "⚠️  EMA20: N/A")
    print(f"✅ ADX: {indicators.get('ADX', 'N/A'):.2f}" if indicators.get('ADX') else "⚠️  ADX: N/A")
EOF
echo ""

# Test 5: Trading Ideas
echo "======================================================================"
echo "TEST 5: Trading Ideas"
echo "======================================================================"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/stocks/$STOCK_ID/ideas" | python3 << 'EOF'
import sys, json
data = json.load(sys.stdin)
ideas = data.get('ideas', [])
print(f"✅ Retrieved {len(ideas)} trading ideas")
if len(ideas) > 0:
    for i, idea in enumerate(ideas[:3], 1):
        print(f"\n  Idea {i}:")
        print(f"    Title: {idea.get('title', 'N/A')}")
        print(f"    Strategy: {idea.get('idea_strategy', 'N/A')}")
        print(f"    Author: {idea.get('author', 'N/A')}")
        print(f"    Boosts: {idea.get('boosts_count', 0)}")
else:
    print("⚠️  No trading ideas found (normal for some stocks)")
EOF
echo ""

# Test 6: News Headlines
echo "======================================================================"
echo "TEST 6: News Headlines"
echo "======================================================================"
NEWS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/stocks/$STOCK_ID/news?limit=3")
echo "$NEWS_RESPONSE" | python3 << 'EOF'
import sys, json
from datetime import datetime
data = json.load(sys.stdin)
news = data.get('news', [])
print(f"✅ Retrieved {len(news)} news items")
if len(news) > 0:
    for i, article in enumerate(news, 1):
        timestamp = article.get('published', 0)
        date = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M')
        print(f"\n  Article {i}:")
        print(f"    Title: {article.get('title', 'N/A')}")
        print(f"    Source: {article.get('source', 'N/A')}")
        print(f"    Published: {date}")
        print(f"    Story Path: {article.get('storyPath', 'N/A')[:60]}...")
else:
    print("⚠️  No news found")
EOF

# Extract story path for content test
STORY_PATH=$(echo "$NEWS_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['news'][0]['storyPath']) if data.get('news') else print('')" 2>/dev/null)
echo ""

# Test 7: News Content
if [ ! -z "$STORY_PATH" ]; then
    echo "======================================================================"
    echo "TEST 7: News Content"
    echo "======================================================================"
    STORY_PATH_CLEAN=$(echo "$STORY_PATH" | sed 's|^/||')
    echo "Fetching content for: $STORY_PATH"
    curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/stocks/news/${STORY_PATH_CLEAN}/content" | python3 << 'EOF'
import sys, json
try:
    data = json.load(sys.stdin)
    if 'detail' in data:
        print(f"❌ Error: {data['detail']}")
    else:
        content = data.get('content', {})
        title = content.get('title', 'N/A')
        body = content.get('body', [])
        published = content.get('published_datetime', 'N/A')
        print(f"✅ Title: {title}")
        print(f"✅ Published: {published}")
        print(f"✅ Body items: {len(body)}")
        if body:
            print(f"✅ Sample content: {str(body[0])[:100]}...")
except Exception as e:
    print(f"❌ Error parsing response: {e}")
EOF
    echo ""
fi

echo "======================================================================"
echo "                        Test Summary"
echo "======================================================================"
echo "All endpoint tests completed for RACC stock (ID: $STOCK_ID)"
echo "======================================================================"

