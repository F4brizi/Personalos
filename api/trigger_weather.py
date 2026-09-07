import asyncio
from arq import create_pool
from arq.connections import RedisSettings

async def trigger():
    redis = await create_pool(RedisSettings(host='redis', port=6379))
    await redis.enqueue_job('sync_daily_weather')
    print("Tarea enviada a la cola de ARQ!")

if __name__ == '__main__':
    asyncio.run(trigger())
