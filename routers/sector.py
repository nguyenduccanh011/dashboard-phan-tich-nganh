from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()
CACHE_DIR = Path("cache")

# Sector name mapping (URL format → cache file format)
SECTOR_MAPPING = {
    'food-and-beverage': 'food_beverage',
    'real-estate': 'realestate',
    'stock': 'securities',  # stock dashboard uses securities data
}

@router.get("/{code}/cache")
async def get_sector_cache(code: str):
    """Trả về cache JSON cho một ngành."""
    # Normalize sector code
    cache_code = SECTOR_MAPPING.get(code, code.replace('-', '_'))
    cache_file = CACHE_DIR / f"sector_{cache_code}.json"

    if not cache_file.exists():
        return JSONResponse({"error": f"cache not found: {cache_file}"}, status_code=404)

    try:
        data = json.loads(cache_file.read_text(encoding="utf-8"))
        return JSONResponse(data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
