"""
Collector cho ngành nhựa tổng hợp (/sector/plastics).
Đọc: docs/sector_hub_plan.md §5.17
Output: cache/sector_plastics.json

Không có sector dashboard riêng trên Findicator.
Data đến từ macroItemId=35 (NVL nhựa TQ) + BCTC TRAILING corpType=4.
CNY/VND: macroItemId=53 dừng 31/12/2025, fallback steel/exchange-rate.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_plastics.json")
TICKERS = ["AAA", "NTP", "BMP", "DNP", "RDP"]

PLASTICS_NAME_IDS = {
    170: "PET TQ (CNY/T)",
    183: "PP TQ (CNY/T)",
    231: "PVC TQ (CNY/T)",
    203: "LDPE TQ (CNY/T)",
    204: "HDPE TQ (CNY/T)",
    232: "LLDPE TQ (CNY/T)",
    67:  "Dầu WTI (feedstock)",
    66:  "Khí TN HH (feedstock)",
}

TRAILING_ACCOUNT_IDS = "35,2,8,39,40,154,155,47"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_c = await _block_c()
    block_e = await _block_e()
    block_f = await _block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "plastics",
        "sector_name": "Nhựa tổng hợp",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
            "block_g": block_g,
    }
    cache = transform_keys(cache)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[plastics] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    name_ids_str = ",".join(str(k) for k in PLASTICS_NAME_IDS)
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": name_ids_str, "year": "5Y"}
    )
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # CNY/VND fallback (macroItemId=53 dừng 31/12/2025)
    try:
        cny_vnd = await findicator.get("steel/exchange-rate")
    except Exception as e:
        cny_vnd = {"stale": True, "stale_reason": str(e)}

    return {
        "plastics_raw": macro_35,
        "usd_vnd": usd_vnd,
        "cny_vnd": cny_vnd,
        "name_ids": PLASTICS_NAME_IDS,
    }


async def _block_b():
    # NK nhựa nguyên liệu VN (chất dẻo nguyên liệu + SP từ chất dẻo)
    import_plastic = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 26, "nameId": "22,23", "year": "5Y"}
    )
    # IIP cao su + nhựa (nameId=16)
    iip = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "nameId": 16, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # Bán lẻ hàng hoá VN (proxy tiêu dùng nội địa)
    retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "nameId": 2, "year": "5Y"}
    )
    return {"import_plastic": import_plastic, "iip": iip, "retail": retail}


async def _block_c():
    # Giá ống nhựa nội địa (sstock general-data-series)
    pipe_series = [
        "Hàng hóa trong nước (tháng) - Ống nhựa 27 x 1.8mm",
        "Hàng hóa trong nước (tháng) - Ống nhựa 60 x 2mm",
        "Hàng hóa trong nước (tháng) - Ống nhựa 90 x 2,9mm",
    ]
    results = {}
    for name in pipe_series:
        try:
            r = await findicator.get(
                "sstock/chart/general-data-series",
                params={"dataSeriesNames": name}
            )
            results[name] = {"data": r, "stale": False}
        except Exception as e:
            results[name] = {"data": [], "stale": True, "stale_reason": str(e)}
    return {"pipe_prices": results}


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
