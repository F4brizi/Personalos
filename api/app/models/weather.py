import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, Boolean, Date, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class WeatherLocation(Base):
    __tablename__ = "weather_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("WeatherLog", back_populates="location", cascade="all, delete-orphan")


class WeatherLog(Base):
    __tablename__ = "weather_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("weather_locations.id"), nullable=False)
    log_date = Column(Date, nullable=False, index=True)
    
    temperature_max = Column(Float, nullable=True)
    temperature_min = Column(Float, nullable=True)
    precipitation_probability = Column(Integer, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    humidity = Column(Integer, nullable=True)
    weather_condition = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("WeatherLocation", back_populates="logs")
