from sqlalchemy import Column, String, Date, Text, Integer, Float
import uuid
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import TimestampMixin
from app.core.database import Base

class DailyTracking(Base, TimestampMixin):
    __tablename__ = "daily_trackings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    log_date = Column(Date, nullable=False, unique=True, index=True)
    
    # Puntuaciones (1-10)
    wake_up_ease = Column(Integer, nullable=True)
    sleep_quality = Column(Integer, nullable=True)
    concentration_quality = Column(Integer, nullable=True)
    motivation_quality = Column(Integer, nullable=True)
    
    # Cantidades
    pomodoros_done = Column(Integer, nullable=True)
    maintenance_hours = Column(Float, nullable=True)
    sleep_hours = Column(Float, nullable=True)
    work_hours = Column(Float, nullable=True)
    wasted_hours = Column(Float, nullable=True)
    
    # Descripciones abiertas
    exercise_description = Column(Text, nullable=True)
    food_description = Column(Text, nullable=True)
