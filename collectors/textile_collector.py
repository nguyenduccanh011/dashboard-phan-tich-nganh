"""
Collector cho ngành Dệt may (/sector/textile).
Đọc: docs/sector_hub_plan.md §5.10 để biết đầy đủ mapping.
Output: cache/sector_textile.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_textile.json")
TICKERS = ["TCM", "TNG", "MSH", "VGT", "STK", "ADS"]


async def collect():
    """Thu thập toàn bộ data ngành Dệt may và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = {"computed_client_side": True}
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

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
    }

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
    xk_country = await _try_get("textile/textileExportCountry")
    overview = await _try_get("textile/overview/textile-data")
    nk_material = await _try_get(
        "textile/values-by-macro-ids",
        params={"macroIds": 26, "repo": "MacroVnEximImcomdty", "year": "5Y", "period": "month_value"}
    )
    fdi = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 15, "year": "5Y"}
    )
    labour = await _try_get(
        "textile/values-by-macro-ids",
        params={"repo": "MacroVnLabourIndex", "year": "5Y", "period": "month_value"}
    )
    iip = await _try_get(
        "textile/values-by-macro-ids",
        params={"repo": "MacroVnPrdIip", "year": "5Y", "period": "month_value"}
    )
    xk_bangladesh = await _try_get(
        "textile/values-by-macro-ids",
        params={"repo": "MacroGlobalBangladeshExportComdty", "year": "5Y", "period": "month_value"}
    )
    xk_china = await _try_get(
        "textile/values-by-macro-ids",
        params={"repo": "MacroGlobalChinaExportComdty", "year": "5Y", "period": "month_value"}
    )
    xk_india = await _try_get(
        "textile/values-by-macro-ids",
        params={"repo": "MacroGlobalIndiaExportComdty", "year": "5Y", "period": "month_value"}
    )
    xk_turkey = await _try_get(
        "textile/values-by-macro-ids",
        params={"repo": "MacroGlobalTurkeyExportComdty", "year": "5Y", "period": "month_value"}
    )
    pmi_global = await _try_get("overview/overview-data", params={"tabId": 4})
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
        "labour": labour,
        "iip": iip,
        "xk_bangladesh": xk_bangladesh,
        "xk_china": xk_china,
        "xk_india": xk_india,
        "xk_turkey": xk_turkey,
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
    results = {}
    for ticker in TICKERS[:4]:  # TCM, TNG, MSH, VGT
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
