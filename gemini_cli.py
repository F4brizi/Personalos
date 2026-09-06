import os
import json
import time
import urllib.request
import urllib.error
from datetime import datetime

# ==========================================
# CONFIGURACIÓN
# ==========================================
# Obtén tu API Key gratis en: https://aistudio.google.com/
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "PONE_TU_API_KEY_AQUI_SI_NO_USAS_ENV")
MODEL = "gemini-1.5-flash"  # Modelo rápido y económico
PERSONAL_OS_API = "http://localhost:8000/api/v1/ai/"

# Precios aproximados por millón de tokens (Flash)
COST_PER_1M_PROMPT = 0.075 
COST_PER_1M_COMPLETION = 0.30

def ask_gemini(prompt: str):
    if GEMINI_API_KEY == "PONE_TU_API_KEY_AQUI_SI_NO_USAS_ENV":
        print("❌ ERROR: Debes configurar tu GEMINI_API_KEY en el script.")
        return

    print(f"\n🧠 Consultando a {MODEL}...")
    start_time = time.time()

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            end_time = time.time()
            duration = round(end_time - start_time, 2)
            
            # Extraer respuesta
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # Extraer tokens reales que nos devuelve la API de Google
            usage = result.get('usageMetadata', {})
            prompt_tokens = usage.get('promptTokenCount', 0)
            completion_tokens = usage.get('candidatesTokenCount', 0)
            
            # Calcular costo en centavos de dólar
            cost_usd = (prompt_tokens / 1_000_000 * COST_PER_1M_PROMPT) + (completion_tokens / 1_000_000 * COST_PER_1M_COMPLETION)

            print("\n" + "="*50)
            print("🤖 RESPUESTA:")
            print("="*50)
            print(text_response)
            print("\n" + "="*50)
            
            # Registrar en Personal OS
            log_to_personal_os(prompt_tokens, completion_tokens, cost_usd, duration)

    except urllib.error.HTTPError as e:
        print(f"❌ Error HTTP de Gemini: {e.code} {e.reason}")
        print(e.read().decode())
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def log_to_personal_os(prompt_t, comp_t, cost, duration):
    payload = {
        "account_name": "gemini_api",
        "provider": "google",
        "model_name": MODEL,
        "category": "cli_chat",
        "prompt_tokens": prompt_t,
        "completion_tokens": comp_t,
        "cost_usd": cost,
        "duration_seconds": duration,
        "used_tools": False,
        "notes": "Consulta desde script Python CLI"
    }
    
    req = urllib.request.Request(PERSONAL_OS_API, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print(f"✅ Consumo registrado en Personal OS: {prompt_t+comp_t} tokens | ${cost:.6f} USD | {duration}s")
    except urllib.error.URLError as e:
        print(f"⚠️ No se pudo conectar a Personal OS (¿está corriendo Docker?): {e}")

if __name__ == "__main__":
    print("=== GEMINI CLI - CONECTADO A PERSONAL OS ===")
    print("Escribe 'salir' para terminar.")
    while True:
        user_input = input("\n> Tu pregunta: ")
        if user_input.lower() in ['salir', 'exit', 'quit']:
            break
        
        ask_gemini(user_input)
