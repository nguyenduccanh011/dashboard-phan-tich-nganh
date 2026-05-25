"""
Collector cho ngành gỗ & nội thất XK (/sector/wood).
Đọc: docs/sector_hub_plan.md §5.22
Output: cache/sector_wood.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_wood.json")
TICKERS = ["GDT", "VIF", "PTB", "ACG"]

TRAILING_ACCOUNT_IDS = "2,8,22,39,40"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    cache = {
        "sector": "wood",
        "sector_name": "Gỗ & Nội thất XK",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[wood] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # Giá gỗ CME (nameId=89, USD/MBF)
    timber_price = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": 89, "year": "5Y"}
    )
    # IIP chế biến gỗ VN YoY (nameId=29) — verify 2026-05-24: +32.4%
    iip_wood = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "nameId": 29, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    return {"usd_vnd": usd_vnd, "timber_price": timber_price, "iip_wood": iip_wood}


async def _block_b():
    # XK gỗ YoY (nameId=19) + XK sản phẩm tinh chế (nameId=20)
    try:
        xk_overview = await findicator.get(
            "overview/overview-data",
            params={"tabId": 6}
        )
    except Exception as e:
        xk_overview = {"stale": True, "stale_reason": str(e)}

    # XK gỗ monthly (nameId=29) — verify: 995.5 Tr USD
    xk_wood = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 29, "year": "5Y", "period": "month"}
    )
    # NK gỗ nguyên liệu VN (nameId=28)
    nk_wood = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 26, "nameId": 28, "year": "5Y", "period": "month"}
    )
    # FDI vào ngành gỗ (nameId=6)
    fdi_wood = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 15, "nameId": 6, "year": "5Y"}
    )
    return {
        "xk_overview": xk_overview,
        "xk_wood": xk_wood,
        "nk_wood": nk_wood,
        "fdi_wood": fdi_wood,
    }


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
