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

@router.get("/indicators")
async def get_indicators():
    """Trả về tất cả macro indicators (VN + global)."""
    vn_file = CACHE_DIR / "macro_vn.json"
    global_file = CACHE_DIR / "macro_global.json"

    vn_data = json.loads(vn_file.read_text(encoding="utf-8")) if vn_file.exists() else {}
    global_data = json.loads(global_file.read_text(encoding="utf-8")) if global_file.exists() else {}

    return JSONResponse({
        "vn": vn_data,
        "global": global_data,
    })

@router.get("/overview")
async def get_overview():
    """Thị trường tổng quát + 7 tabs."""
    f = CACHE_DIR / "overview_market.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(f.read_text(encoding="utf-8")))

@router.get("/news")
async def get_news(limit: int = 50):
    """Tin tức tài chính."""
    f = CACHE_DIR / "overview_market.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)

    data = json.loads(f.read_text(encoding="utf-8"))
    news = data.get("news", {})

    return JSONResponse({
        "global_news": news.get("global", [])[:limit],
        "by_ticker": news.get("by_ticker", {}),
    })
