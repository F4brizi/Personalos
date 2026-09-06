from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from uuid import UUID

class AiUsageBase(BaseModel):
    account_name: str
    provider: str
    model_name: str
    category: Optional[str] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    duration_seconds: Optional[float] = None
    used_tools: bool = False
    notes: Optional[str] = None

class AiUsageCreate(AiUsageBase):
    pass

class AiUsageUpdate(BaseModel):
    category: Optional[str] = None
    notes: Optional[str] = None

class AiUsageResponse(AiUsageBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class AiUsageStats(BaseModel):
    total_cost_usd: float
    total_prompt_tokens: int
    total_completion_tokens: int
    total_requests: int
    by_account: Dict[str, float]  # cuenta -> costo usd
    by_model: Dict[str, int]      # modelo -> cant peticiones
    by_category: Dict[str, int]   # categoria -> cant peticiones
