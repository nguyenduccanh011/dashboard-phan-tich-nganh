import asyncio
import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from collectors.base import findicator

router = APIRouter()
CACHE_DIR = Path("cache")


@router.get("/{code}/cache")
async def get_sector_cache(code: str):
    """Return cached JSON for one sector."""
    cache_file = CACHE_DIR / f"sector_{code.replace('-', '_')}.json"
    if not cache_file.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(cache_file.read_text(encoding="utf-8")))


@router.get("/{code}/enterprise-snapshot")
async def get_enterprise_snapshot(code: str, limit: int = Query(6, ge=1, le=12)):
    """Live enterprise snapshot for one sector.

    This endpoint adds the shared Findicator enterprise layer that is not cached
    consistently by every sector collector: corp-profile, dividends, analyst
    prediction, long revenue, and long profit series.
    """
    cache_file = CACHE_DIR / f"sector_{code.replace('-', '_')}.json"
    if not cache_file.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)

    cache = json.loads(cache_file.read_text(encoding="utf-8"))
    tickers = [str(t).upper() for t in cache.get("tickers", []) if t]
    tickers = list(dict.fromkeys(tickers))[:limit]
    if not tickers:
        return JSONResponse({"error": "no tickers in cache"}, status_code=404)

    ticker_payloads = await asyncio.gather(
        *[_collect_ticker_enterprise(code, ticker) for ticker in tickers],
        return_exceptions=True,
    )
    enterprises = {}
    for ticker, payload in zip(tickers, ticker_payloads):
        enterprises[ticker] = {"error": str(payload)} if isinstance(payload, Exception) else payload

    rows = [_summarize_ticker(ticker, payload) for ticker, payload in enterprises.items()]
    _attach_peer_shares(rows)

    return JSONResponse({
        "sector": code,
        "sector_name": cache.get("sector_name", code),
        "updated_at": datetime.now().isoformat(),
        "tickers": tickers,
        "rows": rows,
        "enterprises": enterprises,
    })


async def _collect_ticker_enterprise(sector_code: str, ticker: str) -> dict:
    calls = {
        "profile": findicator.get("enterprise/corp-profile", params={"ticket": ticker}),
        "dividends": findicator.get("enterprise/overview-dividend", params={"ticket": ticker, "year": "All"}),
        "prediction": findicator.get("enterprise/report-data-prediction", params={"ticket": ticker}),
    }

    if sector_code == "bank":
        calls.update({
            "revenue": findicator.get("enterprise/bank-revenue", params={"ticket": ticker, "period": "quarter", "year": "5Y"}),
            "profit_after_tax": findicator.get("enterprise/bank-profit-after-tax", params={"ticket": ticker, "period": "quarter", "year": "5Y"}),
            "bad_debt_ratio": findicator.get("enterprise/bank-bad-debt-ratio", params={"ticket": ticker, "period": "quarter", "year": "5Y"}),
        })
    elif sector_code == "securities":
        calls.update({
            "revenue": findicator.get("enterprise/stock-revenue", params={"ticket": ticker, "period": "quarter", "year": "5Y"}),
        })
    elif sector_code == "insurance":
        calls.update({
            "revenue": findicator.get("enterprise/insurance-revenue", params={"ticket": ticker, "period": "quarter", "year": "5Y"}),
        })
    else:
        calls.update({
            "revenue": findicator.get("enterprise/manufactoring-revenue", params={"ticket": ticker, "period": "quarter", "year": "All"}),
            "profit_after_tax": findicator.get("enterprise/manufactoring-profit-after-tax", params={"ticket": ticker, "period": "quarter", "year": "All"}),
        })

    values = await asyncio.gather(*calls.values(), return_exceptions=True)
    payload = {}
    for key, value in zip(calls.keys(), values):
        payload[key] = {"error": str(value)} if isinstance(value, Exception) else value
    return payload


def _summarize_ticker(ticker: str, payload: dict) -> dict:
    profile = payload.get("profile") if isinstance(payload.get("profile"), dict) else {}
    revenue = _latest_value(payload.get("revenue"))
    profit = _latest_value(payload.get("profit_after_tax"))
    dividend = _latest_dividend(payload.get("dividends"))

    return {
        "ticker": ticker,
        "name": profile.get("shortName") or profile.get("short_name") or profile.get("corpName") or profile.get("name"),
        "close_price": profile.get("closePrice"),
        "market_cap": profile.get("marketCap"),
        "pe": profile.get("pe"),
        "pb": profile.get("pb"),
        "eps": profile.get("eps"),
        "bvps": profile.get("bvps"),
        "latest_revenue": revenue.get("value"),
        "latest_revenue_period": revenue.get("period"),
        "latest_profit": profit.get("value"),
        "latest_profit_period": profit.get("period"),
        "latest_dividend_year": dividend.get("year"),
        "cash_dividend": dividend.get("cash"),
        "stock_dividend": dividend.get("stock"),
        "errors": {key: value.get("error") for key, value in payload.items() if isinstance(value, dict) and value.get("error")},
    }


def _latest_value(rows) -> dict:
    if not isinstance(rows, list) or not rows:
        return {}

    candidates = [row for row in rows if isinstance(row, dict) and row.get("value") is not None]
    if not candidates:
        return {}

    def sort_key(row):
        date = str(row.get("date") or "")
        year = int(row.get("year") or 0)
        quarter = int(row.get("quarter") or 0)
        return date, year, quarter

    latest = sorted(candidates, key=sort_key)[-1]
    period = latest.get("date") or (
        f"Q{latest.get('quarter')}/{latest.get('year')}"
        if latest.get("quarter") and latest.get("year")
        else latest.get("year")
    )
    return {"value": latest.get("value"), "period": period}


def _latest_dividend(rows) -> dict:
    if not isinstance(rows, list) or not rows:
        return {}
    years = sorted({int(row.get("year")) for row in rows if isinstance(row, dict) and row.get("year")}, reverse=True)
    for year in years:
        year_rows = [row for row in rows if isinstance(row, dict) and int(row.get("year") or 0) == year]
        cash = sum(float(row.get("value") or 0) for row in year_rows if int(row.get("type") or 0) == 1)
        stock = sum(float(row.get("value") or 0) for row in year_rows if int(row.get("type") or 0) == 2)
        if cash or stock:
            return {"year": year, "cash": cash or None, "stock": stock or None}
    return {}


def _attach_peer_shares(rows: list[dict]) -> None:
    total_revenue = sum(float(row.get("latest_revenue") or 0) for row in rows)
    total_profit = sum(float(row.get("latest_profit") or 0) for row in rows)
    total_market_cap = sum(float(row.get("market_cap") or 0) for row in rows)
    for row in rows:
        row["revenue_share"] = float(row.get("latest_revenue") or 0) / total_revenue if total_revenue else None
        row["profit_share"] = float(row.get("latest_profit") or 0) / total_profit if total_profit else None
        row["market_cap_share"] = float(row.get("market_cap") or 0) / total_market_cap if total_market_cap else None
