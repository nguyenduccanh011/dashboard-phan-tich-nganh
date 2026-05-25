from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()
CACHE_DIR = Path("cache")

@router.get("/{ticker}/cache")
async def get_stock_cache(ticker: str):
    """Trả về cache JSON cho một mã cổ phiếu."""
    cache_file = CACHE_DIR / f"stock_{ticker.upper()}.json"
    if not cache_file.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(cache_file.read_text(encoding="utf-8")))
