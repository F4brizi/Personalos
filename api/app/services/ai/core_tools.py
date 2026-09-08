import asyncio
from datetime import datetime
from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.meeting import Meeting
from dateutil import parser

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
