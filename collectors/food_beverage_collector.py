"""
Collector cho ngành Thực phẩm & Đồ uống (/sector/food-beverage).
Đọc: docs/sector_hub_plan.md §5.15 để biết đầy đủ mapping.
Output: cache/sector_food_beverage.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_food_beverage.json")
TICKERS = ["VNM", "SAB", "BHN", "MCM", "QNS", "KDC"]


async def collect():
    """Thu thập toàn bộ data ngành Thực phẩm & Đồ uống và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = {"computed_client_side": True}
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    cache = {
        "sector": "food-beverage",
        "sector_name": "Thực phẩm & Đồ uống",
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
    print(f"[food-beverage] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Đường RS An Khê (685), Đường ICE (97), Lúa mỳ CBOT (88),
    # Ngô CBOT (108), Đậu nành (87), Dầu cọ Malaysia (90), Đường TQ (220)
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "685,97,88,108,87,90,220", "year": "5Y"}
    )
    return {"macro_35": macro_35}


async def _collect_block_b():
    # Tiêu thụ bia theo sản phẩm/kênh (SAB/BHN/HABECO)
    beer_data = await findicator.get("food-and-beverage/overview/beer-data")
    # Thị phần sữa (Vinamilk ~40%)
    milk_data = await findicator.get("food-and-beverage/overview/milk-data")
    # Giá hàng hoá F&B VN (đường/gạo)
    try:
        comdty_vn = await findicator.get(
            "food-and-beverage/values",
            params={"repo": "macro_comdty_vn"}
        )
    except Exception:
        comdty_vn = []
    # Bán lẻ VN (proxy tiêu dùng nội địa), macroItemId=23
    retail_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "year": "5Y"}
    )
    return {
        "beer_data": beer_data,
        "milk_data": milk_data,
        "comdty_vn": comdty_vn,
        "retail_vn": retail_vn,
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
    for ticker in TICKERS[:4]:  # VNM, SAB, BHN, MCM
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
