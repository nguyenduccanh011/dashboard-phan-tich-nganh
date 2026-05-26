"""
Collector cho ngành dược phẩm & y tế (/sector/pharma).
Đọc: docs/sector_hub_plan.md §5.23
Output: cache/sector_pharma.json

Tất cả nameIds đã verify 2026-05-24.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_pharma.json")
TICKERS = ["DHG", "IMP", "DMC", "TRA", "DBD"]

TRAILING_ACCOUNT_IDS = "2,8,9,27,39,40"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "pharma",
        "sector_name": "Dược phẩm & Y tế",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
            "block_g": block_g,
    }
    cache = transform_keys(cache)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[pharma] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # CPI Thuốc & DV y tế (nameId=16, +13.58%) + CPI DV y tế riêng (nameId=5, +17.65%)
    cpi_pharma = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 4, "nameId": "16,5", "year": "5Y", "valueType": "yoy"}
    )
    # NK dược phẩm (nameId=63, 369.2 Tr USD/tháng) + NK NPL dược (nameId=62, 42.1 Tr USD)
    nk_pharma = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 26, "nameId": "63,62", "year": "5Y"}
    )
    return {"usd_vnd": usd_vnd, "cpi_pharma": cpi_pharma, "nk_pharma": nk_pharma}


async def _block_b():
    # FDI vào y tế/dược (nameId=15, 1.1 Tr USD/tháng)
    fdi_health = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 15, "nameId": 15, "year": "5Y"}
    )
    # IIP sản xuất dược phẩm YoY (nameId=15, -10.2%)
    iip_pharma = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "nameId": 15, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # Bán lẻ hàng hoá VN (nameId=2)
    retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "nameId": 2, "year": "5Y"}
    )
    return {"fdi_health": fdi_health, "iip_pharma": iip_pharma, "retail": retail}


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
