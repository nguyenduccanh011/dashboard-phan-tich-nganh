"""
Collector cho ngành Bất động sản (/sector/realestate).
Đọc: docs/sector_hub_plan.md §5.12 để biết đầy đủ mapping.
Output: cache/sector_realestate.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_realestate.json")
TICKERS = ["VHM", "NVL", "PDR", "DXG", "KDH"]


async def collect():
    """Thu thập toàn bộ data ngành Bất động sản và lưu cache."""

    block_a = {"note": "Không có giá đầu vào trực tiếp — dùng lãi suất từ Khối B làm proxy chi phí vốn"}
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    cache = {
        "sector": "realestate",
        "sector_name": "Bất động sản",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": block_d,
        "block_e": block_e,
        "block_f": block_f,
    }

    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[realestate] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_b():
    # Chính sách pháp lý BĐS (luật có hiệu lực từ 2006-2026)
    laws = await findicator.get("real-estate/laws")
    # Lãi suất huy động — nameId=6=12M, nameId=9=24M, nameId=10=36M (⚠ data 36M đến 08/2024)
    interest_rates = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 48, "nameId": "6,9,10", "year": "5Y"}
    )
    # Vốn đầu tư NSNN (đầu tư công → catalyst BĐS), macroItemId=20
    capex_public = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 20, "year": "5Y"}
    )
    # Vốn đầu tư xã hội, macroItemId=21
    social_investment = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 21, "year": "5Y"}
    )
    # BĐS TQ: Đầu tư phát triển/xây dựng YoY (121), Diện tích sàn (122),
    # Doanh thu bán (123), Đầu tư TS cố định (125)
    china_re_invest = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 121, "year": "5Y"}
    )
    china_re_area = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 122, "year": "5Y"}
    )
    china_re_sales = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 123, "year": "5Y"}
    )
    china_fixed_asset = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 125, "year": "5Y"}
    )
    return {
        "laws": laws,
        "interest_rates": interest_rates,
        "capex_public": capex_public,
        "social_investment": social_investment,
        "china_re_invest": china_re_invest,
        "china_re_area": china_re_area,
        "china_re_sales": china_re_sales,
        "china_fixed_asset": china_fixed_asset,
    }


async def _collect_block_c():
    # Định giá per-DN
    valuations = {}
    for ticker in TICKERS:
        valuations[ticker] = await findicator.get(
            "real-estate/core-index-valuation",
            params={"tickets": ticker}
        )
    # Danh sách dự án per-DN (VHM làm mẫu)
    projects = {}
    for ticker in TICKERS[:3]:  # VHM, NVL, PDR
        projects[ticker] = await findicator.get(
            "real-estate/company-project",
            params={"tickets": ticker}
        )
    return {
        "valuations": valuations,
        "projects": projects,
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


if __name__ == "__main__":
    asyncio.run(collect())
