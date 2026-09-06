import sys
import json
import os
import urllib.request
import urllib.error

PERSONAL_OS_API = "http://localhost:8000/api/v1/ai/"
SYNC_FILE = os.path.join(os.path.dirname(__file__), ".last_sync.json")

# Aproximación estándar de tokens: 1 token ≈ 4 caracteres en inglés/código
def estimate_tokens(text):
    return len(str(text)) // 4

def main():
    try:
        # 1. Leer Payload desde STDIN (Antigravity lo envía automáticamente al hacer Stop)
        payload_str = sys.stdin.read()
        if not payload_str.strip():
            print(json.dumps({"decision": "continue", "reason": "Empty payload"}))
            return
            
        payload = json.loads(payload_str)
        transcript_path = payload.get("transcriptPath")
        
        if not transcript_path or not os.path.exists(transcript_path):
            print(json.dumps({"decision": "continue"}))
            return

        # 2. Leer estado de última sincronización
        last_step = 0
        if os.path.exists(SYNC_FILE):
            with open(SYNC_FILE, "r") as f:
                data = json.load(f)
                # Asegurarnos de que el sync corresponde a esta misma conversación
                if data.get("conversationId") == payload.get("conversationId"):
                    last_step = data.get("lastStep", 0)

        # 3. Analizar nuevos pasos en el transcript
        prompt_chars = 0
        completion_chars = 0
        max_step_seen = last_step
        
        with open(transcript_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                step = json.loads(line)
                idx = step.get("step_index", 0)
                
                if idx > last_step:
                    source = step.get("source")
                    content = step.get("content", "")
                    thinking = step.get("thinking", "")
                    
                    if source == "USER_EXPLICIT":
                        prompt_chars += len(content)
                    elif source == "MODEL":
                        completion_chars += len(content) + len(thinking)
                        # Sumar llamadas a herramientas
                        tools = step.get("tool_calls", [])
                        for t in tools:
                            completion_chars += len(json.dumps(t))
                            
                    max_step_seen = max(max_step_seen, idx)
                    
        # 4. Si hay consumo nuevo, calcular y hacer POST
        if max_step_seen > last_step and (prompt_chars > 0 or completion_chars > 0):
            prompt_tokens = estimate_tokens(prompt_chars)
            comp_tokens = estimate_tokens(completion_chars)
            
            # Precios de Gemini 1.5 Pro (lo que usa Antigravity)
            # $3.50 / 1M prompt (promedio) | $10.50 / 1M completion
            cost_usd = (prompt_tokens / 1_000_000 * 3.50) + (comp_tokens / 1_000_000 * 10.50)
            
            api_payload = {
                "account_name": "gemini_advanced",
                "provider": "google",
                "model_name": "gemini-1.5-pro", # Antigravity model
                "category": "agent_coding",
                "prompt_tokens": prompt_tokens,
                "completion_tokens": comp_tokens,
                "cost_usd": cost_usd,
                "duration_seconds": 0.0,
                "used_tools": True,
                "notes": f"Antigravity Agent (Steps {last_step}-{max_step_seen})"
            }
            
            req = urllib.request.Request(PERSONAL_OS_API, data=json.dumps(api_payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            try:
                urllib.request.urlopen(req)
            except Exception:
                pass # Ignorar errores de red para no frenar al agente
                
            # Guardar marcador
            with open(SYNC_FILE, "w") as f:
                json.dump({"conversationId": payload.get("conversationId"), "lastStep": max_step_seen}, f)

        # 5. Obligatorio devolver un JSON vacío o válido a Antigravity para que continúe
        print(json.dumps({"decision": "allow"}))
        
    except Exception as e:
        # Fallback seguro
        print(json.dumps({"decision": "allow", "reason": f"Hook error: {e}"}))

if __name__ == "__main__":
    main()
