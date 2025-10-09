"""
Script to remove CIB stock from database (duplicate of COMI)
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete

# Import models
import sys
sys.path.insert(0, '.')
from app.models.stock import Stock
from app.models.holding import Holding
from app.core.config import settings

async def remove_cib():
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find CIB stock
        result = await session.execute(select(Stock).where(Stock.symbol == 'CIB'))
        cib_stock = result.scalar_one_or_none()
        
        if not cib_stock:
            print("CIB stock not found in database")
            return
        
        print(f"Found CIB stock: ID={cib_stock.id}, Name={cib_stock.name}")
        
        # Check if there are any holdings with this stock
        holdings_result = await session.execute(
            select(Holding).where(Holding.stock_id == cib_stock.id)
        )
        holdings = holdings_result.scalars().all()
        
        if holdings:
            print(f"WARNING: Found {len(holdings)} holdings associated with CIB")
            print("You may want to migrate these to COMI first")
            # Optionally, you could migrate them here
        
        # Delete the stock
        await session.delete(cib_stock)
        await session.commit()
        
        print(f"Successfully removed CIB stock from database")

if __name__ == "__main__":
    asyncio.run(remove_cib())
