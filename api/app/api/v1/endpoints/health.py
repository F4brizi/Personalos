import time
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.schemas.health import HealthResponse, ServiceStatus

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def check_health(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis)
):
    services = {}
    overall_status = "healthy"

    # Chequeo de PostgreSQL
    db_start = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        db_latency = (time.perf_counter() - db_start) * 1000
        services["database"] = ServiceStatus(
            status="healthy",
            latency_ms=round(db_latency, 2),
            details=f"PostgreSQL en {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}"
        )
    except Exception as e:
        overall_status = "degraded"
        services["database"] = ServiceStatus(
            status="unhealthy",
            latency_ms=0.0,
            details=str(e)
        )

    # Chequeo de Redis
    redis_start = time.perf_counter()
    try:
        await redis.ping()
        redis_latency = (time.perf_counter() - redis_start) * 1000
        services["redis"] = ServiceStatus(
            status="healthy",
            latency_ms=round(redis_latency, 2),
            details=f"Redis en {settings.REDIS_HOST}:{settings.REDIS_PORT}"
        )
    except Exception as e:
        overall_status = "degraded"
        services["redis"] = ServiceStatus(
            status="unhealthy",
            latency_ms=0.0,
            details=str(e)
        )

    return HealthResponse(
        status=overall_status,
        environment=settings.ENVIRONMENT,
        version="1.0.0",
        services=services
    )
