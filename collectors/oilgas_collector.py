"""
Collector cho ngành dầu khí (/sector/oilgas).
Đọc: docs/sector_hub_plan.md §5.19
Output: cache/sector_oilgas.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_oilgas.json")
TICKERS = ["GAS", "PVS", "PVD", "BSR", "PLX"]

TRAILING_ACCOUNT_IDS = "35,2,8,9,22,39,40,154,155,47"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_c = await _block_c()
    block_e = await _block_e()
    block_f = await _block_f()

    cache = {
        "sector": "oilgas",
        "sector_name": "Dầu khí",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[oilgas] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # Brent, WTI, Henry Hub gas
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "65,67,66", "year": "5Y"}
    )
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    return {"macro_35": macro_35, "usd_vnd": usd_vnd}


async def _block_b():
    # Gas tanker rates (VLGC, LGC, MGC, HDY SR, ETH, SR, COASTER Asia/Europe)
    # MR tanker, VLCC, BDTI, BCTI
    tanker_rates = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "312,313,314,315,316,317,318,319,322,341,679,680", "year": "5Y"}
    )
    # Sản lượng LPG TQ
    lpg_china = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 119, "nameId": 7, "year": "5Y"}
    )
    # IIP khai khoáng VN
    iip_mining = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # XK dầu thô/sản phẩm dầu VN
    try:
        xk_oil = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 25, "year": "5Y", "period": "month"}
        )
    except Exception as e:
        xk_oil = {"stale": True, "stale_reason": str(e)}

    return {
        "tanker_rates": tanker_rates,
        "lpg_china": lpg_china,
        "iip_mining": iip_mining,
        "xk_oil": xk_oil,
    }


async def _block_c():
    # Giá xăng dầu nội địa: RON95 v1, RON92, RON95 v2, DO, dầu hoả
    domestic_fuel = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "612,613,614,618,622", "year": "5Y"}
    )
    return {"domestic_fuel": domestic_fuel}


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
        # Per-DN manufacturing revenue
        try:
            mfg_revenue = await findicator.get(
                "enterprise/manufactoring-revenue",
                params={"ticket": ticker, "year": "All", "period": "quarter"}
            )
        except Exception as e:
            mfg_revenue = {"stale": True, "stale_reason": str(e)}
        results[ticker] = {"trailing": trailing, "analyst": analyst, "mfg_revenue": mfg_revenue}
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
