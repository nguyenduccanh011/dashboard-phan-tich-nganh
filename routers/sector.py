from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()
CACHE_DIR = Path("cache")

@router.get("/{code}/cache")
async def get_sector_cache(code: str):
    """Trả về cache JSON cho một ngành."""
    cache_file = CACHE_DIR / f"sector_{code.replace('-', '_')}.json"
    if not cache_file.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(cache_file.read_text(encoding="utf-8")))
