import uuid
from datetime import datetime, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.pomodoro import PomodoroSession
from app.schemas.pomodoro import (
    PomodoroCreate,
    PomodoroUpdate,
    PomodoroResponse,
    PomodoroDailyStats,
)

router = APIRouter()


@router.get("", response_model=List[PomodoroResponse])
async def list_pomodoros(
    db: AsyncSession = Depends(get_db),
    project_name: Optional[str] = Query(None, description="Filtrar por proyecto"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = select(PomodoroSession).order_by(PomodoroSession.start_time.desc())
    if project_name:
        query = query.where(PomodoroSession.project_name == project_name)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=PomodoroResponse, status_code=status.HTTP_201_CREATED)
async def create_pomodoro(
    pomodoro_in: PomodoroCreate,
    db: AsyncSession = Depends(get_db)
):
    pomodoro = PomodoroSession(**pomodoro_in.model_dump())
    db.add(pomodoro)
    await db.commit()
    await db.refresh(pomodoro)
    return pomodoro


@router.patch("/{pomodoro_id}", response_model=PomodoroResponse)
async def update_pomodoro(
    pomodoro_id: uuid.UUID,
    pomodoro_update: PomodoroUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PomodoroSession).where(PomodoroSession.id == pomodoro_id)
    )
    pomodoro = result.scalar_one_or_none()
    if not pomodoro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión de pomodoro no encontrada"
        )

    update_data = pomodoro_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(pomodoro, field, val)

    await db.commit()
    await db.refresh(pomodoro)
    return pomodoro


@router.get("/stats/today", response_model=PomodoroDailyStats)
async def get_today_stats(
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    start_of_day = datetime.combine(today, time.min)
    end_of_day = datetime.combine(today, time.max)

    # Contar pomodoros completados hoy
    count_res = await db.execute(
        select(
            func.count(PomodoroSession.id),
            func.coalesce(func.sum(PomodoroSession.duration_minutes), 0)
        ).where(
            and_(
                PomodoroSession.start_time >= start_of_day,
                PomodoroSession.start_time <= end_of_day,
                PomodoroSession.completed.is_(True)
            )
        )
    )
    total_count, total_minutes = count_res.one()

    # Desglose por proyecto
    by_project_res = await db.execute(
        select(
            PomodoroSession.project_name,
            func.coalesce(func.sum(PomodoroSession.duration_minutes), 0)
        ).where(
            and_(
                PomodoroSession.start_time >= start_of_day,
                PomodoroSession.start_time <= end_of_day,
                PomodoroSession.completed.is_(True)
            )
        ).group_by(PomodoroSession.project_name)
    )
    by_project = {row[0]: int(row[1]) for row in by_project_res.all()}

    return PomodoroDailyStats(
        date=today.isoformat(),
        total_pomodoros=int(total_count),
        total_minutes=int(total_minutes),
        by_project=by_project
    )
