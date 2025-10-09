import asyncio
from typing import List, Dict
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from tradingview_screener import Query
import logging

from app.models.stock import Stock

logger = logging.getLogger(__name__)


class TradingViewService:
    def __init__(self):
        self.initialized = False
    
    async def fetch_all_egx_stocks(self) -> List[Dict]:
        """Fetch all EGX stocks using tradingview_screener"""
        try:
            logger.info("Fetching all EGX stocks from TradingView screener...")
            
            # Create query for EGX (Egyptian Exchange) stocks
            # Select useful fields including logoid for logo URL construction
            count, df = (Query()
                .set_markets('egypt')  # Filter by Egyptian market
                .select(
                    'name',          # Ticker symbol (e.g., "ORWE")
                    'description',   # Company name (e.g., "Oriental Weavers")
                    'close',         # Current price
                    'open',          # Open price
                    'high',          # High price
                    'low',           # Low price
                    'volume',        # Trading volume
                    'change',        # Price change
                    'change_abs',    # Absolute change
                    'Recommend.All', # Overall recommendation (-1 to 1)
                    'logoid',        # Logo ID for constructing URL
                    'sector',        # Business sector
                    'industry',      # Industry classification
                    'market_cap_basic',  # Market capitalization
                    'exchange'       # Exchange name
                )
                .order_by('market_cap_basic', ascending=False)  # Largest companies first
                .limit(500)  # Get up to 200 stocks
                .get_scanner_data())
            
            if df is None or df.empty:
                logger.error("No data returned from TradingView screener")
                return []
            
            # Convert DataFrame to list of dictionaries
            stocks = []
            for _, row in df.iterrows():
                symbol = row.get('name', '')  # name = ticker
                description = row.get('description', symbol)  # description = company name
                logoid = row.get('logoid', '')
                
                # Construct logo URL from logoid
                logo_url = None
                if logoid:
                    logo_url = f"https://s3-symbol-logo.tradingview.com/{logoid}.svg"
                
                # Get price data
                close_price = float(row.get('close', 0.0)) if row.get('close') else 0.0
                change_abs = float(row.get('change_abs', 0.0)) if row.get('change_abs') else 0.0
                
                # Calculate change_percent
                change_percent = (change_abs / close_price * 100) if close_price > 0 else 0.0
                
                # Map recommendation value (-1 to 1) to text
                recommend_val = float(row.get('Recommend.All', 0)) if row.get('Recommend.All') else 0
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
                
                stocks.append({
                    "symbol": symbol,
                    "name": description,  # Use description as company name
                    "exchange": "EGX",
                    "price": close_price,
                    "open": float(row.get('open', 0.0)) if row.get('open') else None,
                    "high": float(row.get('high', 0.0)) if row.get('high') else None,
                    "low": float(row.get('low', 0.0)) if row.get('low') else None,
                    "volume": float(row.get('volume', 0.0)) if row.get('volume') else None,
                    "change": change_abs,
                    "change_percent": change_percent,
                    "recommendation": recommendation,
                    "logo": logo_url,
                    "sector": row.get('sector', ''),
                    "industry": row.get('industry', ''),
                    "market_cap": float(row.get('market_cap_basic', 0.0)) if row.get('market_cap_basic') else 0.0,
                })
            
            logger.info(f"Successfully fetched {len(stocks)} EGX stocks from TradingView")
            return stocks
            
        except Exception as e:
            logger.error(f"Error fetching EGX stocks from TradingView: {str(e)}")
            return []
    
    async def get_stock_price(self, symbol: str, exchange: str = "EGX") -> float:
        """Get current stock price for a specific symbol"""
        try:
            count, df = (Query()
                .set_markets('egypt')
                .select('name', 'close')
                .where(Query.col('name') == symbol)
                .limit(1)
                .get_scanner_data())
            
            if df is not None and not df.empty:
                return float(df['close'].iloc[0])
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return 0.0
    
    async def get_stock_data(self, symbol: str, exchange: str = "EGX") -> Dict:
        """Get comprehensive stock data for a specific symbol"""
        try:
            count, df = (Query()
                .set_markets('egypt')
                .select(
                    'name',
                    'description',
                    'close',
                    'open',
                    'high',
                    'low',
                    'volume',
                    'change',
                    'change_abs',
                    'Recommend.All',  # Overall recommendation
                    'sector',
                    'industry',
                    'market_cap_basic'
                )
                .where(Query.col('name') == symbol)
                .limit(1)
                .get_scanner_data())
            
            if df is None or df.empty:
                return {}
            
            row = df.iloc[0]
            
            # Calculate change percentage
            close_price = float(row.get('close', 0))
            change_abs = float(row.get('change_abs', 0)) if row.get('change_abs') else 0
            change_percent = (change_abs / close_price * 100) if close_price > 0 else 0
            
            # Map recommendation value (-1 to 1) to text
            recommend_val = float(row.get('Recommend.All', 0)) if row.get('Recommend.All') else 0
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
            
            return {
                "price": close_price,
                "open": float(row.get('open', 0)) if row.get('open') else None,
                "high": float(row.get('high', 0)) if row.get('high') else None,
                "low": float(row.get('low', 0)) if row.get('low') else None,
                "volume": float(row.get('volume', 0)) if row.get('volume') else None,
                "change": change_abs,
                "change_percent": change_percent,
                "recommendation": recommendation,
                "sector": row.get('sector', ''),
                "industry": row.get('industry', ''),
            }
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {str(e)}")
            return {}
    
    def _generate_logo_url(self, symbol: str) -> str:
        """Generate a color-coded fallback logo URL for a stock symbol"""
        colors = [
            "0D47A1", "1976D2", "388E3C", "7B1FA2", "C2185B",
            "F57C00", "0097A7", "00796B", "E64A19", "5D4037",
            "455A64", "1565C0", "2E7D32", "6A1B9A", "AD1457"
        ]
        color_index = hash(symbol) % len(colors)
        color = colors[color_index]
        
        return f"https://ui-avatars.com/api/?name={symbol}&background={color}&color=fff&size=128&bold=true&font-size=0.4"
    
    async def initialize_egx_stocks(self, db: AsyncSession):
        """Initialize EGX stocks in the database on first run"""
        if self.initialized:
            return
        
        # Check if we already have stocks
        result = await db.execute(select(Stock).limit(1))
        existing_stock = result.scalar_one_or_none()
        
        if existing_stock:
            self.initialized = True
            return
        
        logger.info("Initializing EGX stocks from TradingView screener...")
        
        # Fetch all EGX stocks
        stock_list = await self.fetch_all_egx_stocks()
        
        if not stock_list:
            logger.error("Failed to fetch stocks from TradingView, using fallback list")
            # Minimal fallback list
            stock_list = [
                {"symbol": "COMI", "name": "Commercial International Brokerage", "exchange": "EGX", "price": 100.0, "logo": None},
                {"symbol": "ORWE", "name": "Oriental Weavers", "exchange": "EGX", "price": 100.0, "logo": None},
            ]
        
        logger.info(f"Initializing {len(stock_list)} EGX stocks...")
        
        for stock_data in stock_list:
            symbol = stock_data["symbol"]
            name = stock_data["name"]
            price = stock_data.get("price", 0.0)
            logo = stock_data.get("logo")
            sector = stock_data.get("sector")
            industry = stock_data.get("industry")
            
            # If price is 0, try to fetch it
            if price == 0.0:
                logger.info(f"Fetching price for {symbol}...")
                price = await self.get_stock_price(symbol)
                
                if price == 0.0:
                    logger.warning(f"Failed to fetch price for {symbol}, using default")
                    price = 100.0
            
            # Use logo from fetch, or generate fallback
            logo_url = logo if logo else self._generate_logo_url(symbol)
            
            stock = Stock(
                symbol=symbol,
                name=name,
                exchange="EGX",
                current_price=price,
                logo_url=logo_url,
                sector=sector,
                industry=industry,
                open_price=stock_data.get("open"),
                high_price=stock_data.get("high"),
                low_price=stock_data.get("low"),
                volume=stock_data.get("volume"),
                change=stock_data.get("change"),
                change_percent=stock_data.get("change_percent"),
                recommendation=stock_data.get("recommendation"),
                last_updated=datetime.utcnow()
            )
            db.add(stock)
        
        await db.commit()
        logger.info(f"Successfully initialized {len(stock_list)} EGX stocks")
        self.initialized = True
    
    async def refresh_prices(self, db: AsyncSession):
        """Refresh all stock prices from TradingView"""
        result = await db.execute(select(Stock))
        stocks = result.scalars().all()
        
        logger.info(f"Refreshing prices for {len(stocks)} stocks from TradingView...")
        
        # Fetch all prices at once (more efficient)
        try:
            symbols = [stock.symbol for stock in stocks]
            
            count, df = (Query()
                .set_markets('egypt')
                .select('name', 'close')
                .where(Query.col('name').isin(symbols))
                .limit(500)
                .get_scanner_data())
            
            if df is not None and not df.empty:
                # Create a price map
                price_map = dict(zip(df['name'], df['close']))
                
                # Update stocks
                updated_count = 0
                for stock in stocks:
                    if stock.symbol in price_map:
                        new_price = float(price_map[stock.symbol])
                        if new_price > 0:
                            stock.current_price = new_price
                            stock.last_updated = datetime.utcnow()
                            updated_count += 1
                
                logger.info(f"Updated prices for {updated_count} stocks")
            else:
                logger.warning("No price data returned from TradingView")
            
        except Exception as e:
            logger.error(f"Error refreshing prices: {str(e)}")
        
        await db.commit()
        logger.info("Price refresh completed")
    
    async def start_periodic_refresh(self, db: AsyncSession, interval: int = 300):
        """Start periodic price refresh (default: every 5 minutes)"""
        logger.info(f"Starting periodic price refresh (every {interval} seconds)")
        while True:
            await asyncio.sleep(interval)
            try:
                await self.refresh_prices(db)
            except Exception as e:
                logger.error(f"Error in periodic refresh: {str(e)}")
    
    async def search_stocks_by_query(self, query: str) -> List[Dict]:
        """Search for stocks on TradingView by symbol or company name"""
        try:
            logger.info(f"Searching TradingView for: {query}")
            
            # Fetch more stocks and filter by query
            count, df = (Query()
                .set_markets('egypt')
                .select(
                    'name',          # Ticker symbol
                    'description',   # Company name
                    'close',         # Current price
                    'open',
                    'high',
                    'low',
                    'volume',
                    'change',
                    'change_abs',
                    'Recommend.All',
                    'logoid',
                    'sector',
                    'industry',
                    'market_cap_basic'
                )
                .order_by('market_cap_basic', ascending=False)
                .limit(500)  # Get all stocks to search through
                .get_scanner_data())
            
            if df is None or df.empty:
                logger.warning(f"No results found from TradingView")
                return []
            
            # Filter by query
            query_lower = query.lower()
            results = []
            
            for _, row in df.iterrows():
                symbol = row.get('name', '')
                description = row.get('description', symbol)
                
                # Match query against symbol or company name
                if (query_lower in symbol.lower() or 
                    query_lower in description.lower()):
                    
                    logoid = row.get('logoid', '')
                    logo_url = f"https://s3-symbol-logo.tradingview.com/{logoid}.svg" if logoid else None
                    
                    close_price = float(row.get('close', 0.0)) if row.get('close') else 0.0
                    change_abs = float(row.get('change_abs', 0.0)) if row.get('change_abs') else 0.0
                    change_percent = (change_abs / close_price * 100) if close_price > 0 else 0.0
                    
                    # Map recommendation
                    recommend_val = float(row.get('Recommend.All', 0)) if row.get('Recommend.All') else 0
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
                    
                    # Clean the stock name
                    clean_name = description
                    # Remove ticker if duplicated in name
                    import re
                    clean_name = re.sub(rf'^{re.escape(symbol)}\s*[-:]\s*', '', clean_name, flags=re.IGNORECASE)
                    clean_name = re.sub(rf'\s*[-:]\s*{re.escape(symbol)}$', '', clean_name, flags=re.IGNORECASE)
                    clean_name = re.sub(rf'\s*[\(\[]{re.escape(symbol)}[\)\]]', '', clean_name, flags=re.IGNORECASE)
                    clean_name = clean_name.strip() if clean_name.strip() else description
                    
                    results.append({
                        "symbol": symbol,
                        "name": clean_name,
                        "exchange": "EGX",
                        "price": close_price,
                        "open": float(row.get('open', 0.0)) if row.get('open') else None,
                        "high": float(row.get('high', 0.0)) if row.get('high') else None,
                        "low": float(row.get('low', 0.0)) if row.get('low') else None,
                        "volume": float(row.get('volume', 0.0)) if row.get('volume') else None,
                        "change": change_abs,
                        "change_percent": change_percent,
                        "recommendation": recommendation,
                        "logo": logo_url,
                        "sector": row.get('sector', ''),
                        "industry": row.get('industry', ''),
                    })
            
            logger.info(f"Found {len(results)} stocks matching '{query}'")
            return results
            
        except Exception as e:
            logger.error(f"Error searching stocks: {str(e)}")
            return []
    
    async def fetch_single_stock_data(self, symbol: str) -> Dict | None:
        """Fetch complete data for a single stock from TradingView"""
        try:
            logger.info(f"Fetching data for stock: {symbol}")
            
            # Search for the exact stock
            results = await self.search_stocks_by_query(symbol)
            
            # Find exact match
            for stock in results:
                if stock["symbol"].upper() == symbol.upper():
                    return stock
            
            # If no exact match, return first result if available
            if results:
                logger.warning(f"No exact match for {symbol}, returning closest match: {results[0]['symbol']}")
                return results[0]
            
            logger.error(f"Stock {symbol} not found on TradingView")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching stock {symbol}: {str(e)}")
            return None


tradingview_service = TradingViewService()
