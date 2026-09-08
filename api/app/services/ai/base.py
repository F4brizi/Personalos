from abc import ABC, abstractmethod
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

class BaseAIProvider(ABC):
    
    @abstractmethod
    async def generate_response(self, session: AsyncSession, thread_id: uuid.UUID, prompt: str) -> str:
        """
        Toma un thread_id, busca el historial en la base de datos, 
        llama a la IA, guarda el nuevo mensaje del usuario y la respuesta de la IA.
        """
        pass
