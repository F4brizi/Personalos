from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis import get_redis_client
import app.models  # Registrar todos los modelos en Base.metadata
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización: crear tablas si no existen en la BD
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Comprobar conexión con Redis
    try:
        redis = get_redis_client()
        await redis.ping()
        await redis.aclose()
    except Exception as e:
        print(f"[Warning] Redis no disponible al inicio: {e}")

    yield

    # Cierre de conexiones
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API centralizada para Personal OS: Finanzas (Mercado Pago), Enfoque (Pomodoro), Integraciones e Ingesta Móvil.",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS
origins = list(settings.CORS_ORIGINS) if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)
if settings.NGROK_DOMAIN:
    origins.append(f"https://{settings.NGROK_DOMAIN}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas de la API v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/api/v1/health"
    }
