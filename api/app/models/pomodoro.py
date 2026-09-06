import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import TimestampMixin


class PomodoroSession(Base, TimestampMixin):
    __tablename__ = "pomodoro_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=25,
        nullable=False,
        comment="Duración en minutos de la sesión"
    )
    project_name: Mapped[str] = mapped_column(
        String(100),
        default="General",
        index=True,
        nullable=False
    )
    tag: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    interruptions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
