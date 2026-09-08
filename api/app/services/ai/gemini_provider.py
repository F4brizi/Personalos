import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from google import genai
from google.genai import types

from app.core.config import settings
from app.models.ai_memory import AiThread, AiMessage
from app.services.ai.base import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    def __init__(self):
        # Inicializa el cliente de Gemini
        if not settings.GEMINI_API_KEY:
            print("[Warning] GEMINI_API_KEY no configurada. Las llamadas a la IA fallarán.")
            self.client = None
        else:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash" # o pro

    async def generate_response(self, session: AsyncSession, thread_id: uuid.UUID, prompt: str) -> str:
        if not self.client:
            raise ValueError("GEMINI_API_KEY no está configurada en .env")
        # 1. Obtener el historial del thread
        result = await session.execute(select(AiThread).where(AiThread.id == thread_id))
        thread = result.scalar_one_or_none()
        
        if not thread:
            raise ValueError("Thread no encontrado")

        # 2. Buscar mensajes anteriores y ordenarlos
        msg_result = await session.execute(
            select(AiMessage)
            .where(AiMessage.thread_id == thread_id)
            .order_by(AiMessage.created_at)
        )
        history_messages = msg_result.scalars().all()

        # 3. Guardar el nuevo mensaje del usuario
        user_msg = AiMessage(thread_id=thread_id, role="user", content=prompt)
        session.add(user_msg)
        await session.commit()
        await session.refresh(user_msg)

        # 4. Formatear historial para google-genai
        contents = []
        for msg in history_messages:
            role = "user" if msg.role == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
        
        # 5. Configurar herramientas y llamar a Gemini
        from app.services.ai.obsidian_tools import search_obsidian, read_obsidian_note, append_obsidian_note
        tools = [search_obsidian, read_obsidian_note, append_obsidian_note]
        
        try:
            config = types.GenerateContentConfig(
                tools=tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False)
            )
            
            # Crear un objeto de chat con el historial previo
            chat = self.client.chats.create(
                model=self.model_name,
                history=contents,
                config=config
            )
            
            # Enviar el nuevo prompt
            response = chat.send_message(prompt)
            reply_text = response.text
        except Exception as e:
            reply_text = f"Error llamando a Gemini: {str(e)}"

        # 6. Guardar la respuesta del modelo en la base de datos
        model_msg = AiMessage(thread_id=thread_id, role="model", content=reply_text)
        session.add(model_msg)
        await session.commit()
        
        return reply_text

    async def generate_response_audio(self, session: AsyncSession, thread_id: uuid.UUID, audio_bytes: bytes, mime_type: str) -> str:
        if not self.client:
            raise ValueError("GEMINI_API_KEY no está configurada")
        
        result = await session.execute(select(AiThread).where(AiThread.id == thread_id))
        if not result.scalar_one_or_none():
            raise ValueError("Thread no encontrado")

        msg_result = await session.execute(
            select(AiMessage).where(AiMessage.thread_id == thread_id).order_by(AiMessage.created_at)
        )
        history_messages = msg_result.scalars().all()

        user_msg = AiMessage(thread_id=thread_id, role="user", content="[Nota de voz]")
        session.add(user_msg)
        await session.commit()
        await session.refresh(user_msg)

        contents = []
        for msg in history_messages:
            role = "user" if msg.role == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))

        from app.services.ai.obsidian_tools import search_obsidian, read_obsidian_note, append_obsidian_note
        tools = [search_obsidian, read_obsidian_note, append_obsidian_note]
        
        try:
            config = types.GenerateContentConfig(
                tools=tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False)
            )
            chat = self.client.chats.create(model=self.model_name, history=contents, config=config)
            
            audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
            response = chat.send_message(audio_part)
            reply_text = response.text
        except Exception as e:
            reply_text = f"Error llamando a Gemini con audio: {str(e)}"

        model_msg = AiMessage(thread_id=thread_id, role="model", content=reply_text)
        session.add(model_msg)
        await session.commit()
        
        return reply_text
