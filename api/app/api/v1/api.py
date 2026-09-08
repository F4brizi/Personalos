from fastapi import APIRouter
from app.api.v1.endpoints import health, transactions, pomodoro, ai_usage, weather, ai

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(pomodoro.router, prefix="/pomodoro", tags=["pomodoro"])
api_router.include_router(ai_usage.router, prefix="/ai/usage", tags=["ai_usage"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(ai.router, prefix="/ai/chat", tags=["ai_chat"])
