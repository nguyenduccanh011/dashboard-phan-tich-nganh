"""
Collector cho ngành Phân bón / Hóa chất (/sector/chemistry).
Đọc: docs/sector_hub_plan.md §5.9 để biết đầy đủ mapping.
Output: cache/sector_chemistry.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart, transform_keys

CACHE_FILE = Path("cache/sector_chemistry.json")
TICKERS = ["DPM", "DCM", "LAS", "BFC", "DDV", "CSV"]


async def collect():
    """Thu thập toàn bộ data ngành Phân bón / Hóa chất và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = await _collect_block_d()
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "chemistry",
        "sector_name": "Phân bón / Hóa chất",
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
    print(f"[chemistry] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Khí TN Henry Hub (66), Than ICE (68), Lưu Huỳnh TQ (182), Axit Sulfuric TQ (253),
    # Phốt pho vàng TQ (213), Xút NaOH TQ Spot (243)
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "66,68,182,253,213,243", "year": "5Y"}
    )
    return {"macro_35": macro_35}


async def _collect_block_b():
    # Cơ cấu chi phí SX phân bón (Urea gas/coal, DAP/MAP)
    fertilizer_data = await findicator.get("chemistry/overview/fertilizer-data")
    # Cơ cấu chi phí xút (caustic soda)
    caustic_soda_data = await findicator.get("chemistry/overview/caustic-soda-data")
    # Cơ cấu chi phí DAP/MAP
    phosphorus_data = await findicator.get("chemistry/overview/phosphorus-data")
    return {
        "fertilizer_data": fertilizer_data,
        "caustic_soda_data": caustic_soda_data,
        "phosphorus_data": phosphorus_data,
    }


async def _collect_block_c():
    # Urea CME (50), Urea TQ (190), Urea Phú Mỹ (12), Urea Cà Mau (13),
    # DAP TQ (156), DAP Đình Vũ (29), Kali Phú Mỹ (30)
    prices = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "50,190,12,13,156,29,30", "year": "5Y"}
    )
    return {"prices": prices}


async def _collect_block_d():
    # USD/VND (nameId=2 = tỷ giá VCB) dùng để tính spread Urea–Khí
    usdvnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": "2", "year": "5Y"}
    )
    return {"usdvnd": usdvnd, "computed_client_side": True}


async def _collect_block_e():
    results = {}
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": "35,39,40,2,8,163,154,155,47",
            }
        )
        analyst = await findicator.get(
            "enterprise/report-analysis",
            params={"ticket": ticker}
        )
        results[ticker] = {"trailing": trailing, "analyst": analyst}
    return results


async def _collect_block_f():
    results = {}
    for ticker in TICKERS[:4]:  # DPM, DCM, LAS, BFC
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
