"""
Collector cho ngành lúa gạo (/sector/rice).
Đọc: docs/sector_hub_plan.md §5.25
Output: cache/sector_rice.json

WiChart: key=hanghoa, name=lua — không có year filter, backend tự cắt.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_rice.json")
TICKERS = ["LTG", "AGM", "TAR"]

TRAILING_ACCOUNT_IDS = "2,8,9,11,39,40,154,155"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "rice",
        "sector_name": "Lúa gạo",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
            "block_g": block_g,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[rice] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # Giá lúa gạo VN từ WiChart (PRIMARY, fresh daily)
    lua_price = await _collect_wichart_commodity("hanghoa", "lua")

    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # Phân bón: Urea Phú Mỹ (nameId=12), Urea Cà Mau (nameId=13), Brent (nameId=65)
    inputs = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "12,13,65", "year": "5Y"}
    )
    return {"lua_price": lua_price, "usd_vnd": usd_vnd, "inputs": inputs}


async def _block_b():
    # XK gạo VN (nameId=9) — verify: 04/2026 = 513.9 Tr USD / 1107 kT / 464 USD/T
    xk_rice = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 9, "year": "5Y", "period": "month"}
    )
    xk_rice_yoy = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 9, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # Bán lẻ VN
    retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "year": "5Y"}
    )
    # PMI TQ (proxy demand gạo từ TQ) — macroItemId=115, nameId=8
    pmi_china = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 115, "nameId": 8, "year": "5Y"}
    )

    return {
        "xk_rice": xk_rice,
        "xk_rice_yoy": xk_rice_yoy,
        "retail": retail,
        "pmi_china": pmi_china,
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


async def _collect_wichart_commodity(key: str, name: str) -> dict:
    try:
        raw = await wichart.get(key, name)
        series = raw.get("chart", {}).get("series", []) if isinstance(raw, dict) else []
        points = series[0].get("data", []) if series else (raw if isinstance(raw, list) else [])
        return {"data": points, "stale": False, "source": f"WiChart key={key} name={name}"}
    except Exception as e:
        return {"data": [], "stale": True, "stale_reason": str(e), "source": f"WiChart key={key} name={name}"}



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
