"""
Collector cho ngành cà phê (/sector/coffee).
Đọc: docs/sector_hub_plan.md §5.21
Output: cache/sector_coffee.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_coffee.json")
TICKERS = ["VCF", "MCF"]

TRAILING_ACCOUNT_IDS = "2,8,39,40"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    cache = {
        "sector": "coffee",
        "sector_name": "Cà phê",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[coffee] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # Arabica ICE (nameId=95), Robusta hạt VN (nameId=687)
    coffee_prices = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "95,687", "year": "5Y"}
    )
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    return {"coffee_prices": coffee_prices, "usd_vnd": usd_vnd}


async def _block_b():
    # XK cà phê VN (nameId=6) — verify: 04/2026 = 822.5 Tr USD / 189.9 kT
    xk_coffee = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 6, "year": "5Y", "period": "month"}
    )
    # XK YoY
    xk_coffee_yoy = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 6, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # Bán lẻ VN (proxy tiêu dùng nội địa)
    retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "year": "5Y"}
    )
    return {"xk_coffee": xk_coffee, "xk_coffee_yoy": xk_coffee_yoy, "retail": retail}


async def _block_e():
    results = {}
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": TRAILING_ACCOUNT_IDS,
            }
        )
        analyst = await findicator.get("enterprise/report-analysis", params={"ticket": ticker})
        results[ticker] = {"trailing": trailing, "analyst": analyst}
    return results


async def _block_f():
    results = {}
    for ticker in TICKERS:
        ts = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "INCOME_STATEMENT",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": IS_ACCOUNT_IDS,
                "period": "quarter",
            }
        )
        results[ticker] = ts
    return results


if __name__ == "__main__":
    asyncio.run(collect())
