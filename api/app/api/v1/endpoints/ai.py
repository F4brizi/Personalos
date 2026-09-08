from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.database import get_db
from app.models.ai_memory import AiThread, AiMessage
from app.schemas.ai_schemas import AiThreadCreate, AiThreadResponse, AiMessageCreate, AiMessageSchema
from app.services.ai.gemini_provider import GeminiProvider
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

router = APIRouter()

# Instancia del proveedor (usando Gemini por defecto)
# Podría inyectarse por dependencia si usamos varios modelos
ai_provider = GeminiProvider()

@router.post("/thread", response_model=AiThreadResponse)
async def create_thread(thread_in: AiThreadCreate, db: AsyncSession = Depends(get_db)):
    new_thread = AiThread(title=thread_in.title)
    db.add(new_thread)
    await db.commit()
    await db.refresh(new_thread)
    return new_thread

@router.get("/thread/{thread_id}", response_model=AiThreadResponse)
async def get_thread(thread_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AiThread)
        .options(selectinload(AiThread.messages))
        .where(AiThread.id == thread_id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread no encontrado")
    return thread

@router.post("/thread/{thread_id}/message")
async def send_message(thread_id: uuid.UUID, msg_in: AiMessageCreate, db: AsyncSession = Depends(get_db)):
    # Verificamos si existe el thread
    result = await db.execute(select(AiThread).where(AiThread.id == thread_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Thread no encontrado")
        
    try:
        reply = await ai_provider.generate_response(session=db, thread_id=thread_id, prompt=msg_in.content)
        return {"response": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
