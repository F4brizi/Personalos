import uuid
from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, ConfigDict, Field


class PomodoroBase(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int = Field(default=25, ge=1)
    project_name: str = "General"
    tag: Optional[str] = None
    completed: bool = True
    interruptions: int = Field(default=0, ge=0)
    notes: Optional[str] = None


class PomodoroCreate(PomodoroBase):
    pass


class PomodoroUpdate(BaseModel):
    end_time: Optional[datetime] = None
    completed: Optional[bool] = None
    interruptions: Optional[int] = None
    notes: Optional[str] = None


class PomodoroResponse(PomodoroBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PomodoroDailyStats(BaseModel):
    date: str
    total_pomodoros: int
    total_minutes: int
    by_project: Dict[str, int]
