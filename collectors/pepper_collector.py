"""
Collector cho ngành hồ tiêu (/sector/pepper).
Đọc: docs/sector_hub_plan.md §5.26
Output: cache/sector_pepper.json

WiChart: key=hanghoa, name=tieu — không có year filter, backend tự cắt.
HAL là proxy DN niêm yết. Dashboard chủ yếu phục vụ phân tích macro XK nông sản.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_pepper.json")
TICKERS = ["HAL"]

TRAILING_ACCOUNT_IDS = "2,8,39,40"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    cache = {
        "sector": "pepper",
        "sector_name": "Hồ tiêu",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[pepper] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # Giá hồ tiêu VN từ WiChart (PRIMARY, fresh daily)
    pepper_price = await _collect_wichart_commodity("hanghoa", "tieu")

    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # Dầu Brent (logistics)
    brent = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": 65, "year": "5Y"}
    )
    return {"pepper_price": pepper_price, "usd_vnd": usd_vnd, "brent": brent}


async def _block_b():
    # XK hồ tiêu VN (nameId=8) — verify: 04/2026 = 193.9 Tr USD / 30.9 kT / 6265 USD/T
    xk_pepper = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 8, "year": "5Y", "period": "month"}
    )
    xk_pepper_yoy = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 8, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # Bán lẻ VN
    retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "year": "5Y"}
    )
    return {"xk_pepper": xk_pepper, "xk_pepper_yoy": xk_pepper_yoy, "retail": retail}


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


async def _collect_wichart_commodity(key: str, name: str) -> dict:
    try:
        raw = await wichart.get(key, name)
        series = raw.get("chart", {}).get("series", []) if isinstance(raw, dict) else []
        points = series[0].get("data", []) if series else (raw if isinstance(raw, list) else [])
        return {"data": points, "stale": False, "source": f"WiChart key={key} name={name}"}
    except Exception as e:
        return {"data": [], "stale": True, "stale_reason": str(e), "source": f"WiChart key={key} name={name}"}


if __name__ == "__main__":
    asyncio.run(collect())
