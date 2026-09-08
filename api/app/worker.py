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
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
        "timezone": "America/Argentina/Buenos_Aires",
        "past_days": 2,
        "forecast_days": 2
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
    daily = data.get("daily", {})
    if not daily or "time" not in daily or len(daily["time"]) == 0:
        return
        
    today = date.today()

    for i in range(len(daily["time"])):
        day_str = daily["time"][i]
        dt = date.fromisoformat(day_str)
        
        t_max = daily["temperature_2m_max"][i]
        t_min = daily["temperature_2m_min"][i]
        precip_prob = daily["precipitation_probability_max"][i]
        precip_mm = daily["precipitation_sum"][i]
        code = daily["weather_code"][i]
        
        if code is None:
            continue
            
        condition = WMO_CODES.get(code, "Desconocido")

        stmt = select(WeatherLog).where(
            WeatherLog.location_id == location.id,
            WeatherLog.log_date == dt
        )
        result = await session.execute(stmt)
        existing_log = result.scalar_one_or_none()
        
        if existing_log:
            # Update real temps and precipitation_mm ALWAYS
            if t_max is not None: existing_log.temperature_max = t_max
            if t_min is not None: existing_log.temperature_min = t_min
            if precip_mm is not None: existing_log.precipitation_mm = precip_mm
            
            # ONLY update probability and condition if it's today (forecast) or it was empty
            if dt >= today or existing_log.precipitation_probability is None:
                if precip_prob is not None: existing_log.precipitation_probability = precip_prob
                existing_log.weather_condition = condition
        else:
            # Create new
            new_log = WeatherLog(
                location_id=location.id,
                log_date=dt,
                temperature_max=t_max,
                temperature_min=t_min,
                precipitation_probability=precip_prob,
                precipitation_mm=precip_mm,
                weather_condition=condition
            )
            session.add(new_log)
            
    await session.commit()
    print(f"Clima sincronizado para {location.name}.")


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


async def backfill_historical_weather(ctx, location_id: str, days_back: int):
    print(f"Iniciando backfill historico para {location_id} ({days_back} dias)...")
    if days_back > 90:
        days_back = 90 # Open-Meteo forecast API max is 92 for past_days

    async with AsyncSessionLocal() as session:
        # Get location
        result = await session.execute(select(WeatherLocation).where(WeatherLocation.id == location_id))
        location = result.scalar_one_or_none()
        
        if not location:
            print("Locacion no encontrada.")
            return

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
            "timezone": "America/Argentina/Buenos_Aires",
            "past_days": days_back,
            "forecast_days": 2
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
        daily = data.get("daily", {})
        if not daily or "time" not in daily:
            return
            
        logs_to_insert = []
        for i in range(len(daily["time"])):
            day_str = daily["time"][i]
            t_max = daily["temperature_2m_max"][i]
            t_min = daily["temperature_2m_min"][i]
            precip_sum = daily["precipitation_sum"][i]
            code = daily["weather_code"][i]
            
            # Skip if any essential data is null (edge case)
            if t_max is None or code is None:
                continue
                
            condition = WMO_CODES.get(code, "Desconocido")
            dt = date.fromisoformat(day_str)
            
            # Check if exists
            stmt = select(WeatherLog).where(
                WeatherLog.location_id == location.id,
                WeatherLog.log_date == dt
            )
            existing = (await session.execute(stmt)).scalar_one_or_none()
            
            if existing:
                if t_max is not None: existing.temperature_max = t_max
                if t_min is not None: existing.temperature_min = t_min
                if precip_sum is not None: existing.precipitation_mm = precip_sum
                
                # Only overwrite condition if we don't have it (we prefer what was recorded on that day if possible)
                if not existing.weather_condition:
                    existing.weather_condition = condition
            else:
                new_log = WeatherLog(
                    location_id=location.id,
                    log_date=dt,
                    temperature_max=t_max,
                    temperature_min=t_min,
                    precipitation_mm=precip_sum,
                    weather_condition=condition
                )
                session.add(new_log)
                
        await session.commit()
    print("Backfill finalizado.")


async def proactive_telegram_bot_task(ctx):
    print("Iniciando tarea: Bot Proactivo...")
    telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
    telegram_user_id = os.getenv("TELEGRAM_ALLOWED_USER_ID")
    
    if not telegram_token or not telegram_user_id:
        print("Faltan credenciales de Telegram para el bot proactivo.")
        return

    # Usar Gemini para generar una pregunta amigable
    from app.services.ai.gemini_provider import GeminiProvider
    from app.models.ai_memory import AiThread
    
    # Necesitamos un thread_id. Podemos crear uno o usar uno hardcodeado.
    # Para simplicidad, podemos usar la API de Telegram directamente con un prompt genérico,
    # o mejor aún, usar genai directamente aquí.
    from google import genai
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return
        
    client = genai.Client(api_key=api_key)
    prompt = "Es de noche (21:00). Escribe un mensaje corto (máximo 2 oraciones) preguntándole a Fabrizio cómo estuvo su dieta hoy, cuántas calorías consumió, cuántos kilómetros corrió, y cómo está su humor."
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        msg_text = response.text
    except Exception as e:
        print(f"Error generando mensaje proactivo: {e}")
        msg_text = "¡Hola Fabrizio! Ya son las 21:00. ¿Cómo estuvo tu día? Contame sobre tu dieta, calorías, kilómetros y humor hoy."

    # Enviar por Telegram
    url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
    payload = {
        "chat_id": telegram_user_id,
        "text": msg_text
    }
    
    async with httpx.AsyncClient() as http_client:
        try:
            res = await http_client.post(url, json=payload)
            print(f"Mensaje proactivo enviado: {res.status_code}")
        except Exception as e:
            print(f"Error enviando telegram: {e}")


redis_host = os.getenv("REDIS_HOST", "redis")
redis_port = int(os.getenv("REDIS_PORT", 6379))

class WorkerSettings:
    functions = [sync_daily_weather, backfill_historical_weather, proactive_telegram_bot_task]
    redis_settings = RedisSettings(host=redis_host, port=redis_port)
    
    from arq.cron import cron
    cron_jobs = [
        cron(sync_daily_weather, minute=set(range(0, 60, 60))), # RUN HOURLY
        cron(proactive_telegram_bot_task, hour=21, minute=0) # PROACTIVE BOT AT 21:00
    ]
