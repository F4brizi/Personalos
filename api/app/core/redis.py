from typing import AsyncGenerator
import redis.asyncio as aioredis
from app.core.config import settings

redis_pool = aioredis.ConnectionPool.from_url(
    settings.redis_url,
    decode_responses=True
)


def get_redis_client() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=redis_pool)


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    client = get_redis_client()
    try:
        yield client
    finally:
        await client.aclose()
