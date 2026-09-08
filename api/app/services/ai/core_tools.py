import asyncio
from datetime import datetime, date
from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.meeting import Meeting
from app.models.daily_tracking import DailyTracking
from dateutil import parser
from sqlalchemy import select

def record_expense(amount: float, description: str, category: str = "Gastos") -> str:
    """Registra un nuevo gasto financiero en la base de datos PostgreSQL de Personal OS."""
    async def _run():
        try:
            async with AsyncSessionLocal() as session:
                new_tx = Transaction(
                    date=datetime.now(),
                    amount=-abs(amount),
                    currency="ARS",
                    description=description,
                    category=category,
                    payment_method="AI Assistant",
                    type="expense",
                    is_reconciled=False,
                    notes="Registrado vía Gemini"
                )
                session.add(new_tx)
                await session.commit()
                return f"Éxito: Gasto de {amount} registrado como '{description}' en '{category}'."
        except Exception as e:
            return f"Error guardando gasto: {str(e)}"
    return asyncio.run(_run())

def schedule_meeting(title: str, start_time: str, end_time: str, description: str = "") -> str:
    """Agenda una nueva reunión o evento en el calendario de PostgreSQL de Personal OS. start_time y end_time deben ser strings en formato ISO (ej: 2026-09-08T15:00:00)."""
    async def _run():
        try:
            dt_start = parser.isoparse(start_time)
            dt_end = parser.isoparse(end_time)
            
            async with AsyncSessionLocal() as session:
                new_meeting = Meeting(
                    title=title,
                    start_time=dt_start,
                    end_time=dt_end,
                    description=description
                )
                session.add(new_meeting)
                await session.commit()
                return f"Éxito: Reunión '{title}' agendada para el {dt_start.strftime('%Y-%m-%d %H:%M')}."
        except Exception as e:
            return f"Error agendando reunión: {str(e)}"
    return asyncio.run(_run())

def record_daily_survey(
    wake_up_ease: int, 
    sleep_quality: int, 
    concentration_quality: int, 
    motivation_quality: int, 
    pomodoros_done: int, 
    maintenance_hours: float, 
    sleep_hours: float, 
    work_hours: float, 
    wasted_hours: float, 
    exercise_description: str, 
    food_description: str
) -> str:
    """Registra o actualiza la encuesta diaria de métricas de salud, productividad y estado de ánimo del usuario."""
    async def _run():
        try:
            today = date.today()
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(DailyTracking).where(DailyTracking.log_date == today))
                tracking = result.scalar_one_or_none()
                
                if tracking:
                    tracking.wake_up_ease = wake_up_ease
                    tracking.sleep_quality = sleep_quality
                    tracking.concentration_quality = concentration_quality
                    tracking.motivation_quality = motivation_quality
                    tracking.pomodoros_done = pomodoros_done
                    tracking.maintenance_hours = maintenance_hours
                    tracking.sleep_hours = sleep_hours
                    tracking.work_hours = work_hours
                    tracking.wasted_hours = wasted_hours
                    tracking.exercise_description = exercise_description
                    tracking.food_description = food_description
                else:
                    tracking = DailyTracking(
                        log_date=today,
                        wake_up_ease=wake_up_ease,
                        sleep_quality=sleep_quality,
                        concentration_quality=concentration_quality,
                        motivation_quality=motivation_quality,
                        pomodoros_done=pomodoros_done,
                        maintenance_hours=maintenance_hours,
                        sleep_hours=sleep_hours,
                        work_hours=work_hours,
                        wasted_hours=wasted_hours,
                        exercise_description=exercise_description,
                        food_description=food_description
                    )
                    session.add(tracking)
                    
                await session.commit()
                return f"Éxito: Encuesta del día {today} guardada correctamente."
        except Exception as e:
            return f"Error guardando encuesta diaria: {str(e)}"
    return asyncio.run(_run())
