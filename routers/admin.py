"""
Admin Router — quản lý cache, refresh manual, logs.

Endpoints:
  POST /api/admin/refresh-all — chạy tất cả collectors
  POST /api/admin/refresh/{collector} — chạy 1 collector
  GET /api/admin/status — trạng thái cache
  GET /api/admin/logs — logs
"""
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()
CACHE_DIR = Path("cache")
logger = logging.getLogger(__name__)

# Mapping collector names to modules (dynamic import)
COLLECTOR_MODULES = {
    "macro": "collectors.macro_collector",
    "enterprise": "collectors.enterprise_collector",
    "overview": "collectors.overview_collector",
    "steel": "collectors.steel_collector",
    "bank": "collectors.bank_collector",
    "cement": "collectors.cement_collector",
    "electricity": "collectors.electricity_collector",
}


@router.get("/status")
async def get_cache_status():
    """Trạng thái cache hiện tại."""
    status = {}

    for cache_file in CACHE_DIR.glob("*.json"):
        try:
            mtime = cache_file.stat().st_mtime
            size = cache_file.stat().st_size
            status[cache_file.name] = {
                "exists": True,
                "size_bytes": size,
                "last_updated": datetime.fromtimestamp(mtime).isoformat(),
            }
        except Exception as e:
            status[cache_file.name] = {"error": str(e)}

    return JSONResponse({
        "cache_dir": str(CACHE_DIR),
        "cache_files": status,
        "checked_at": datetime.now().isoformat(),
    })


@router.post("/refresh-all")
async def refresh_all(background_tasks: BackgroundTasks):
    """Chạy tất cả collectors (background task)."""
    try:
        from app import refresh_all_caches
        background_tasks.add_task(refresh_all_caches)
        return JSONResponse({
            "status": "started",
            "message": "Refresh all collectors started in background",
            "started_at": datetime.now().isoformat(),
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start refresh: {str(e)}")


@router.post("/refresh/{collector_name}")
async def refresh_collector(collector_name: str, background_tasks: BackgroundTasks):
    """Chạy 1 collector cụ thể."""
    module_path = COLLECTOR_MODULES.get(collector_name)
    if not module_path:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown collector: {collector_name}. Available: {list(COLLECTOR_MODULES.keys())}"
        )

    async def run_collector():
        try:
            module = __import__(module_path, fromlist=["collect"])
            await module.collect()
            logger.info(f"[{collector_name}] refresh completed")
        except Exception as e:
            logger.error(f"[{collector_name}] refresh failed: {e}")

    background_tasks.add_task(run_collector)
    return JSONResponse({
        "status": "started",
        "collector": collector_name,
        "message": f"Refreshing {collector_name} in background",
        "started_at": datetime.now().isoformat(),
    })


@router.get("/cache-files")
async def list_cache_files():
    """Danh sách tất cả cache files."""
    files = []
    for cache_file in CACHE_DIR.glob("*.json"):
        try:
            size = cache_file.stat().st_size
            files.append({
                "name": cache_file.name,
                "size_bytes": size,
                "size_mb": round(size / 1024 / 1024, 2),
            })
        except Exception:
            pass

    files.sort(key=lambda x: x["name"])
    return JSONResponse({
        "cache_dir": str(CACHE_DIR),
        "total_files": len(files),
        "files": files,
    })


@router.delete("/clear-cache")
async def clear_cache(confirm: str = "no"):
    """Xóa tất cả cache files (danger!)."""
    if confirm.lower() != "yes":
        return JSONResponse(
            {"status": "not confirmed", "message": "Pass ?confirm=yes to clear cache"},
            status_code=400
        )

    deleted = []
    for cache_file in CACHE_DIR.glob("*.json"):
        try:
            cache_file.unlink()
            deleted.append(cache_file.name)
        except Exception as e:
            logger.error(f"Failed to delete {cache_file.name}: {e}")

    return JSONResponse({
        "status": "success",
        "deleted_count": len(deleted),
        "deleted_files": deleted,
    })
