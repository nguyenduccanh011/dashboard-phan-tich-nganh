"""
Enterprise Finance Router — doanh nghiệp, tài chính, so sánh.

Endpoints:
  GET /api/enterprise/finance-comparison — 54 TRAILING metrics
  GET /api/enterprise/valuation — PE/PB/dividend heatmap
  GET /api/enterprise/bank-metrics — metrics ngân hàng
"""
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()
CACHE_DIR = Path("cache")


@router.get("/finance-comparison")
async def get_finance_comparison():
    """54 TRAILING metrics cho major enterprises."""
    f = CACHE_DIR / "enterprise_finance.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)

    data = json.loads(f.read_text(encoding="utf-8"))
    fc = data.get("finance_comparison", {})

    return JSONResponse({
        "finance_labels": fc.get("finance_labels", {}),
        "finance_data": fc.get("finance_data", {}),
        "tickers": fc.get("tickers", []),
        "metrics_count": len(fc.get("finance_labels", {})),
    })


@router.get("/valuation")
async def get_valuation(ticker: str = Query(None)):
    """PE/PB/dividend heatmap."""
    f = CACHE_DIR / "enterprise_finance.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)

    data = json.loads(f.read_text(encoding="utf-8"))
    valuation = data.get("valuation", {})

    if ticker:
        return JSONResponse(valuation.get(ticker, {"error": f"ticker {ticker} not found"}))

    return JSONResponse(valuation)


@router.get("/bank-metrics")
async def get_bank_metrics(ticker: str = Query(None)):
    """Bank-specific metrics (revenue, asset, NPL)."""
    f = CACHE_DIR / "enterprise_finance.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)

    data = json.loads(f.read_text(encoding="utf-8"))
    bank_metrics = data.get("bank_metrics", {})

    if ticker:
        return JSONResponse(bank_metrics.get(ticker, {"error": f"bank {ticker} not found"}))

    return JSONResponse(bank_metrics)


@router.get("/corp-data")
async def get_corp_data():
    """Danh sách doanh nghiệp niêm yết."""
    f = CACHE_DIR / "enterprise_finance.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)

    data = json.loads(f.read_text(encoding="utf-8"))
    corp = data.get("corp_data", {})

    return JSONResponse(corp)


@router.get("/overview-legend")
async def get_overview_legend():
    """66 live prices + metadata."""
    f = CACHE_DIR / "enterprise_finance.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)

    data = json.loads(f.read_text(encoding="utf-8"))
    legend = data.get("overview_legend", {})

    return JSONResponse(legend)
