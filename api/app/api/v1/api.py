from fastapi import APIRouter
from app.api.v1.endpoints import health, transactions, pomodoro

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health & Status"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Finanzas & Mercado Pago"])
api_router.include_router(pomodoro.router, prefix="/pomodoro", tags=["Enfoque & Pomodoro"])
