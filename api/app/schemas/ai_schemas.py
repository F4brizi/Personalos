from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

class AiMessageSchema(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AiThreadCreate(BaseModel):
    title: Optional[str] = "Nuevo chat"

class AiThreadResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    created_at: datetime
    messages: List[AiMessageSchema] = []
    
    class Config:
        from_attributes = True

class AiMessageCreate(BaseModel):
    content: str
