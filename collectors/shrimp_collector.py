"""
Collector cho ngành Tôm (/sector/shrimp).
Đọc: docs/sector_hub_plan.md §5.5 để biết đầy đủ mapping.
Output: cache/sector_shrimp.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_shrimp.json")
TICKERS = ["MPC", "FMC", "CMX"]


async def collect():
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "shrimp",
        "sector_name": "Tôm",
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
    print(f"[shrimp] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Giá tôm nguyên liệu + thức ăn chăn nuôi + tỷ giá
    macro_35, usd_vnd = await asyncio.gather(
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 35, "nameId": "23,22,21,108,87", "year": "5Y"}
        ),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
        ),
    )
    return {
        "macro_35": macro_35,
        "usd_vnd": usd_vnd,
    }


async def _collect_block_b():
    overview, global_export_price, retail_food = \
        await asyncio.gather(
            findicator.get("shrimp/overview/shrimp-data"),
            findicator.get(
                "shrimp/global-market-export-price",
                params={"macroId": 28, "year": "5Y"}
            ),
            findicator.get(
                "macro-data/macro-item-detail",
                params={"macroItemId": 84, "nameId": 14, "year": "5Y"}
            ),
        )
    try:
        global_by_product = await findicator.get(
            "shrimp/global-market-export-price-by-product",
            params={"macroId": 28, "countryId": 1, "action": "export", "year": "3Y"}
        )
    except Exception as e:
        print(f"[shrimp] global_by_product error: {e}")
        global_by_product = []
    try:
        global_export_yoy = await findicator.get(
            "shrimp/global-market-export-price-year-over-year",
            params={"macroId": 28, "countryId": 1, "action": "export", "year": "3Y"}
        )
    except Exception as e:
        print(f"[shrimp] global_export_yoy error: {e}")
        global_export_yoy = []
    return {
        "overview": overview,
        "global_export_price": global_export_price,
        "global_export_yoy": global_export_yoy,
        "global_by_product": global_by_product,
        "retail_food_us": retail_food,
    }


async def _collect_block_c():
    # ASP tôm thẻ + tôm sú per-DN + turnover per-DN
    price_the_tasks = [
        findicator.get(
            "shrimp/enterprise-export-price-to-markets",
            params={"ticket": t, "macroIds": 28, "year": "5Y"}
        )
        for t in TICKERS
    ]
    price_su_tasks = [
        findicator.get(
            "shrimp/enterprise-export-price-to-markets",
            params={"ticket": t, "macroIds": 29, "year": "5Y"}
        )
        for t in TICKERS
    ]
    status_tasks = [
        findicator.get(
            "shrimp/enterprise-export-status",
            params={"ticket": t, "macroIds": 28, "period": "month_value", "year": "5Y"}
        )
        for t in TICKERS
    ]

    the_raw, su_raw, status_raw = await asyncio.gather(
        asyncio.gather(*price_the_tasks, return_exceptions=True),
        asyncio.gather(*price_su_tasks, return_exceptions=True),
        asyncio.gather(*status_tasks, return_exceptions=True),
    )

    def safe(raw, i):
        return raw[i] if not isinstance(raw[i], Exception) else None

    return {
        "export_price_tom_the": {t: safe(the_raw, i) for i, t in enumerate(TICKERS)},
        "export_price_tom_su": {t: safe(su_raw, i) for i, t in enumerate(TICKERS)},
        "export_status": {t: safe(status_raw, i) for i, t in enumerate(TICKERS)},
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
    for ticker in TICKERS:
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
