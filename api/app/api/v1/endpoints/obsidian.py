import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

OBSIDIAN_MOUNT = "/obsidian"

class ObsidianNoteSchema(BaseModel):
    path: str
    content: str
    modified_at: Optional[datetime] = None

class AppendRequest(BaseModel):
    path: str
    content: str

def get_full_path(relative_path: str) -> str:
    safe_path = os.path.normpath(f"/{relative_path}").lstrip("/")
    full_path = os.path.join(OBSIDIAN_MOUNT, safe_path)
    if not full_path.startswith(OBSIDIAN_MOUNT):
        raise HTTPException(status_code=400, detail="Path inválido")
    return full_path

@router.get("/search", response_model=List[ObsidianNoteSchema])
async def search_notes(q: str = Query(..., min_length=2), limit: int = 20):
    if not os.path.exists(OBSIDIAN_MOUNT):
        raise HTTPException(status_code=500, detail="Bóveda no montada")
        
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
                        if q.lower() in content.lower() or q.lower() in file.lower():
                            rel_path = os.path.relpath(full_path, OBSIDIAN_MOUNT)
                            mtime = os.path.getmtime(full_path)
                            results.append(
                                ObsidianNoteSchema(
                                    path=rel_path,
                                    content=content[:1000],
                                    modified_at=datetime.fromtimestamp(mtime)
                                )
                            )
                            if len(results) >= limit:
                                return results
                except Exception:
                    pass
    return results

@router.get("/note", response_model=ObsidianNoteSchema)
async def read_note(path: str):
    if not path.endswith(".md"):
        path += ".md"
    full_path = get_full_path(path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
        mtime = os.path.getmtime(full_path)
    return ObsidianNoteSchema(path=path, content=content, modified_at=datetime.fromtimestamp(mtime))

@router.post("/note/append", response_model=ObsidianNoteSchema)
async def append_to_note(req: AppendRequest):
    path = req.path
    if not path.endswith(".md"):
        path += ".md"
    full_path = get_full_path(path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'a', encoding='utf-8') as f:
        if os.path.exists(full_path) and os.path.getsize(full_path) > 0:
            f.write("\n\n")
        f.write(req.content)
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
        mtime = os.path.getmtime(full_path)
    return ObsidianNoteSchema(path=path, content=content, modified_at=datetime.fromtimestamp(mtime))
