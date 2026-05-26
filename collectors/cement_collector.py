"""
Collector cho ngành xi măng (/sector/cement).
Đọc: docs/sector_hub_plan.md §5.3 để biết đầy đủ mapping.
Output: cache/sector_cement.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime, date
from collectors.base import findicator, transform_keys

def _quarters(n=8):
    today = date.today()
    q = (today.month - 1) // 3
    results = []
    for _ in range(n):
        m = q * 3 + 1
        results.append(f"{m:02d}/01/{today.year}")
        q -= 1
        if q < 0:
            q = 3
            today = today.replace(year=today.year - 1)
    return results

CACHE_FILE = Path("cache/sector_cement.json")
TICKERS = ["HT1", "BCC", "BTS"]


async def collect():
    """Thu thập toàn bộ data ngành xi măng và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "cement",
        "sector_name": "Xi măng",
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
    print(f"[cement] cache saved -> {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Than đá cho xi măng từ sector endpoint
    coal_price = await findicator.get("cement/coal-price", params={"year": "5Y"})
    # Than ICE backup từ macro
    coal_ice = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": 68, "year": "5Y"}
    )
    # Dầu Brent cho logistics
    brent = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": 65, "year": "5Y"}
    )
    return {
        "coal_price": coal_price,
        "coal_ice": coal_ice,
        "brent": brent,
    }


async def _try(coro, default=None):
    try:
        return await coro
    except Exception:
        return default if default is not None else []


async def _collect_block_b():
    iip_yoy = await _try(findicator.get("cement/values-year-over-year", params={"macroIds": 29}))
    clinker_value = await _try(findicator.get(
        "cement/clanhke-value", params={"macroIds": 15, "period": "month_value", "year": "5Y"}
    ))
    clinker_yoy = await _try(findicator.get("cement/clanhke-year-over-year", params={"macroIds": 15}))
    avg_export_price = await _try(findicator.get("cement/average-export-price", params={"year": "5Y"}))
    raw_consum = await _try(findicator.get("cement/values-year-over-year", params={"macroIds": 12}))
    consumption_index = [row for year in raw_consum for row in year] if isinstance(raw_consum, list) else []
    raw_invent = await _try(findicator.get("cement/values-year-over-year", params={"macroIds": 13}))
    inventory_index = [row for year in raw_invent for row in year] if isinstance(raw_invent, list) else []
    capex_public = await _try(findicator.get(
        "macro-data/macro-item-detail", params={"macroItemId": 20, "year": "5Y"}
    ))
    steel_production = await _try(findicator.get(
        "macro-data/macro-item-detail", params={"macroItemId": 8, "year": "5Y"}
    ))
    legend = await _try(findicator.get("cement/legend"), default={})
    return {
        "iip_yoy": iip_yoy,
        "clinker_value": clinker_value,
        "clinker_yoy": clinker_yoy,
        "avg_export_price": avg_export_price,
        "consumption_index": consumption_index,
        "inventory_index": inventory_index,
        "capex_public": capex_public,
        "steel_production": steel_production,
        "legend": legend,
    }


async def _collect_block_c():
    # Giá xi măng Hà Tiên PCB40 nội địa (nameId=57)
    internal_price = await findicator.get("cement/internal-cement-price", params={"year": "5Y"})
    # Giá XK trung bình
    avg_export_price = await findicator.get("cement/average-export-price", params={"year": "5Y"})
    return {
        "internal_price": internal_price,
        "avg_export_price": avg_export_price,
    }


async def _collect_block_e():
    today = datetime.now()
    q_month = ((today.month - 1) // 3) * 3 + 1
    latest_date = f"{q_month:02d}/01/{today.year}"
    results = {}
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": "35,39,40,2,8,163",
                "period": "quarter",
                "date": latest_date,
            }
        )
        analyst = await findicator.get(
            "enterprise/report-analysis",
            params={"ticket": ticker}
        )
        results[ticker] = {"trailing": trailing, "analyst": analyst}
    return results


async def _collect_block_f():
    quarters = _quarters(8)
    results = {}
    for ticker in TICKERS:
        all_rows = []
        for qdate in quarters:
            rows = await findicator.get(
                "enterprise/v2/finance-ticket-data",
                params={
                    "tableName": "INCOME_STATEMENT",
                    "corpType": 4,
                    "ticket": f'["{ticker}"]',
                    "accountIds": "24,28,43,2",
                    "period": "quarter",
                    "date": qdate,
                }
            )
            ticker_rows = rows.get(ticker, []) if isinstance(rows, dict) else rows
            all_rows.extend(ticker_rows)
        results[ticker] = all_rows
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
