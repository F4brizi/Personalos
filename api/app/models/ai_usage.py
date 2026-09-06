from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid

from app.models.base import Base

class AiUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identificación de la cuenta (para multi-cuenta)
    account_name = Column(String, index=True, nullable=False) # ej: "personal_openai", "work_anthropic"
    provider = Column(String, index=True, nullable=False)     # ej: "openai", "anthropic", "google"
    
    # Contexto del uso
    model_name = Column(String, index=True, nullable=False)   # ej: "gpt-4o", "claude-3-5-sonnet"
    category = Column(String, index=True)                     # ej: "coding", "research"
    
    # Métricas principales
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Analíticas de costos y rendimiento
    cost_usd = Column(Float, default=0.0)
    duration_seconds = Column(Float)
    used_tools = Column(Boolean, default=False)
    
    # Notas adicionales y timestamps
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AiProviderQuota(Base):
    __tablename__ = "ai_provider_quotas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_name = Column(String, index=True, nullable=False, unique=True)
    provider = Column(String, nullable=False)
    
    # Límites monetarios o de tokens (usaremos USD por simplicidad)
    limit_usd = Column(Float, default=0.0)
    
    # Control de reseteo
    reset_day_of_month = Column(Integer, default=1)  # Día 1 del mes por defecto
    
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
