import os
from datetime import datetime

OBSIDIAN_MOUNT = "/obsidian"

def get_full_path(relative_path: str) -> str:
    safe_path = os.path.normpath(f"/{relative_path}").lstrip("/")
    full_path = os.path.join(OBSIDIAN_MOUNT, safe_path)
    if not full_path.startswith(OBSIDIAN_MOUNT):
        raise ValueError("Path inválido")
    return full_path

def search_obsidian(query: str, limit: int = 20) -> list[dict]:
    """Busca un texto dentro de todas las notas de Obsidian y devuelve los resultados."""
    if not os.path.exists(OBSIDIAN_MOUNT):
        return [{"error": "Bóveda no montada"}]
        
    results = []
    for root, _, files in os.walk(OBSIDIAN_MOUNT):
        if ".obsidian" in root:
            continue
        for file in files:
            if file.endswith(".md"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if query.lower() in content.lower() or query.lower() in file.lower():
                            rel_path = os.path.relpath(full_path, OBSIDIAN_MOUNT)
                            results.append({
                                "path": rel_path,
                                "snippet": content[:1500]
                            })
                            if len(results) >= limit:
                                return results
                except Exception:
                    pass
    return results

def read_obsidian_note(path: str) -> str:
    """Lee el contenido completo de una nota específica de Obsidian dado su path relativo."""
    if not path.endswith(".md"):
        path += ".md"
    try:
        full_path = get_full_path(path)
        if not os.path.exists(full_path):
            return "Error: Nota no encontrada"
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error: {str(e)}"

def append_obsidian_note(path: str, content: str) -> str:
    """Agrega texto al final de una nota específica de Obsidian. Si no existe, la crea."""
    if not path.endswith(".md"):
        path += ".md"
    try:
        full_path = get_full_path(path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'a', encoding='utf-8') as f:
            if os.path.exists(full_path) and os.path.getsize(full_path) > 0:
                f.write("\n\n")
            f.write(content)
        return "Nota actualizada exitosamente"
    except Exception as e:
        return f"Error: {str(e)}"
