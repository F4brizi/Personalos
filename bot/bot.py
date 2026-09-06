import os
import re
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


def is_authorized(update: Update) -> bool:
    if not ALLOWED_USER_ID:
        return True
    return str(update.effective_user.id) == str(ALLOWED_USER_ID)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        await update.message.reply_text("⛔ No tienes autorización para usar este bot.")
        return

    msg = (
        "👋 ¡Hola! Soy tu bot de **Personal OS**.\n\n"
        "Comandos y atajos rápidos:\n"
        "• `/gasto [monto] [categoría] [descripción]` (o texto natural: `gasto 4500 cafe`)\n"
        "• `/pomodoro [minutos] [proyecto]` (ej: `/pomodoro 25 Personal OS`)\n"
        "• `/hoy` : Resumen del día (enfoque y finanzas)\n"
        "• `/salud` : Estado de la API y base de datos"
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
                db_status = data["services"]["database"]["status"]
                redis_status = data["services"]["redis"]["status"]
                await update.message.reply_text(
                    f"✅ **Personal OS Activo**\n• Estado: {data['status']}\n• DB: {db_status}\n• Redis: {redis_status}",
                    parse_mode="Markdown"
                )
            else:
                await update.message.reply_text(f"⚠️ Error al consultar la API: {resp.status_code}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error de conexión con la API: {str(e)}")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    text = update.message.text.strip()
    
    # Detección simple de formato "gasto 12000 almuerzo" o "gasto $12000 almuerzo"
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
                    await update.message.reply_text(
                        f"✅ **Gasto guardado exitosamente**\n• Monto: -${amount:,.2f}\n• Detalle: {desc}",
                        parse_mode="Markdown"
                    )
                    return
                else:
                    await update.message.reply_text(f"⚠️ Error al guardar: {res.text}")
                    return
        except Exception as e:
            await update.message.reply_text(f"❌ Error conectando a la API: {str(e)}")
            return

    await update.message.reply_text(
        "💡 Comando no reconocido. Prueba con:\n`gasto 3500 cena` o `/hoy`",
        parse_mode="Markdown"
    )


def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN no configurado. El bot no se iniciará.")
        return

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("salud", health_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("Bot de Telegram iniciado en modo polling...")
    app.run_polling()


if __name__ == "__main__":
    main()
