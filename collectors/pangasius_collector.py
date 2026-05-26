"""
Collector cho ngành Cá tra (/sector/pangasius).
Đọc: docs/sector_hub_plan.md §5.4 để biết đầy đủ mapping.
Output: cache/sector_pangasius.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_pangasius.json")
TICKERS = ["VHC", "ANV", "IDI", "ACL", "ABT"]


async def collect():
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "pangasius",
        "sector_name": "Cá tra",
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

    cache = transform_keys(cache)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[pangasius] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    macro_35, usd_vnd, retail_food, retail_total = await asyncio.gather(
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 35, "nameId": "3,2,108,87", "year": "5Y"}
        ),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
        ),
        # Bán lẻ thực phẩm Mỹ (proxy demand cá tra)
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 84, "nameId": 14, "year": "5Y"}
        ),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 84, "nameId": 1, "year": "5Y"}
        ),
    )
    return {
        "macro_35": macro_35,
        "usd_vnd": usd_vnd,
        "retail_food_us": retail_food,
        "retail_total_us": retail_total,
    }


async def _collect_block_b():
    export_yoy, export_qty_markets = await asyncio.gather(
        findicator.get("pangasius/export-year-over-year"),
        findicator.get("pangasius/export-quantity-to-markets", params={"year": "5Y"}),
    )

    # export-status per-DN
    export_status_tasks = [
        findicator.get("pangasius/export-status", params={"ticket": t, "year": "5Y"})
        for t in TICKERS
    ]
    export_status_raw = await asyncio.gather(*export_status_tasks, return_exceptions=True)
    export_status = {
        t: export_status_raw[i] if not isinstance(export_status_raw[i], Exception) else None
        for i, t in enumerate(TICKERS)
    }

    return {
        "export_yoy": export_yoy,
        "export_qty_markets": export_qty_markets,
        "export_status": export_status,
    }


async def _collect_block_c():
    # ASP per-DN × 4 thị trường + export-status-to-markets per-DN
    price_tasks = [
        findicator.get("pangasius/export-price-to-markets", params={"ticket": t, "year": "5Y"})
        for t in TICKERS
    ]
    status_market_tasks = [
        findicator.get("pangasius/export-status-to-markets", params={"ticket": t, "year": "5Y"})
        for t in TICKERS
    ]
    prices_raw, status_raw = await asyncio.gather(
        asyncio.gather(*price_tasks, return_exceptions=True),
        asyncio.gather(*status_market_tasks, return_exceptions=True),
    )

    export_price_markets = {
        t: prices_raw[i] if not isinstance(prices_raw[i], Exception) else None
        for i, t in enumerate(TICKERS)
    }
    export_status_markets = {
        t: status_raw[i] if not isinstance(status_raw[i], Exception) else None
        for i, t in enumerate(TICKERS)
    }

    return {
        "export_price_markets": export_price_markets,
        "export_status_markets": export_status_markets,
    }


async def _collect_block_e():
    results = {}
    for ticker in TICKERS:
        trailing, analyst = await asyncio.gather(
            findicator.get(
                "enterprise/v2/finance-ticket-data",
                params={
                    "tableName": "TRAILING",
                    "corpType": 4,
                    "ticket": f'["{ticker}"]',
                    "accountIds": "35,39,40,2,8,163,154,155,47",
                }
            ),
            findicator.get("enterprise/report-analysis", params={"ticket": ticker}),
        )
        results[ticker] = {"trailing": trailing, "analyst": analyst}
    return results


async def _collect_block_f():
    results = {}
    for ticker in TICKERS[:3]:  # VHC, ANV, IDI
        ts = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "INCOME_STATEMENT",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": "24,28,43,2",
                "period": "quarter",
            }
        )
        results[ticker] = ts
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
