from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON
import uuid
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import TimestampMixin
from app.core.database import Base

class Meeting(Base, TimestampMixin):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=True)
    is_virtual = Column(Boolean, default=False)
    meeting_link = Column(String, nullable=True)
    attendees = Column(JSON, nullable=True)  # Lista de emails o nombres
    is_completed = Column(Boolean, default=False)
