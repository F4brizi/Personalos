import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.weather import WeatherLocation

async def seed():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(WeatherLocation).where(WeatherLocation.name == "Vicente Lopez"))
        if not res.scalar_one_or_none():
            loc1 = WeatherLocation(name="Vicente Lopez", latitude=-34.5228, longitude=-58.4795)
            session.add(loc1)
            
        res2 = await session.execute(select(WeatherLocation).where(WeatherLocation.name == "Florencio Varela"))
        if not res2.scalar_one_or_none():
            loc2 = WeatherLocation(name="Florencio Varela", latitude=-34.8028, longitude=-58.2725)
            session.add(loc2)
            
        await session.commit()
        print("Locations seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
