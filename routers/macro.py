from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()
CACHE_DIR = Path("cache")

@router.get("/cache")
async def get_macro_cache():
    """Trả về cache JSON macro."""
    cache_file = CACHE_DIR / "macro_vn.json"
    if not cache_file.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(cache_file.read_text(encoding="utf-8")))

@router.get("/vn")
async def get_macro_vn():
    f = CACHE_DIR / "macro_vn.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(f.read_text(encoding="utf-8")))

@router.get("/global")
async def get_macro_global():
    f = CACHE_DIR / "macro_global.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(f.read_text(encoding="utf-8")))
