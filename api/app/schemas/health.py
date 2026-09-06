from typing import Dict
from pydantic import BaseModel


class ServiceStatus(BaseModel):
    status: str
    latency_ms: float
    details: str = ""


class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str
    services: Dict[str, ServiceStatus]
