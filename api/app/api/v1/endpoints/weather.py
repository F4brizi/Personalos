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

@router.post("/locations", response_model=WeatherLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(loc_in: WeatherLocationCreate, db: AsyncSession = Depends(get_db)):
    # Check if name exists
    existing = await db.execute(select(WeatherLocation).where(WeatherLocation.name == loc_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Location name already exists")
        
    loc = WeatherLocation(**loc_in.model_dump())
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc

@router.get("/logs", response_model=List[WeatherLogResponse])
async def list_logs(db: AsyncSession = Depends(get_db)):
    query = select(WeatherLog).options(selectinload(WeatherLog.location)).order_by(WeatherLog.log_date.desc())
    result = await db.execute(query)
    return result.scalars().all()
