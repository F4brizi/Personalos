import uuid
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

class WeatherLocationBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    is_active: bool = True

class WeatherLocationCreate(WeatherLocationBase):
    historical_days: Optional[int] = 0

class WeatherLocationResponse(WeatherLocationBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class WeatherLogResponse(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    log_date: date
    temperature_max: Optional[float]
    temperature_min: Optional[float]
    precipitation_probability: Optional[int]
    humidity: Optional[int]
    weather_condition: Optional[str]
    created_at: datetime
    
    # Nested location for convenience
    location: Optional[WeatherLocationResponse] = None

    class Config:
        from_attributes = True
