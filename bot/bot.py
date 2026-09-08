import os
import re
import json
import logging
import httpx
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

API_BASE_URL = os.getenv("API_BASE_URL", "http://api:8000/api/v1")
ALLOWED_USER_ID = os.getenv("TELEGRAM_ALLOWED_USER_ID", "")

# State for the thread
THREAD_FILE = "thread_state.json"

def get_thread_id() -> str:
    if os.path.exists(THREAD_FILE):
        with open(THREAD_FILE, "r") as f:
            data = json.load(f)
            return data.get("thread_id")
    return None

def save_thread_id(thread_id: str):
    with open(THREAD_FILE, "w") as f:
        json.dump({"thread_id": thread_id}, f)

def is_authorized(update: Update) -> bool:
    if not ALLOWED_USER_ID:
        return True
    return str(update.effective_user.id) == str(ALLOWED_USER_ID)

async def ensure_thread() -> str:
    thread_id = get_thread_id()
    async with httpx.AsyncClient(timeout=10.0) as client:
        if thread_id:
            # Verify if it exists
            res = await client.get(f"{API_BASE_URL}/ai/chat/thread/{thread_id}")
            if res.status_code == 200:
                return thread_id
        
        # Create new
        res = await client.post(f"{API_BASE_URL}/ai/chat/thread", json={"title": "Telegram Chat"})
        if res.status_code == 200:
            new_id = res.json()["id"]
            save_thread_id(new_id)
            return new_id
    return None

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        await update.message.reply_text("No tienes autorización para usar este bot.")
        return

    msg = (
        "¡Hola! Soy tu bot de **Personal OS**.\n\n"
        "Comandos rápidos:\n"
        "• `gasto 4500 cafe`\n"
        "• `/hoy` : Resumen del día\n"
        "• `/salud` : Estado de la API\n\n"
        "O simplemente **háblame o mándame un audio** y usaré mis herramientas (Obsidian) para ayudarte."
    )
    await update.message.reply_text(msg, parse_mode="Markdown")

async def health_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_BASE_URL}/health")
            if resp.status_code == 200:
                data = resp.json()
                await update.message.reply_text(
                    f"**Personal OS Activo**\nEstado: {data['status']}",
                    parse_mode="Markdown"
                )
    except Exception as e:
        await update.message.reply_text(f"Error de conexión con la API: {str(e)}")

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    text = update.message.text.strip()
    
    gasto_match = re.match(r"(?i)^gasto\s+\$?(\d+(?:[.,]\d+)?)\s*(.*)$", text)
    if gasto_match:
        amount = float(gasto_match.group(1).replace(",", "."))
        desc = gasto_match.group(2).strip() or "Gasto registrado desde Telegram"
        payload = {
            "date": update.message.date.isoformat(),
            "amount": -abs(amount),
            "currency": "ARS",
            "description": desc,
            "category": "Sin categorizar",
            "payment_method": "Mercado Pago",
            "type": "expense",
            "is_reconciled": False,
            "notes": "Registrado vía Telegram Bot"
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(f"{API_BASE_URL}/transactions", json=payload)
                if res.status_code == 201:
                    await update.message.reply_text(f"**Gasto guardado exitosamente**\nMonto: -${amount:,.2f}\nDetalle: {desc}", parse_mode="Markdown")
                    return
        except Exception:
            pass

    # Send to AI
    await update.message.chat.send_action(action="typing")
    try:
        thread_id = await ensure_thread()
        if not thread_id:
            await update.message.reply_text("Error creando hilo de chat.")
            return

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{API_BASE_URL}/ai/chat/thread/{thread_id}/message", 
                json={"content": text}
            )
            if res.status_code == 200:
                await update.message.reply_text(res.json()["response"])
            else:
                await update.message.reply_text(f"Error de la IA: {res.text}")
    except Exception as e:
        await update.message.reply_text(f"Error comunicando con la IA: {str(e)}")

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    await update.message.chat.send_action(action="record_voice")
    try:
        voice = update.message.voice or update.message.audio
        if not voice:
            return
            
        file = await context.bot.get_file(voice.file_id)
        audio_bytes = await file.download_as_bytearray()

        thread_id = await ensure_thread()
        if not thread_id:
            await update.message.reply_text("Error creando hilo de chat.")
            return

        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {'file': ('audio.ogg', bytes(audio_bytes), 'audio/ogg')}
            res = await client.post(
                f"{API_BASE_URL}/ai/chat/thread/{thread_id}/audio",
                files=files
            )
            if res.status_code == 200:
                await update.message.reply_text(res.json()["response"])
            else:
                await update.message.reply_text(f"Error de la IA: {res.text}")
    except Exception as e:
        logger.error(str(e))
        await update.message.reply_text(f"Error procesando el audio: {str(e)}")


def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN no configurado. El bot no se iniciará.")
        return

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("salud", health_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, handle_voice))

    logger.info("Bot de Telegram iniciado en modo polling...")
    app.run_polling()


if __name__ == "__main__":
    main()
