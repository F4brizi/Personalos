from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.models.ai_usage import AiUsageLog
from app.schemas.ai_usage import AiUsageCreate, AiUsageResponse, AiUsageStats

router = APIRouter()

@router.post("/", response_model=AiUsageResponse)
async def create_log(
    log_in: AiUsageCreate,
    db: AsyncSession = Depends(get_db)
):
    # Calcular total_tokens si no viene
    if log_in.total_tokens == 0 and (log_in.prompt_tokens > 0 or log_in.completion_tokens > 0):
        log_in.total_tokens = log_in.prompt_tokens + log_in.completion_tokens
        
    db_log = AiUsageLog(**log_in.model_dump())
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

@router.get("/", response_model=List[AiUsageResponse])
async def list_logs(
    skip: int = 0,
    limit: int = 50,
    account_name: str = None,
    provider: str = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(AiUsageLog).order_by(AiUsageLog.created_at.desc())
    
    if account_name:
        query = query.where(AiUsageLog.account_name == account_name)
    if provider:
        query = query.where(AiUsageLog.provider == provider)
        
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/stats", response_model=AiUsageStats)
async def get_stats(
    days: int = Query(30, description="Días hacia atrás a analizar"),
    db: AsyncSession = Depends(get_db)
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    
    query = select(AiUsageLog).where(AiUsageLog.created_at >= since)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    stats = AiUsageStats(
        total_cost_usd=0.0,
        total_prompt_tokens=0,
        total_completion_tokens=0,
        total_requests=len(logs),
        by_account={},
        by_model={},
        by_category={}
    )
    
    for log in logs:
        stats.total_cost_usd += log.cost_usd
        stats.total_prompt_tokens += log.prompt_tokens
        stats.total_completion_tokens += log.completion_tokens
        
        # Agrupar por cuenta (costo)
        stats.by_account[log.account_name] = stats.by_account.get(log.account_name, 0.0) + log.cost_usd
        
        # Agrupar por modelo (peticiones)
        stats.by_model[log.model_name] = stats.by_model.get(log.model_name, 0) + 1
        
        # Agrupar por categoría
        if log.category:
            stats.by_category[log.category] = stats.by_category.get(log.category, 0) + 1
            
    return stats
