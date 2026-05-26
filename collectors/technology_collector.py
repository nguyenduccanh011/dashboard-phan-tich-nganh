"""
Collector cho ngành công nghệ & điện tử (/sector/technology).
Đọc: docs/sector_hub_plan.md §5.27
Output: cache/sector_technology.json

XK điện tử VN chủ yếu là Samsung/Intel (FDI, không niêm yết).
Dashboard tập trung IT services (FPT, CMG) + macro XK electronics vĩ mô.
Lưu ý: §5.27 cần bổ sung data thêm — một số macroItemId chưa verify đầy đủ.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_technology.json")
TICKERS = ["FPT", "CMG", "VGI", "ELC"]

TRAILING_ACCOUNT_IDS = "2,8,9,22,39,40,154,155,47"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "technology",
        "sector_name": "Công nghệ & Điện tử",
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
    print(f"[technology] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # USD/VND (revenue ngoại tệ FPT offshore)
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # FED rate (proxy IT spend của khách US)
    fed_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 96, "nameId": 1, "year": "5Y"}
    )
    # Lãi suất huy động VN (chi phí vốn)
    try:
        deposit_rate = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 48, "year": "5Y"}
        )
    except Exception as e:
        deposit_rate = {"stale": True, "stale_reason": str(e)}
    # CPI Mỹ YoY (proxy purchasing power US)
    try:
        cpi_us = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 70, "year": "5Y", "valueType": "yoy"}
        )
    except Exception as e:
        cpi_us = {"stale": True, "stale_reason": str(e)}

    return {
        "usd_vnd": usd_vnd,
        "fed_rate": fed_rate,
        "deposit_rate": deposit_rate,
        "cpi_us": cpi_us,
    }


async def _block_b():
    # XK máy tính & SP điện tử & linh kiện (nameId=43)
    try:
        xk_computer = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 25, "nameId": 43, "year": "5Y", "period": "month"}
        )
    except Exception as e:
        xk_computer = {"stale": True, "stale_reason": str(e)}
    # XK điện thoại & linh kiện (nameId=44)
    try:
        xk_phone = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 25, "nameId": 44, "year": "5Y", "period": "month"}
        )
    except Exception as e:
        xk_phone = {"stale": True, "stale_reason": str(e)}
    # XK điện tử YoY overview
    try:
        xk_overview = await findicator.get(
            "overview/overview-data",
            params={"tabId": 6}
        )
    except Exception as e:
        xk_overview = {"stale": True, "stale_reason": str(e)}
    # Bán lẻ Mỹ (proxy IT spending)
    try:
        us_retail = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 84, "year": "5Y"}
        )
    except Exception as e:
        us_retail = {"stale": True, "stale_reason": str(e)}
    # PMI TQ (supply chain risk)
    try:
        pmi_china = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 115, "nameId": 8, "year": "5Y"}
        )
    except Exception as e:
        pmi_china = {"stale": True, "stale_reason": str(e)}
    # Bán lẻ TQ (proxy demand châu Á)
    try:
        china_retail = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 126, "year": "5Y", "period": "month"}
        )
    except Exception as e:
        china_retail = {"stale": True, "stale_reason": str(e)}

    return {
        "xk_computer": xk_computer,
        "xk_phone": xk_phone,
        "xk_overview": xk_overview,
        "us_retail": us_retail,
        "pmi_china": pmi_china,
        "china_retail": china_retail,
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
