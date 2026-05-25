"""
Collector cho ngành vàng (/sector/gold).
Đọc: docs/sector_hub_plan.md §5.20
Output: cache/sector_gold.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_gold.json")
TICKERS = ["PNJ"]

TRAILING_ACCOUNT_IDS = "35,2,8,11,13,39,40"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    cache = {
        "sector": "gold",
        "sector_name": "Vàng",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[gold] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # ICE quốc tế, quy đổi VNĐ/lượng, SJC mua, SJC bán
    gold_prices = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "78,730,584,585", "year": "5Y"}
    )
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    try:
        dxy = await findicator.get("bank/dxy-index", params={"year": "5Y"})
    except Exception as e:
        dxy = {"stale": True, "stale_reason": str(e)}

    return {"gold_prices": gold_prices, "usd_vnd": usd_vnd, "dxy": dxy}


async def _block_b():
    # Bán lẻ VN (proxy nhu cầu trang sức)
    retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "year": "5Y"}
    )
    # Khách quốc tế đến VN
    try:
        tourists = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 61, "year": "5Y"}
        )
    except Exception as e:
        tourists = {"stale": True, "stale_reason": str(e)}

    try:
        dxy = await findicator.get("bank/dxy-index", params={"year": "5Y"})
    except Exception as e:
        dxy = {"stale": True, "stale_reason": str(e)}

    return {"retail": retail, "tourists": tourists, "dxy": dxy}


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
