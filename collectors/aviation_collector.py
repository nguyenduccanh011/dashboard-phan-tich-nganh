"""
Collector cho ngành hàng không (/sector/aviation).
Đọc: docs/sector_hub_plan.md §5.6 để biết đầy đủ mapping.
Output: cache/sector_aviation.json
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

CACHE_FILE = Path("cache/sector_aviation.json")
TICKERS = ["HVN", "VJC", "BAV"]
FLIGHT_TICKERS = ["VJC", "HVN", "BAV"]


async def collect():
    """Thu thập toàn bộ data ngành hàng không và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = {"note": "Không có per-DN ASP — dùng DT từ BCTC làm proxy"}
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "aviation",
        "sector_name": "Hàng không",
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
    print(f"[aviation] cache saved -> {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Giá nhiên liệu: Brent + Dầu hỏa VN vùng 1 & 2 (proxy JetA-1)
    fuel_prices = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "65,623,627", "year": "5Y"}
    )
    # Tỷ giá USD/VND
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # Lãi suất FED (chi phí tài chính thuê máy bay)
    fed_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 96, "nameId": 1, "year": "5Y"}
    )
    return {
        "fuel_prices": fuel_prices,
        "usd_vnd": usd_vnd,
        "fed_rate": fed_rate,
    }


async def _try(coro, default=None):
    try:
        return await coro
    except Exception:
        return default if default is not None else []


async def _collect_block_b():
    # Số chuyến bay monthly per-hãng
    flights = {}
    for ticker in FLIGHT_TICKERS:
        flights[ticker] = await _try(findicator.get(
            "aviation/flight-company-data",
            params={"period": "month_value", "tickets": ticker, "year": "5Y"}
        ))

    international_visitors = await _try(findicator.get(
        "aviation/visitor-come-to-vn",
        params={"macroIds": 1, "repo": "MacroVnInternational", "period": "month_value", "year": "5Y"}
    ))
    visitors_yoy = await _try(findicator.get(
        "aviation/values-year-over-year",
        params={"macroIds": 1, "repo": "MacroVnInternational", "period": "month_yoy", "year": "3Y"}
    ))
    transport_passenger = await _try(findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 29, "year": "5Y"}
    ))
    intl_visitor_macro = await _try(findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 61, "year": "3Y"}
    ))
    luanchuy_hk = await _try(findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 31, "year": "5Y"}
    ))

    return {
        "flights": flights,
        "international_visitors": international_visitors,
        "visitors_yoy": visitors_yoy,
        "transport_passenger": transport_passenger,
        "intl_visitor_macro": intl_visitor_macro,
        "luanchuy_hk": luanchuy_hk,
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
