import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.weather import WeatherLocation, WeatherLog
from app.schemas.weather import WeatherLocationCreate, WeatherLocationResponse, WeatherLogResponse

router = APIRouter()

@router.get("/locations", response_model=List[WeatherLocationResponse])
async def list_locations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherLocation))
    return result.scalars().all()

from arq import create_pool
from arq.connections import RedisSettings
from app.core.config import settings

@router.post("/locations", response_model=WeatherLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(loc_in: WeatherLocationCreate, db: AsyncSession = Depends(get_db)):
    # Check if name exists
    existing = await db.execute(select(WeatherLocation).where(WeatherLocation.name == loc_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Location name already exists")
        
    loc = WeatherLocation(
        name=loc_in.name,
        latitude=loc_in.latitude,
        longitude=loc_in.longitude,
        is_active=loc_in.is_active
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)

    if loc_in.historical_days and loc_in.historical_days > 0:
        redis_host = settings.REDIS_HOST if hasattr(settings, 'REDIS_HOST') else 'redis'
        redis_port = settings.REDIS_PORT if hasattr(settings, 'REDIS_PORT') else 6379
        redis = await create_pool(RedisSettings(host=redis_host, port=redis_port))
        await redis.enqueue_job('backfill_historical_weather', str(loc.id), loc_in.historical_days)
        await redis.aclose()

    return loc

@router.get("/logs", response_model=List[WeatherLogResponse])
async def list_logs(db: AsyncSession = Depends(get_db)):
    query = select(WeatherLog).options(selectinload(WeatherLog.location)).order_by(WeatherLog.log_date.desc())
    result = await db.execute(query)
    return result.scalars().all()

from sqlalchemy import delete

@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: uuid.UUID, delete_logs: bool = False, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherLocation).where(WeatherLocation.id == location_id))
    loc = result.scalar_one_or_none()
    
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
        
    if delete_logs:
        await db.execute(delete(WeatherLog).where(WeatherLog.location_id == location_id))
        
    await db.execute(delete(WeatherLocation).where(WeatherLocation.id == location_id))
    await db.commit()
    return None
