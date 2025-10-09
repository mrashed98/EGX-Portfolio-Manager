"""
Test script to explore TradingView packages and document their API responses.
This helps us understand the actual data structures before implementing the refactoring.

Run with: uv run python test_tradingview_packages.py
"""

import asyncio
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ========================================
# SECTION 1: Test tradingview_screener
# ========================================

def test_tradingview_screener():
    """Test tradingview_screener package with various queries"""
    logger.info("=" * 80)
    logger.info("TESTING TRADINGVIEW_SCREENER")
    logger.info("=" * 80)
    
    try:
        from tradingview_screener import Query, col
        
        # Test 1: Basic query for EGX stocks
        logger.info("\n--- Test 1: Basic EGX Stock Query ---")
        count, df = (Query()
            .set_markets('egypt')
            .select('name', 'description', 'close', 'volume', 'change', 'change_abs')
            .limit(5)
            .get_scanner_data())
        
        logger.info(f"Total count: {count}")
        logger.info(f"Returned rows: {len(df)}")
        logger.info(f"Columns: {list(df.columns)}")
        logger.info(f"Sample data:\n{df.head()}")
        
        # Test 2: Query with fundamental fields - test each field individually
        logger.info("\n--- Test 2: Testing Which Fundamental Fields Work for EGX ---")
        
        test_fields = [
            'market_cap_basic', 'price_earnings_ttm', 'earnings_per_share_basic_ttm',
            'dividend_yield', 'beta_1_year', 'price_to_book', 'price_to_sales_ttm',
            'return_on_equity', 'debt_to_equity', 'current_ratio', 'quick_ratio',
            'sector', 'industry', 'logoid', 'Recommend.All',
            'open', 'high', 'low', 'earnings_per_share_fq', 'dividends_yield_current',
            'price_book_fq', 'return_on_assets', 'return_on_invested_capital'
        ]
        
        working_fields = ['name', 'description', 'close', 'volume', 'change']
        for field in test_fields:
            try:
                count, df = (Query()
                    .set_markets('egypt')
                    .select('name', field)
                    .limit(1)
                    .get_scanner_data())
                working_fields.append(field)
                logger.info(f"✓ {field} works")
            except Exception as e:
                logger.warning(f"✗ {field} - {str(e)[:100]}")
        
        # Now query with all working fields
        logger.info("\n--- Querying with all working fields ---")
        count, df = (Query()
            .set_markets('egypt')
            .select(*working_fields[:20])  # Limit to avoid too many fields
            .limit(3)
            .get_scanner_data())
        
        logger.info(f"Total count: {count}")
        logger.info(f"Working columns: {list(df.columns)}")
        logger.info(f"Sample data:\n{df.to_dict('records')}")
        
        # Test 3: Test rookiepy cookies (if available)
        logger.info("\n--- Test 3: Testing with rookiepy cookies ---")
        try:
            import rookiepy
            logger.info("rookiepy is available, attempting to load cookies...")
            
            # Try Chrome first
            try:
                cookies = rookiepy.to_cookiejar(rookiepy.chrome(['.tradingview.com']))
                logger.info("Successfully loaded Chrome cookies")
                
                # Test with cookies
                count, df = (Query()
                    .set_markets('egypt')
                    .select('name', 'close', 'update_mode')
                    .limit(3)
                    .get_scanner_data(cookies=cookies))
                
                logger.info(f"With cookies - Update modes: {df['update_mode'].unique()}")
                
            except Exception as e:
                logger.warning(f"Could not load Chrome cookies: {e}")
                logger.info("Trying without cookies...")
                
                # Test without cookies
                count, df = (Query()
                    .set_markets('egypt')
                    .select('name', 'close', 'update_mode')
                    .limit(3)
                    .get_scanner_data())
                
                logger.info(f"Without cookies - Update modes: {df['update_mode'].unique()}")
                
        except ImportError:
            logger.warning("rookiepy not installed - skipping cookie test")
        
        # Test 4: Query specific symbol
        logger.info("\n--- Test 4: Query Specific Symbol (COMI) ---")
        count, df = (Query()
            .set_markets('egypt')
            .select('name', 'description', 'close', 'volume', 'sector', 'industry', 'logoid')
            .where(col('name') == 'COMI')
            .limit(1)
            .get_scanner_data())
        
        logger.info(f"Found: {count}")
        if not df.empty:
            logger.info(f"Data: {df.to_dict('records')[0]}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error testing tradingview_screener: {e}", exc_info=True)
        return False


# ========================================
# SECTION 2: Test tvdatafeed
# ========================================

def test_tvdatafeed():
    """Test tvdatafeed package for historical data"""
    logger.info("\n" + "=" * 80)
    logger.info("TESTING TVDATAFEED")
    logger.info("=" * 80)
    
    try:
        from tvDatafeed import TvDatafeed, Interval as TvInterval
        
        # Test 1: Initialize without login
        logger.info("\n--- Test 1: Initialize TvDatafeed (no login) ---")
        tv = TvDatafeed()
        logger.info("TvDatafeed initialized successfully")
        
        # Test 2: Get historical data for EGX stock
        logger.info("\n--- Test 2: Get Historical Data for COMI (EGX) ---")
        try:
            df = tv.get_hist(
                symbol='COMI',
                exchange='EGX',
                interval=TvInterval.in_daily,
                n_bars=30
            )
            
            if df is not None and not df.empty:
                logger.info(f"Data shape: {df.shape}")
                logger.info(f"Columns: {list(df.columns)}")
                logger.info(f"Index type: {type(df.index)}")
                logger.info(f"Date range: {df.index[0]} to {df.index[-1]}")
                logger.info(f"Sample data:\n{df.head()}")
                logger.info(f"Data types:\n{df.dtypes}")
            else:
                logger.warning("No data returned")
                
        except Exception as e:
            logger.error(f"Error fetching COMI data: {e}")
        
        # Test 3: Try different interval
        logger.info("\n--- Test 3: Test Different Intervals ---")
        for interval in [TvInterval.in_daily, TvInterval.in_weekly]:
            try:
                df = tv.get_hist(
                    symbol='COMI',
                    exchange='EGX',
                    interval=interval,
                    n_bars=5
                )
                if df is not None and not df.empty:
                    logger.info(f"{interval.name}: Got {len(df)} bars")
            except Exception as e:
                logger.error(f"Error with {interval.name}: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error testing tvdatafeed: {e}", exc_info=True)
        return False


# ========================================
# SECTION 3: Test tradingview_scraper
# ========================================

async def test_tradingview_scraper():
    """Test tradingview_scraper package for ideas, news, indicators"""
    logger.info("\n" + "=" * 80)
    logger.info("TESTING TRADINGVIEW_SCRAPER")
    logger.info("=" * 80)
    
    try:
        # Test 1: Ideas scraper
        logger.info("\n--- Test 1: Testing Ideas Scraper ---")
        try:
            from tradingview_scraper.symbols.ideas import Ideas
            
            ideas_scraper = Ideas(export_result=False, export_type='json')
            
            # Try with BTCUSD first (more likely to have ideas)
            ideas = ideas_scraper.scrape(symbol='BTCUSD', startPage=1, endPage=1, sort='popular')
            
            logger.info(f"Got {len(ideas) if ideas else 0} ideas for BTCUSD")
            if ideas and len(ideas) > 0:
                logger.info(f"Idea fields: {list(ideas[0].keys())}")
                logger.info(f"Sample idea: {ideas[0]}")
            
            # Try with EGX symbol
            try:
                egx_ideas = ideas_scraper.scrape(symbol='COMI', startPage=1, endPage=1, sort='popular')
                logger.info(f"Got {len(egx_ideas) if egx_ideas else 0} ideas for COMI (EGX)")
            except Exception as e:
                logger.warning(f"Error getting ideas for COMI: {e}")
                
        except Exception as e:
            logger.error(f"Error testing Ideas scraper: {e}", exc_info=True)
        
        # Test 2: Technical Indicators
        logger.info("\n--- Test 2: Testing Indicators Scraper ---")
        try:
            from tradingview_scraper.symbols.technicals import Indicators
            
            indicators_scraper = Indicators(export_result=False, export_type='json')
            
            # Test with specific indicators
            indicators = indicators_scraper.scrape(
                exchange="BINANCE",
                symbol="BTCUSDT",
                timeframe="1d",
                indicators=["RSI", "Stoch.K", "MACD.macd"]
            )
            
            logger.info(f"Specific indicators result: {indicators}")
            
            # Test with all indicators
            all_indicators = indicators_scraper.scrape(
                exchange="BINANCE",
                symbol="BTCUSDT",
                timeframe="1d",
                allIndicators=True
            )
            
            logger.info(f"All indicators count: {len(all_indicators) if all_indicators else 0}")
            if all_indicators:
                logger.info(f"Available indicators: {list(all_indicators.keys())[:20]}...")  # First 20
            
            # Try with EGX
            try:
                egx_indicators = indicators_scraper.scrape(
                    exchange="EGX",
                    symbol="COMI",
                    timeframe="1d",
                    allIndicators=True
                )
                logger.info(f"EGX indicators count: {len(egx_indicators) if egx_indicators else 0}")
            except Exception as e:
                logger.warning(f"Error getting EGX indicators: {e}")
                
        except Exception as e:
            logger.error(f"Error testing Indicators scraper: {e}", exc_info=True)
        
        # Test 3: News Scraper
        logger.info("\n--- Test 3: Testing News Scraper ---")
        try:
            from tradingview_scraper.symbols.news import NewsScraper
            
            news_scraper = NewsScraper(export_result=False, export_type='json')
            
            # Test headlines
            news_headlines = news_scraper.scrape_headlines(
                symbol='BTCUSD',
                exchange='BINANCE',
                sort='latest'
            )
            
            logger.info(f"Got {len(news_headlines) if news_headlines else 0} news headlines")
            if news_headlines and len(news_headlines) > 0:
                logger.info(f"Headline fields: {list(news_headlines[0].keys())}")
                logger.info(f"Sample headline: {news_headlines[0]}")
                
                # Test content scraping
                if 'storyPath' in news_headlines[0]:
                    try:
                        content = news_scraper.scrape_news_content(
                            story_path=news_headlines[0]['storyPath']
                        )
                        logger.info(f"News content fields: {list(content[0].keys()) if content else 'None'}")
                        if content:
                            logger.info(f"Sample content: {content[0]}")
                    except Exception as e:
                        logger.warning(f"Error scraping news content: {e}")
            
        except Exception as e:
            logger.error(f"Error testing News scraper: {e}", exc_info=True)
        
        # Test 4: Calendar Scraper
        logger.info("\n--- Test 4: Testing Calendar Scraper ---")
        try:
            from tradingview_scraper.symbols.cal import CalendarScraper
            
            calendar_scraper = CalendarScraper()
            
            # Test earnings
            try:
                earnings = calendar_scraper.scrape_earnings(
                    values=["logoid", "name", "earnings_per_share_fq"]
                )
                logger.info(f"Got {len(earnings) if earnings else 0} earnings events")
                if earnings and len(earnings) > 0:
                    logger.info(f"Earnings fields: {list(earnings[0].keys())}")
            except Exception as e:
                logger.warning(f"Error scraping earnings: {e}")
            
            # Test dividends
            try:
                dividends = calendar_scraper.scrape_dividends(
                    values=["logoid", "name", "dividends_yield"]
                )
                logger.info(f"Got {len(dividends) if dividends else 0} dividend events")
                if dividends and len(dividends) > 0:
                    logger.info(f"Dividend fields: {list(dividends[0].keys())}")
            except Exception as e:
                logger.warning(f"Error scraping dividends: {e}")
                
        except Exception as e:
            logger.error(f"Error testing Calendar scraper: {e}", exc_info=True)
        
        return True
        
    except Exception as e:
        logger.error(f"Error testing tradingview_scraper: {e}", exc_info=True)
        return False


# ========================================
# Main execution
# ========================================

def main():
    """Run all tests"""
    logger.info("Starting TradingView packages exploration...")
    logger.info(f"Timestamp: {datetime.now()}")
    
    results = {}
    
    # Test each package
    results['screener'] = test_tradingview_screener()
    results['tvdatafeed'] = test_tvdatafeed()
    
    # Run async tests
    loop = asyncio.get_event_loop()
    results['scraper'] = loop.run_until_complete(test_tradingview_scraper())
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    for package, success in results.items():
        status = "✓ SUCCESS" if success else "✗ FAILED"
        logger.info(f"{package:20s}: {status}")
    
    logger.info("\nTesting complete!")


if __name__ == "__main__":
    main()

