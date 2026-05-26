"""
Collector cho ngành Dệt may (/sector/textile).
Đọc: docs/sector_hub_plan.md §5.10 để biết đầy đủ mapping.
Output: cache/sector_textile.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime, date
from collectors.base import findicator, transform_keys

CACHE_FILE = Path("cache/sector_textile.json")
TICKERS = ["TCM", "TNG", "MSH", "VGT", "STK", "ADS"]


def _quarters(n=8):
    """Trả n quý gần nhất dạng MM/DD/YYYY để dùng làm date param."""
    today = date.today()
    q = (today.month - 1) // 3
    results = []
    for _ in range(n):
        m = q * 3 + 1
        results.append(f"{m:02d}/01/{today.year - (q < 0)}")
        q -= 1
        if q < 0:
            q = 3
            today = today.replace(year=today.year - 1)
    return results


async def collect():
    """Thu thập toàn bộ data ngành Dệt may và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()
    # block_c render từ block_b.overview (textileApplication, textileExportOverall)
    # block_d render từ block_f (BCTC, tính margin phía client)
    block_c = {"source": "block_b.overview"}
    block_d = {"source": "block_f"}

    block_g = await _collect_block_g()
    cache = {
        "sector": "textile",
        "sector_name": "Dệt may",
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
    print(f"[textile] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Bông CBOT (98), Xơ bông TQ (168), Sợi cotton TQ (185),
    # Sợi Polyester DTY TQ (163), Sợi Polyester POY TQ (186)
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "98,168,185,163,186", "year": "5Y"}
    )
    # Tỷ giá USD/VND
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    return {
        "macro_35": macro_35,
        "usd_vnd": usd_vnd,
    }


async def _collect_block_b():
    async def _try_get(path, **kwargs):
        try:
            return await findicator.get(path, **kwargs)
        except Exception:
            return []

    # XK dệt may VN monthly (macroItemId=25, repo=MacroVnEximExcomdty)
    xk_monthly = await _try_get(
        "textile/values-by-macro-ids",
        params={"macroIds": 25, "repo": "MacroVnEximExcomdty", "year": "5Y", "period": "month_value"}
    )
    xk_monthly_yoy = await _try_get(
        "textile/values-by-macro-ids",
        params={"macroIds": 25, "repo": "MacroVnEximExcomdty", "year": "5Y", "period": "month_yoy"}
    )
    overview = await _try_get("textile/overview/textile-data")
    xk_country = overview.get("textileExportCountry", []) if isinstance(overview, dict) else []
    nk_material = await _try_get(
        "textile/values-by-macro-ids",
        params={"macroIds": 1, "repo": "MacroVnEximImcomdty", "year": "5Y", "period": "month_value"}
    )
    fdi = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 18, "year": "5Y", "period": "month"}
    )
    # labour/iip/xk_bangladesh/china/india/turkey: repos trống ở server (macroIds 1-100 đều empty)
    # + không được dùng trong sector-textile.js → bỏ để tiết kiệm API calls
    pmi_global = await _try_get("overview/overview-data", params={"tabId": 4, "repo": "overview_global"})
    us_apparel_retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 84, "nameId": 20, "year": "5Y"}
    )
    return {
        "xk_monthly": xk_monthly,
        "xk_monthly_yoy": xk_monthly_yoy,
        "xk_country": xk_country,
        "overview": overview,
        "nk_material": nk_material,
        "fdi": fdi,
        "pmi_global": pmi_global,
        "us_apparel_retail": us_apparel_retail,
    }


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
    quarters = _quarters(8)
    results = {}
    for ticker in TICKERS[:4]:  # TCM, TNG, MSH, VGT
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
            all_rows.extend(ticker_rows if isinstance(ticker_rows, list) else [])
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
