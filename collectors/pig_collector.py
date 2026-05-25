"""
Collector cho ngành Chăn nuôi heo (/sector/pig).
Đọc: docs/sector_hub_plan.md §5.8 để biết đầy đủ mapping.
Output: cache/sector_pig.json
Lưu ý: pig_farming_global chỉ hỗ trợ year=1Y — 5Y/MAX trả 400.
Không có per-DN data (DBC/BAF/MML) từ Findicator — hoàn toàn dựa BCTC.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_pig.json")
TICKERS = ["DBC", "BAF", "MML"]


async def collect():
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    cache = {
        "sector": "pig",
        "sector_name": "Chăn nuôi heo",
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
    print(f"[pig] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Thức ăn chăn nuôi: Ngô CBOT (108), Đậu nành (87), Bã đậu nành TQ (160), Lúa mỳ (88)
    macro_35, usd_vnd = await asyncio.gather(
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 35, "nameId": "108,87,160,88", "year": "5Y"}
        ),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
        ),
    )
    # Giá heo giống VN (VNĐ/kg)
    try:
        pig_breeding = await findicator.get(
            "pig/macro-comdty-vn",
            params={"macroIds": 63, "period": "date_value"}
        )
    except Exception:
        pig_breeding = []
    # Giá vốn nuôi VN (VNĐ/kg)
    try:
        cost_of_raising = await findicator.get(
            "pig/macro-comdty-vn",
            params={"macroIds": 8, "period": "date_value"}
        )
    except Exception:
        cost_of_raising = []
    return {
        "macro_35": macro_35,
        "usd_vnd": usd_vnd,
        "pig_breeding_price": pig_breeding,   # macroIds=63
        "cost_of_raising": cost_of_raising,    # macroIds=8
    }


async def _collect_block_b():
    # pig_farming_global: CỐ ĐỊNH year=1Y — 5Y/MAX trả lỗi 400
    pig_farming, pig_legend = await asyncio.gather(
        findicator.get(
            "pig/pig_farming_global",
            params={"macroIds": "1,3", "period": "month_value", "year": "1Y"}
        ),
        findicator.get("pig/legend"),
    )
    return {
        "pig_farming": pig_farming,       # đàn VN + số heo nái
        "pig_legend": pig_legend,          # contains macroGlobalDimImportComdty (NK thịt heo)
    }


async def _collect_block_c():
    # Giá heo hơi VN + TQ + WiChart backup
    try:
        heo_hoi_vn = await findicator.get(
            "pig/macro-comdty-vn",
            params={"macroIds": 9, "period": "date_value"}
        )
    except Exception:
        heo_hoi_vn = []
    try:
        heo_tq = await findicator.get(
            "pig/macro-comdty",
            params={"macroIds": 260, "period": "date_value"}
        )
    except Exception:
        heo_tq = []

    try:
        heo_hoi_wichart = await wichart.get(key="hanghoa", name="heo_hoi")
    except Exception:
        heo_hoi_wichart = None

    return {
        "heo_hoi_vn": heo_hoi_vn,          # macroIds=9 (3 miền avg)
        "heo_tq": heo_tq,                   # macroIds=260 (CNY/kg)
        "heo_hoi_wichart": heo_hoi_wichart, # backup
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


if __name__ == "__main__":
    asyncio.run(collect())
