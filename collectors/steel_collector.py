"""
Collector cho ngành thép (/sector/steel).
Đọc: docs/sector_hub_plan.md §5.1 để biết đầy đủ mapping.
Output: cache/sector_steel.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime, date
from collectors.base import findicator, wichart

def _quarters(n=8):
    """Trả n quý gần nhất dạng MM/DD/YYYY để dùng làm date param."""
    today = date.today()
    q = (today.month - 1) // 3  # 0-based quarter index
    results = []
    for _ in range(n):
        m = q * 3 + 1
        results.append(f"{m:02d}/01/{today.year - (q < 0)}")
        q -= 1
        if q < 0:
            q = 3
            today = today.replace(year=today.year - 1)
    return results

CACHE_FILE = Path("cache/sector_steel.json")
TICKERS = ["HPG", "HSG", "NKG", "TNA"]


async def collect():
    """Thu thập toàn bộ data ngành thép và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "steel",
        "sector_name": "Thép",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": block_d,
        "block_e": block_e,
        "block_f": block_f,
            "block_g": block_g,
    }

    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[steel] cache saved -> {CACHE_FILE}")
    return cache


async def _try(coro, default=None):
    try:
        return await coro
    except Exception:
        return default if default is not None else []


async def _collect_block_a():
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "82,243,153,158,86,161,61", "year": "5Y"}
    )
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # CNY/VND: macroItemId=53 dừng 31/12/2025, fallback steel/exchange-rate
    try:
        cny_vnd = await findicator.get("steel/exchange-rate")
    except Exception:
        cny_vnd = {"stale": True, "stale_reason": "macroItemId=53 dừng 31/12/2025"}

    return {
        "macro_35": macro_35,
        "usd_vnd": usd_vnd,
        "cny_vnd": cny_vnd,
    }


async def _collect_block_b():
    market_share = await findicator.get("steel/domestic-market-share", params={"year": "5Y"})
    try:
        inventory = await findicator.get(
            "steel/domestic-market-data",
            params={"seriesType": "TIME_SERIES", "type": "inventory", "year": "5Y"}
        )
    except Exception:
        inventory = []
    try:
        sales_status = await findicator.get(
            "steel/domestic-market-data",
            params={"seriesType": "TIME_SERIES", "type": "sales", "year": "5Y"}
        )
    except Exception:
        sales_status = []
    export_status = await findicator.get(
        "steel/demand-export-status",
        params={"seriesType": "TIME_SERIES", "year": "5Y"}
    )
    try:
        overview = await findicator.get("steel/overview/steel-data")
    except Exception:
        overview = {}
    cn_series = await _try(findicator.get(
        "steel/time-series",
        params={"year": "5Y", "macroIds": "1,2,3,4,5,6,7", "period": "month_value", "repo": "SteelCNOverall"}
    ), default=[])
    return {
        "market_share": market_share,
        "inventory": inventory,
        "sales_status": sales_status,
        "export_status": export_status,
        "overview": overview,
        "cn_series": cn_series,
    }


async def _collect_block_c():
    prices = await findicator.get(
        "steel/input-price",
        params={"macroIds": "47,49,159,167,177", "vnMacroIds": 11, "year": "5Y"}
    )
    return {"sell_prices": prices}


async def _collect_block_e():
    today = datetime.now()
    q_month = ((today.month - 1) // 3) * 3 + 1
    latest_date = f"{q_month:02d}/01/{today.year}"
    results = {}
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": "35,39,40,2,8,163,154,155,47",
                "period": "quarter",
                "date": latest_date,
            }
        )
        analyst = await findicator.get(
            "enterprise/report-analysis",
            params={"ticket": ticker}
        )
        results[ticker] = {"trailing": trailing, "analyst": analyst}
    return results


async def _collect_block_f():
    quarters = _quarters(8)
    results = {}
    for ticker in TICKERS[:3]:  # HPG, HSG, NKG
        all_rows = []
        for qdate in quarters:
            rows = await findicator.get(
                "enterprise/v2/finance-ticket-data",
                params={
                    "tableName": "INCOME_STATEMENT",
                    "corpType": 4,
                    "ticket": f'["{ticker}"]',
                    "accountIds": "24,28,43,2",
                    "period": "quarter",
                    "date": qdate,
                }
            )
            ticker_rows = rows.get(ticker, []) if isinstance(rows, dict) else rows
            all_rows.extend(ticker_rows)
        results[ticker] = all_rows
    return results



async def _collect_block_g():
    results = {}
    for ticker in TICKERS:
        div, val = await asyncio.gather(
            findicator.get('enterprise/overview-dividend', params={'ticket': ticker, 'year': 'All'}),
            findicator.get('enterprise/overview-valuation', params={'accountIds': '39,154', 'year': '5Y', 'ticket': ticker}),
        )
        try:
            rev = await findicator.get(
                'enterprise/manufactoring-revenue',
                params={'ticket': ticker, 'year': 'All', 'period': 'quarter'},
            )
        except Exception:
            rev = []
        try:
            pat = await findicator.get(
                'enterprise/manufactoring-profit-after-tax',
                params={'ticket': ticker, 'year': 'All', 'period': 'quarter'},
            )
        except Exception:
            pat = []
        try:
            prof = await findicator.get('enterprise/corp-profile', params={'ticket': ticker})
        except Exception:
            prof = {}
        results[ticker] = {'dividend': div, 'valuation': val, 'revenue': rev, 'profit_after_tax': pat, 'corp_profile': prof}
    return results

if __name__ == "__main__":
    asyncio.run(collect())
