import asyncio
import os
import httpx
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from arq.connections import RedisSettings

# Variables para importar correctamente dentro de Docker
import sys
sys.path.append("/app")

from app.core.database import AsyncSessionLocal
from app.models.weather import WeatherLocation, WeatherLog

# Traducir los códigos WMO de Open-Meteo a texto simple
WMO_CODES = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna densa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia fuerte",
    71: "Nieve ligera",
    73: "Nieve moderada",
    75: "Nieve fuerte",
    80: "Chubascos ligeros",
    81: "Chubascos moderados",
    82: "Chubascos violentos",
    95: "Tormenta",
    96: "Tormenta con granizo ligero",
    99: "Tormenta con granizo fuerte",
}

async def fetch_weather_for_location(session: AsyncSession, location: WeatherLocation):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "timezone": "America/Argentina/Buenos_Aires",
        "forecast_days": 1
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
    daily = data.get("daily", {})
    if not daily or "time" not in daily or len(daily["time"]) == 0:
        return
        
    today_date_str = daily["time"][0]
    today_date = date.fromisoformat(today_date_str)
    t_max = daily["temperature_2m_max"][0]
    t_min = daily["temperature_2m_min"][0]
    precip_prob = daily["precipitation_probability_max"][0]
    code = daily["weather_code"][0]
    
    condition = WMO_CODES.get(code, "Desconocido")

    stmt = select(WeatherLog).where(
        WeatherLog.location_id == location.id,
        WeatherLog.log_date == today_date
    )
    result = await session.execute(stmt)
    existing_log = result.scalar_one_or_none()
    
    if existing_log:
        existing_log.temperature_max = t_max
        existing_log.temperature_min = t_min
        existing_log.precipitation_probability = precip_prob
        existing_log.weather_condition = condition
    else:
        new_log = WeatherLog(
            location_id=location.id,
            log_date=today_date,
            temperature_max=t_max,
            temperature_min=t_min,
            precipitation_probability=precip_prob,
            weather_condition=condition
        )
        session.add(new_log)
        
    await session.commit()
    print(f"Clima actualizado para {location.name}: {condition}, {t_max}°C max, Lluvia: {precip_prob}%")


async def sync_daily_weather(ctx):
    print("Iniciando tarea: Sincronizacion diaria del clima...")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(WeatherLocation).where(WeatherLocation.is_active == True))
        locations = result.scalars().all()
        
        for loc in locations:
            try:
                await fetch_weather_for_location(session, loc)
            except Exception as e:
                print(f"Error procesando el clima para {loc.name}: {e}")
                
    print("Sincronizacion de clima terminada.")


redis_host = os.getenv("REDIS_HOST", "redis")
redis_port = int(os.getenv("REDIS_PORT", 6379))

class WorkerSettings:
    functions = [sync_daily_weather]
    redis_settings = RedisSettings(host=redis_host, port=redis_port)
    
    from arq.cron import cron
    cron_jobs = [
        cron(sync_daily_weather, minute=set(range(0, 60, 1))) # RUN EVERY MINUTE FOR TESTING
    ]
