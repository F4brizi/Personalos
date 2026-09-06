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

import calendar
from app.models.ai_usage import AiProviderQuota
from app.schemas.ai_usage import AiQuotaBase, AiQuotaResponse

def get_next_reset_date(reset_day: int) -> datetime:
    now = datetime.now(timezone.utc)
    # Check if reset day passed this month
    if now.day >= reset_day:
        # Next reset is next month
        if now.month == 12:
            next_month = 1
            year = now.year + 1
        else:
            next_month = now.month + 1
            year = now.year
        
        # Handle cases where next month has fewer days than reset_day
        last_day = calendar.monthrange(year, next_month)[1]
        actual_reset_day = min(reset_day, last_day)
        return datetime(year, next_month, actual_reset_day, tzinfo=timezone.utc)
    else:
        # Next reset is this month
        return datetime(now.year, now.month, reset_day, tzinfo=timezone.utc)
        
def get_current_billing_period_start(reset_day: int) -> datetime:
    now = datetime.now(timezone.utc)
    if now.day >= reset_day:
        return datetime(now.year, now.month, reset_day, tzinfo=timezone.utc)
    else:
        if now.month == 1:
            month = 12
            year = now.year - 1
        else:
            month = now.month - 1
            year = now.year
        last_day = calendar.monthrange(year, month)[1]
        actual_reset_day = min(reset_day, last_day)
        return datetime(year, month, actual_reset_day, tzinfo=timezone.utc)

@router.get("/quotas", response_model=List[AiQuotaResponse])
async def get_quotas(db: AsyncSession = Depends(get_db)):
    # 1. Fetch quotas
    result = await db.execute(select(AiProviderQuota))
    quotas = result.scalars().all()
    
    response_list = []
    
    # 2. For each quota, calculate current usage since its reset day
    for q in quotas:
        start_date = get_current_billing_period_start(q.reset_day_of_month)
        next_date = get_next_reset_date(q.reset_day_of_month)
        
        # Query usage in this billing period for this account
        usage_query = select(func.sum(AiUsageLog.cost_usd)).where(
            AiUsageLog.account_name == q.account_name,
            AiUsageLog.created_at >= start_date
        )
        usage_result = await db.execute(usage_query)
        current_usage = usage_result.scalar() or 0.0
        
        # Calculate derived fields
        percent = (current_usage / q.limit_usd * 100) if q.limit_usd > 0 else 0
        days_until = (next_date - datetime.now(timezone.utc)).days
        
        resp = AiQuotaResponse.model_validate(q)
        resp.current_usage_usd = round(current_usage, 4)
        resp.percent_used = round(percent, 1)
        resp.days_until_reset = days_until
        
        response_list.append(resp)
        
    return response_list

@router.post("/quotas", response_model=AiQuotaResponse)
async def create_quota(
    quota_in: AiQuotaBase,
    db: AsyncSession = Depends(get_db)
):
    # Upsert logic (simplificado)
    result = await db.execute(select(AiProviderQuota).where(AiProviderQuota.account_name == quota_in.account_name))
    existing = result.scalar_one_or_none()
    
    if existing:
        existing.limit_usd = quota_in.limit_usd
        existing.reset_day_of_month = quota_in.reset_day_of_month
        await db.commit()
        await db.refresh(existing)
        return await _enrich_quota(existing, db)
    else:
        db_quota = AiProviderQuota(**quota_in.model_dump())
        db.add(db_quota)
        await db.commit()
        await db.refresh(db_quota)
        return await _enrich_quota(db_quota, db)

async def _enrich_quota(q: AiProviderQuota, db: AsyncSession):
    start_date = get_current_billing_period_start(q.reset_day_of_month)
    next_date = get_next_reset_date(q.reset_day_of_month)
    
    usage_query = select(func.sum(AiUsageLog.cost_usd)).where(
        AiUsageLog.account_name == q.account_name,
        AiUsageLog.created_at >= start_date
    )
    usage_result = await db.execute(usage_query)
    current_usage = usage_result.scalar() or 0.0
    
    percent = (current_usage / q.limit_usd * 100) if q.limit_usd > 0 else 0
    days_until = (next_date - datetime.now(timezone.utc)).days
    
    resp = AiQuotaResponse.model_validate(q)
    resp.current_usage_usd = round(current_usage, 4)
    resp.percent_used = round(percent, 1)
    resp.days_until_reset = days_until
    return resp

