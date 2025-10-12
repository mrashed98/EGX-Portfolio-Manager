"""
TradingView Service - Refactored to properly utilize three TradingView packages

Package Usage:
1. tradingview_screener: Latest prices, recommendations, filters, real-time streaming
2. tvdatafeed: Historical OHLCV data ONLY
3. tradingview_scraper: Ideas, news, technical indicators, calendar events
"""

import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import os
import re
import pandas as pd

# Package imports
from tradingview_screener import Query, col
from tvDatafeed import TvDatafeed, Interval as TvInterval
from tradingview_scraper.symbols.ideas import Ideas
from tradingview_scraper.symbols.technicals import Indicators
from tradingview_scraper.symbols.news import NewsScraper
from tradingview_scraper.symbols.cal import CalendarScraper

from app.models.stock import Stock

logger = logging.getLogger(__name__)


class TradingViewService:
    """
    Service for interacting with TradingView APIs using three specialized packages.
    
    Features:
    - Real-time stock prices and recommendations (tradingview_screener)
    - Historical OHLCV data (tvdatafeed)
    - Trading ideas, news, and technical indicators (tradingview_scraper)
    """
    
    def __init__(self):
        self.initialized = False
        self.cookies = self._load_cookies()
        
        # Initialize tvdatafeed for historical data (without login by default)
        try:
            self.tv = TvDatafeed()
            logger.info("TvDatafeed initialized successfully (no login)")
        except Exception as e:
            logger.error(f"Failed to initialize tvdatafeed: {str(e)}")
            self.tv = None
    
    def test_credentials(self, username: str, password: str) -> tuple[bool, str]:
        """
        Test TradingView credentials by attempting to authenticate.
        
        Args:
            username: TradingView username
            password: TradingView password
        
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            # Try to initialize TvDatafeed with credentials
            test_tv = TvDatafeed(username=username, password=password)
            
            # Test by fetching a simple stock data to verify connection
            # Try to get 1 day of data for a common stock
            test_data = test_tv.get_hist(
                symbol='COMI',
                exchange='EGX',
                interval=TvInterval.in_daily,
                n_bars=1
            )
            
            if test_data is not None and not test_data.empty:
                logger.info(f"TradingView credentials verified for user: {username}")
                return True, "Connection successful - credentials verified"
            else:
                logger.warning(f"TradingView authentication succeeded but no data returned for user: {username}")
                return True, "Authentication successful but unable to fetch test data"
                
        except Exception as e:
            error_msg = str(e).lower()
            
            # Check for common authentication errors
            if 'invalid' in error_msg or 'incorrect' in error_msg or 'wrong' in error_msg:
                logger.error(f"Invalid TradingView credentials for user: {username}")
                return False, "Invalid username or password"
            elif 'timeout' in error_msg or 'connection' in error_msg:
                logger.error(f"Connection timeout testing TradingView credentials: {str(e)}")
                return False, "Connection timeout - please try again"
            else:
                logger.error(f"Error testing TradingView credentials: {str(e)}")
                return False, f"Authentication failed: {str(e)}"
    
    def initialize_with_credentials(self, username: str, password: str) -> bool:
        """
        Initialize TvDatafeed with user credentials for enhanced data access.
        
        Args:
            username: TradingView username
            password: TradingView password
        
        Returns:
            bool: True if initialization successful
        """
        try:
            self.tv = TvDatafeed(username=username, password=password)
            logger.info(f"TvDatafeed initialized with credentials for user: {username}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize TvDatafeed with credentials: {str(e)}")
            # Fallback to no-login mode
            self.tv = TvDatafeed()
            return False
    
    def _load_cookies(self) -> Optional[Dict]:
        """
        Load TradingView session cookies for real-time data access.
        
        Cookies can be provided via environment variable TRADINGVIEW_SESSION_ID.
        To get your session ID:
        1. Go to TradingView.com and log in
        2. Open developer tools (F12)
        3. Go to Application > Cookies > https://www.tradingview.com/
        4. Copy the value of 'sessionid'
        5. Set environment variable: TRADINGVIEW_SESSION_ID=your_session_id
        
        Returns:
            Dict with sessionid or None if not configured
        """
        session_id = os.getenv('TRADINGVIEW_SESSION_ID')
        
        if session_id:
            logger.info("TradingView session cookie loaded - real-time data enabled")
            return {'sessionid': session_id}
        else:
            logger.warning("No TradingView session cookie - using delayed data")
            logger.info("To enable real-time data, set TRADINGVIEW_SESSION_ID environment variable")
            return None
    
    # ========================================
    # SECTION 1: tradingview_screener
    # Purpose: Latest prices, recommendations, filters, real-time streaming
    # ========================================
    
    async def fetch_all_egx_stocks(self) -> List[Dict]:
        """
        Fetch all EGX stocks using tradingview_screener with real-time data.
        Uses cookies for authenticated streaming access if available.
        """
        try:
            logger.info("Fetching all EGX stocks from TradingView screener...")
            
            # Select fields that work with EGX market (tested in Phase 1)
            count, df = (Query()
                .set_markets('egypt')
                .select(
                    'name', 'description', 'close', 'open', 'high', 'low', 'volume',
                    'change', 'change_abs', 'Recommend.All', 'logoid',
                    'sector', 'industry', 'market_cap_basic',
                    'price_earnings_ttm', 'earnings_per_share_basic_ttm',
                    'beta_1_year', 'return_on_equity', 'debt_to_equity',
                    'current_ratio', 'quick_ratio', 'earnings_per_share_fq',
                    'dividends_yield_current', 'price_book_fq',
                    'return_on_assets', 'return_on_invested_capital'
                )
                .order_by('market_cap_basic', ascending=False)
                .limit(500)
                .get_scanner_data(cookies=self.cookies))
            
            if df is None or df.empty:
                logger.error("No data returned from TradingView screener")
                return []
            
            # Convert DataFrame to list of dictionaries
            stocks = []
            for _, row in df.iterrows():
                symbol = row.get('name', '')
                description = row.get('description', symbol)
                logoid = row.get('logoid', '')
                
                # Construct logo URL from logoid
                logo_url = f"https://s3-symbol-logo.tradingview.com/{logoid}.svg" if logoid else None
                
                # Get price data
                close_price = float(row.get('close', 0.0)) if pd.notna(row.get('close')) else 0.0
                change_abs = float(row.get('change_abs', 0.0)) if pd.notna(row.get('change_abs')) else 0.0
                
                # Calculate change_percent
                change_percent = (change_abs / close_price * 100) if close_price > 0 else 0.0
                
                # Map recommendation value (-1 to 1) to text
                recommend_val = float(row.get('Recommend.All', 0)) if pd.notna(row.get('Recommend.All')) else 0
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
                    "name": description,
                    "exchange": "EGX",
                    "price": close_price,
                    "open": float(row.get('open', 0.0)) if pd.notna(row.get('open')) else None,
                    "high": float(row.get('high', 0.0)) if pd.notna(row.get('high')) else None,
                    "low": float(row.get('low', 0.0)) if pd.notna(row.get('low')) else None,
                    "volume": float(row.get('volume', 0.0)) if pd.notna(row.get('volume')) else None,
                    "change": change_abs,
                    "change_percent": change_percent,
                    "recommendation": recommendation,
                    "logo": logo_url,
                    "sector": row.get('sector', ''),
                    "industry": row.get('industry', ''),
                    "market_cap": float(row.get('market_cap_basic', 0.0)) if pd.notna(row.get('market_cap_basic')) else 0.0,
                    "pe_ratio": float(row.get('price_earnings_ttm', 0.0)) if pd.notna(row.get('price_earnings_ttm')) else None,
                    "eps": float(row.get('earnings_per_share_basic_ttm', 0.0)) if pd.notna(row.get('earnings_per_share_basic_ttm')) else None,
                    "dividend_yield": float(row.get('dividends_yield_current', 0.0)) if pd.notna(row.get('dividends_yield_current')) else None,
                    "beta": float(row.get('beta_1_year', 0.0)) if pd.notna(row.get('beta_1_year')) else None,
                    "price_to_book": float(row.get('price_book_fq', 0.0)) if pd.notna(row.get('price_book_fq')) else None,
                    "roe": float(row.get('return_on_equity', 0.0)) if pd.notna(row.get('return_on_equity')) else None,
                    "debt_to_equity": float(row.get('debt_to_equity', 0.0)) if pd.notna(row.get('debt_to_equity')) else None,
                    "current_ratio": float(row.get('current_ratio', 0.0)) if pd.notna(row.get('current_ratio')) else None,
                    "quick_ratio": float(row.get('quick_ratio', 0.0)) if pd.notna(row.get('quick_ratio')) else None,
                })
            
            logger.info(f"Successfully fetched {len(stocks)} EGX stocks from TradingView")
            return stocks
            
        except Exception as e:
            logger.error(f"Error fetching EGX stocks from TradingView: {str(e)}")
            return []
    
    async def get_stock_price(self, symbol: str, exchange: str = "EGX") -> float:
        """Get current stock price for a specific symbol using tradingview_screener"""
        try:
            count, df = (Query()
                .set_markets('egypt')
                .select('name', 'close')
                .where(col('name') == symbol)
                .limit(1)
                .get_scanner_data(cookies=self.cookies))
            
            if df is not None and not df.empty:
                return float(df['close'].iloc[0])
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return 0.0
    
    async def get_stock_data(self, symbol: str, exchange: str = "EGX") -> Dict:
        """Get comprehensive stock data for a specific symbol using tradingview_screener"""
        try:
            count, df = (Query()
                .set_markets('egypt')
                .select(
                    'name', 'description', 'close', 'open', 'high', 'low', 'volume',
                    'change', 'change_abs', 'Recommend.All', 'sector', 'industry',
                    'market_cap_basic'
                )
                .where(col('name') == symbol)
                .limit(1)
                .get_scanner_data(cookies=self.cookies))
            
            if df is None or df.empty:
                return {}
            
            row = df.iloc[0]
            
            # Calculate change percentage
            close_price = float(row.get('close', 0))
            change_abs = float(row.get('change_abs', 0)) if pd.notna(row.get('change_abs')) else 0
            change_percent = (change_abs / close_price * 100) if close_price > 0 else 0
            
            # Map recommendation value (-1 to 1) to text
            recommend_val = float(row.get('Recommend.All', 0)) if pd.notna(row.get('Recommend.All')) else 0
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
                "open": float(row.get('open', 0)) if pd.notna(row.get('open')) else None,
                "high": float(row.get('high', 0)) if pd.notna(row.get('high')) else None,
                "low": float(row.get('low', 0)) if pd.notna(row.get('low')) else None,
                "volume": float(row.get('volume', 0)) if pd.notna(row.get('volume')) else None,
                "change": change_abs,
                "change_percent": change_percent,
                "recommendation": recommendation,
                "sector": row.get('sector', ''),
                "industry": row.get('industry', ''),
            }
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {str(e)}")
            return {}
    
    async def get_stock_metrics(self, symbol: str) -> Dict:
        """
        Get fundamental metrics for a stock using tradingview_screener.
        Returns comprehensive financial metrics for display on stock details page.
        """
        try:
            count, df = (Query()
                .set_markets('egypt')
                .select(
                    'name', 'market_cap_basic', 'price_earnings_ttm',
                    'earnings_per_share_basic_ttm', 'earnings_per_share_fq',
                    'dividends_yield_current', 'beta_1_year', 'price_book_fq',
                    'return_on_equity', 'debt_to_equity', 'current_ratio',
                    'quick_ratio', 'return_on_assets', 'return_on_invested_capital'
                )
                .where(col('name') == symbol)
                .limit(1)
                .get_scanner_data(cookies=self.cookies))
            
            if df is None or df.empty:
                return {}
            
            row = df.iloc[0]
            
            return {
                "market_cap": float(row.get('market_cap_basic', 0)) if pd.notna(row.get('market_cap_basic')) else None,
                "pe_ratio": float(row.get('price_earnings_ttm', 0)) if pd.notna(row.get('price_earnings_ttm')) else None,
                "eps_ttm": float(row.get('earnings_per_share_basic_ttm', 0)) if pd.notna(row.get('earnings_per_share_basic_ttm')) else None,
                "eps_fq": float(row.get('earnings_per_share_fq', 0)) if pd.notna(row.get('earnings_per_share_fq')) else None,
                "dividend_yield": float(row.get('dividends_yield_current', 0)) if pd.notna(row.get('dividends_yield_current')) else None,
                "beta": float(row.get('beta_1_year', 0)) if pd.notna(row.get('beta_1_year')) else None,
                "price_to_book": float(row.get('price_book_fq', 0)) if pd.notna(row.get('price_book_fq')) else None,
                "roe": float(row.get('return_on_equity', 0)) if pd.notna(row.get('return_on_equity')) else None,
                "roa": float(row.get('return_on_assets', 0)) if pd.notna(row.get('return_on_assets')) else None,
                "roic": float(row.get('return_on_invested_capital', 0)) if pd.notna(row.get('return_on_invested_capital')) else None,
                "debt_to_equity": float(row.get('debt_to_equity', 0)) if pd.notna(row.get('debt_to_equity')) else None,
                "current_ratio": float(row.get('current_ratio', 0)) if pd.notna(row.get('current_ratio')) else None,
                "quick_ratio": float(row.get('quick_ratio', 0)) if pd.notna(row.get('quick_ratio')) else None,
            }
            
        except Exception as e:
            logger.error(f"Error fetching metrics for {symbol}: {str(e)}")
            return {}
    
    async def refresh_prices(self, db: AsyncSession):
        """Refresh all stock prices and OHLC data from TradingView using tradingview_screener"""
        result = await db.execute(select(Stock))
        stocks = result.scalars().all()
        
        logger.info(f"Refreshing prices for {len(stocks)} stocks from TradingView...")
        
        try:
            symbols = [stock.symbol for stock in stocks]
            
            # Fetch comprehensive price data including OHLC and fundamentals
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
            
            if df is not None and not df.empty:
                # Update stocks with full OHLC data
                updated_count = 0
                for stock in stocks:
                    if stock.symbol in df['name'].values:
                        stock_data = df[df['name'] == stock.symbol].iloc[0]
                        
                        # Update OHLC prices
                        if pd.notna(stock_data['close']) and stock_data['close'] > 0:
                            stock.current_price = float(stock_data['close'])
                        
                        if pd.notna(stock_data['open']):
                            stock.open_price = float(stock_data['open']) if stock_data['open'] > 0 else None
                        
                        if pd.notna(stock_data['high']):
                            stock.high_price = float(stock_data['high']) if stock_data['high'] > 0 else None
                        
                        if pd.notna(stock_data['low']):
                            stock.low_price = float(stock_data['low']) if stock_data['low'] > 0 else None
                        
                        # Update volume and change data
                        if pd.notna(stock_data['volume']):
                            stock.volume = float(stock_data['volume'])
                        
                        if pd.notna(stock_data['change_abs']):
                            stock.change = float(stock_data['change_abs'])
                        
                        if pd.notna(stock_data['change']):
                            stock.change_percent = float(stock_data['change'])
                        
                        # Update recommendation (using consistent thresholds)
                        if pd.notna(stock_data['Recommend.All']):
                            rec_value = float(stock_data['Recommend.All'])
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
                        
                            stock.last_updated = datetime.utcnow()
                            updated_count += 1
                
                logger.info(f"Updated prices and OHLC data for {updated_count} stocks")
            else:
                logger.warning("No price data returned from TradingView")
            
        except Exception as e:
            logger.error(f"Error refreshing prices: {str(e)}")
            logger.exception(e)
        
        await db.commit()
        logger.info("Price refresh completed")
    
    async def search_stocks_by_query(self, query: str) -> List[Dict]:
        """Search for stocks on TradingView by symbol or company name using tradingview_screener"""
        try:
            logger.info(f"Searching TradingView for: {query}")
            
            count, df = (Query()
                .set_markets('egypt')
                .select(
                    'name', 'description', 'close', 'open', 'high', 'low', 'volume',
                    'change', 'change_abs', 'Recommend.All', 'logoid',
                    'sector', 'industry', 'market_cap_basic'
                )
                .order_by('market_cap_basic', ascending=False)
                .limit(500)
                .get_scanner_data(cookies=self.cookies))
            
            if df is None or df.empty:
                logger.warning("No results found from TradingView")
                return []
            
            # Filter by query
            query_lower = query.lower()
            results = []
            
            for _, row in df.iterrows():
                symbol = row.get('name', '')
                description = row.get('description', symbol)
                
                # Match query against symbol or company name
                if query_lower in symbol.lower() or query_lower in description.lower():
                    logoid = row.get('logoid', '')
                    logo_url = f"https://s3-symbol-logo.tradingview.com/{logoid}.svg" if logoid else None
                    
                    close_price = float(row.get('close', 0.0)) if pd.notna(row.get('close')) else 0.0
                    change_abs = float(row.get('change_abs', 0.0)) if pd.notna(row.get('change_abs')) else 0.0
                    change_percent = (change_abs / close_price * 100) if close_price > 0 else 0.0
                    
                    # Map recommendation
                    recommend_val = float(row.get('Recommend.All', 0)) if pd.notna(row.get('Recommend.All')) else 0
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
                    clean_name = re.sub(rf'^{re.escape(symbol)}\s*[-:]\s*', '', clean_name, flags=re.IGNORECASE)
                    clean_name = re.sub(rf'\s*[-:]\s*{re.escape(symbol)}$', '', clean_name, flags=re.IGNORECASE)
                    clean_name = re.sub(rf'\s*[\(\[]{re.escape(symbol)}[\)\]]', '', clean_name, flags=re.IGNORECASE)
                    clean_name = clean_name.strip() if clean_name.strip() else description
                    
                    results.append({
                        "symbol": symbol,
                        "name": clean_name,
                        "exchange": "EGX",
                        "price": close_price,
                        "open": float(row.get('open', 0.0)) if pd.notna(row.get('open')) else None,
                        "high": float(row.get('high', 0.0)) if pd.notna(row.get('high')) else None,
                        "low": float(row.get('low', 0.0)) if pd.notna(row.get('low')) else None,
                        "volume": float(row.get('volume', 0.0)) if pd.notna(row.get('volume')) else None,
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
    
    # ========================================
    # SECTION 2: tvdatafeed
    # Purpose: Historical OHLCV data ONLY
    # ========================================
    
    async def get_stock_history(
        self, 
        symbol: str, 
        interval: str = "1D", 
        range_param: str = "1M"
    ) -> List[Dict]:
        """
        Get real historical OHLCV data using tvdatafeed.
        This is the ONLY method that uses tvdatafeed.
        
        Args:
            symbol: Stock symbol
            interval: Time interval (1D, 1W, 1M, etc.)
            range_param: Time range (1W, 1M, 3M, 6M, 1Y, ALL)
        
        Returns:
            List of OHLCV data points
        """
        try:
            if not self.tv:
                logger.error("tvdatafeed not initialized")
                return []
            
            # Map range to number of bars
            range_bars_map = {
                "1W": 7,
                "1M": 30,
                "3M": 90,
                "6M": 180,
                "1Y": 365,
                "ALL": 5000  # Max bars supported by tvdatafeed
            }
            n_bars = range_bars_map.get(range_param, 30)
            
            # Map interval to TvInterval
            interval_map = {
                "1D": TvInterval.in_daily,
                "1W": TvInterval.in_weekly,
                "1M": TvInterval.in_monthly,
                "1H": TvInterval.in_1_hour,
                "4H": TvInterval.in_4_hour,
            }
            tv_interval = interval_map.get(interval, TvInterval.in_daily)
            
            # Get historical data from tvdatafeed
            logger.info(f"Fetching {n_bars} bars of {symbol} data from EGX with {tv_interval.name} interval")
            
            try:
                # Run in executor to avoid blocking async loop
                loop = asyncio.get_event_loop()
                df = await loop.run_in_executor(
                    None,
                    lambda: self.tv.get_hist(
                        symbol=symbol,
                        exchange='EGX',
                        interval=tv_interval,
                        n_bars=n_bars
                    )
                )
                
                if df is not None and not df.empty:
                    # Convert DataFrame to list of dicts
                    history = []
                    for index, row in df.iterrows():
                        history.append({
                            "date": index.strftime("%Y-%m-%d"),
                            "open": round(float(row['open']), 2),
                            "high": round(float(row['high']), 2),
                            "low": round(float(row['low']), 2),
                            "close": round(float(row['close']), 2),
                            "volume": int(row['volume']) if pd.notna(row['volume']) else 0
                        })
                    
                    logger.info(f"Successfully fetched {len(history)} historical data points for {symbol}")
                    return history
                else:
                    logger.warning(f"No data returned from tvdatafeed for {symbol}")
                    
            except Exception as e:
                logger.error(f"Error fetching data from tvdatafeed for {symbol}: {str(e)}")
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching stock history for {symbol}: {str(e)}")
            return []
    
    # ========================================
    # SECTION 3: tradingview_scraper
    # Purpose: Ideas, news, technical indicators, calendar events
    # ========================================
    
    async def get_stock_ideas(
        self, 
        symbol: str, 
        limit: int = 10
    ) -> List[Dict]:
        """
        Get trading ideas for a stock using tradingview_scraper.
        
        Args:
            symbol: Stock symbol
            limit: Maximum number of ideas to return
        
        Returns:
            List of trading ideas with full details
        """
        try:
            ideas_scraper = Ideas(export_result=False, export_type='json')
            
            # Calculate pages needed (approximately 20-25 ideas per page)
            pages_needed = max(1, (limit + 19) // 20)
            
            # Scrape ideas for the symbol
            ideas = ideas_scraper.scrape(
                symbol=symbol,
                startPage=1,
                endPage=pages_needed,
                sort="popular"
            )
            
            if not ideas:
                logger.info(f"No trading ideas found for {symbol}")
                return []
            
            # Limit results
            ideas = ideas[:limit]
            
            logger.info(f"Found {len(ideas)} trading ideas for {symbol}")
            return ideas
            
        except Exception as e:
            logger.error(f"Error fetching ideas for {symbol}: {str(e)}")
            return []
    
    async def get_technical_indicators(
        self, 
        symbol: str, 
        timeframe: str = "1d",
        exchange: str = "EGX"
    ) -> Dict:
        """
        Get ALL technical indicators for a stock using tradingview_scraper.
        
        Args:
            symbol: Stock symbol
            timeframe: Time frame (1d, 4h, 1h, etc.)
            exchange: Exchange name
        
        Returns:
            Dictionary with all technical indicators
        """
        try:
            indicators_scraper = Indicators(export_result=False, export_type='json')
            
            # Get all indicators
            result = indicators_scraper.scrape(
                exchange=exchange,
                        symbol=symbol,
                timeframe=timeframe,
                allIndicators=True
            )
            
            if result and result.get('status') == 'success':
                indicators = result.get('data', {})
                logger.info(f"Fetched {len(indicators)} technical indicators for {symbol}")
                return indicators
            else:
                logger.warning(f"No indicators returned for {symbol}")
                return {}
            
        except Exception as e:
            logger.error(f"Error fetching technical indicators for {symbol}: {str(e)}")
            return {}
    
    async def get_stock_news(
        self, 
        symbol: str, 
        limit: int = 20,
        exchange: str = "EGX"
    ) -> List[Dict]:
        """
        Get news headlines for a stock using tradingview_scraper.
        The headlines already contain full content in the body field.
        
        Args:
            symbol: Stock symbol
            limit: Maximum number of news items to return
            exchange: Exchange name
        
        Returns:
            List of news headlines with full content
        """
        try:
            news_scraper = NewsScraper(export_result=False, export_type='json')
            
            # Get news headlines
            news_headlines = news_scraper.scrape_headlines(
                symbol=symbol,
                exchange=exchange,
                sort='latest'
            )
            
            if not news_headlines:
                logger.info(f"No news found for {symbol}")
                return []
            
            # Limit results
            news_headlines = news_headlines[:limit]
            
            # Process each news item to include full content
            processed_news = []
            for headline in news_headlines:
                try:
                    # Clean the headline data first to ensure it's serializable
                    clean_headline = self._clean_news_data(headline)
                    
                    # Get full content for each news item
                    if 'storyPath' in clean_headline:
                        content = news_scraper.scrape_news_content(
                            story_path=clean_headline['storyPath']
                        )
                        
                        if content:
                            # Clean content data as well
                            clean_content = self._clean_news_data(content)
                            
                            # Merge headline with content
                            processed_item = {
                                **clean_headline,
                                'title': clean_content.get('title', clean_headline.get('title', '')),
                                'body': clean_content.get('body', []),
                                'breadcrumbs': clean_content.get('breadcrumbs', ''),
                                'published_datetime': clean_content.get('published_datetime', ''),
                                'related_symbols': clean_content.get('related_symbols', clean_headline.get('relatedSymbols', [])),
                                'tags': clean_content.get('tags', [])
                            }
                            processed_news.append(processed_item)
                        else:
                            # If content fetch fails, use headline as is
                            processed_news.append(clean_headline)
                    else:
                        # If no storyPath, use headline as is
                        processed_news.append(clean_headline)
                        
                except Exception as e:
                    logger.warning(f"Failed to get content for news item {headline.get('id', 'unknown')}: {str(e)}")
                    # Use cleaned headline as is if content fetch fails
                    processed_news.append(self._clean_news_data(headline))
            
            logger.info(f"Found {len(processed_news)} news items with content for {symbol}")
            return processed_news
            
        except Exception as e:
            logger.error(f"Error fetching news for {symbol}: {str(e)}")
            return []
    
    def _clean_news_data(self, data: Dict) -> Dict:
        """
        Clean news data to ensure it's JSON serializable.
        Removes functions, methods, and other non-serializable objects.
        """
        if not isinstance(data, dict):
            return {}
        
        cleaned = {}
        for key, value in data.items():
            try:
                # Skip functions and methods
                if callable(value):
                    continue
                
                # Handle different data types
                if isinstance(value, (str, int, float, bool, type(None))):
                    cleaned[key] = value
                elif isinstance(value, (list, tuple)):
                    # Recursively clean list items
                    cleaned_list = []
                    for item in value:
                        if isinstance(item, dict):
                            cleaned_list.append(self._clean_news_data(item))
                        elif isinstance(item, (str, int, float, bool, type(None))):
                            cleaned_list.append(item)
                        # Skip other non-serializable types
                    cleaned[key] = cleaned_list
                elif isinstance(value, dict):
                    # Recursively clean nested dictionaries
                    cleaned[key] = self._clean_news_data(value)
                else:
                    # Try to convert to string for other types
                    try:
                        cleaned[key] = str(value)
                    except:
                        # Skip if can't convert
                        continue
            except Exception as e:
                logger.warning(f"Failed to clean news data field {key}: {str(e)}")
                continue
        
        return cleaned
    
    async def get_news_content(self, story_path: str) -> Optional[Dict]:
        """
        Get full content for a specific news article using tradingview_scraper.
        
        Args:
            story_path: Story path from news headline
        
        Returns:
            Full news article content with keys: title, body, published_datetime, related_symbols
        """
        try:
            news_scraper = NewsScraper(export_result=False, export_type='json')
            
            content = news_scraper.scrape_news_content(story_path=story_path)
            
            if content and isinstance(content, dict):
                logger.info(f"Fetched news content for {story_path}")
                
                # Extract serializable fields
                # Convert body list to serializable format
                body = content.get('body', [])
                serializable_body = []
                if isinstance(body, list):
                    for item in body:
                        if isinstance(item, dict):
                            serializable_body.append(item)
                        elif isinstance(item, str):
                            serializable_body.append(item)
                        else:
                            # Handle non-serializable items
                            serializable_body.append(str(item))
                
                # Convert related_symbols to serializable format
                related_symbols = content.get('related_symbols', [])
                serializable_symbols = []
                if isinstance(related_symbols, list):
                    for symbol in related_symbols:
                        if isinstance(symbol, dict):
                            serializable_symbols.append(symbol)
                        elif isinstance(symbol, str):
                            serializable_symbols.append(symbol)
                        else:
                            # Handle objects with attributes
                            try:
                                serializable_symbols.append(str(symbol))
                            except:
                                pass
                
                return {
                    'title': str(content.get('title', '')),
                    'body': serializable_body,
                    'published_datetime': str(content.get('published_datetime', '')),
                    'related_symbols': serializable_symbols
                }
            else:
                logger.warning(f"No content found for {story_path}")
                return None
            
        except Exception as e:
            logger.error(f"Error fetching news content: {str(e)}")
            logger.exception(e)
            return None
    
    async def get_earnings_calendar(
        self, 
        symbol: str = None
    ) -> List[Dict]:
        """
        Get earnings calendar events using tradingview_scraper.
        
        Args:
            symbol: Optional symbol to filter by
        
        Returns:
            List of earnings events
        """
        try:
            calendar_scraper = CalendarScraper()
            
            # Get upcoming earnings
            earnings = calendar_scraper.scrape_earnings(
                values=["logoid", "name", "earnings_per_share_fq", "market_cap_basic"]
            )
            
            # Filter by symbol if provided
            if symbol and earnings:
                earnings = [e for e in earnings if e.get('name') == symbol]
            
            logger.info(f"Found {len(earnings) if earnings else 0} earnings events")
            return earnings if earnings else []
            
        except Exception as e:
            logger.error(f"Error fetching earnings calendar: {str(e)}")
            return []
    
    async def get_dividend_calendar(
        self, 
        symbol: str = None
    ) -> List[Dict]:
        """
        Get dividend calendar events using tradingview_scraper.
        
        Args:
            symbol: Optional symbol to filter by
        
        Returns:
            List of dividend events
        """
        try:
            calendar_scraper = CalendarScraper()
            
            # Get upcoming dividends
            dividends = calendar_scraper.scrape_dividends(
                values=["logoid", "name", "dividends_yield", "market_cap_basic"]
            )
            
            # Filter by symbol if provided
            if symbol and dividends:
                dividends = [d for d in dividends if d.get('name') == symbol]
            
            logger.info(f"Found {len(dividends) if dividends else 0} dividend events")
            return dividends if dividends else []
            
        except Exception as e:
            logger.error(f"Error fetching dividend calendar: {str(e)}")
            return []

    # ========================================
    # Legacy/Utility Methods
    # ========================================
    
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
            stock_list = [
                {"symbol": "COMI", "name": "Commercial International Bank - Egypt (CIB) S.A.E.", "exchange": "EGX", "price": 100.0, "logo": None},
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
    
    async def start_periodic_refresh(self, db: AsyncSession, interval: int = 300):
        """Start periodic price refresh (default: every 5 minutes)"""
        logger.info(f"Starting periodic price refresh (every {interval} seconds)")
        while True:
            await asyncio.sleep(interval)
            try:
                await self.refresh_prices(db)
            except Exception as e:
                logger.error(f"Error in periodic refresh: {str(e)}")


# Service instance
tradingview_service = TradingViewService()
