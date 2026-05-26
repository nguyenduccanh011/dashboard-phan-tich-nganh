"""
Collector cho ngành Điện (/sector/electricity).
Đọc: docs/sector_hub_plan.md §5.16 để biết đầy đủ mapping.
Output: cache/sector_electricity.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_electricity.json")
TICKERS = ["POW", "NT2", "PC1", "REE", "HND", "GEG", "QTP", "HDG", "ASM"]
TICKERS_MANUFACTURING = ["HND", "NT2", "PC1", "REE", "GEG", "QTP", "HDG", "ASM", "TBC", "CHP", "TMP", "VSH"]

# nameIds cho input-price-trend / latest-input-price
INPUT_PRICE_NAME_IDS = [1, 2, 3, 4, 5, 6, 7, 15, 16, 17]
# resourceId cho output-resource-by-value
RESOURCE_IDS = [1, 2, 3, 5, 6, 7, 8]


async def collect():
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "electricity",
        "sector_name": "Điện",
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

    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[electricity] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Giá than + khí + dầu global (macroItemId=35)
    macro_35, usd_vnd = await asyncio.gather(
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 35, "nameId": "68,196,66,65", "year": "5Y"}
        ),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
        ),
    )

    # Giá đầu vào nội địa (gọi song song cho tất cả nameIds)
    trend_tasks = [
        findicator.get("electricity/input-price-trend", params={"nameId": nid})
        for nid in INPUT_PRICE_NAME_IDS
    ]
    latest_tasks = [
        findicator.get("electricity/latest-input-price", params={"nameId": nid})
        for nid in INPUT_PRICE_NAME_IDS
    ]
    trends_raw, latests_raw = await asyncio.gather(
        asyncio.gather(*trend_tasks, return_exceptions=True),
        asyncio.gather(*latest_tasks, return_exceptions=True),
    )

    input_price_trend = {}
    input_price_latest = {}
    for i, nid in enumerate(INPUT_PRICE_NAME_IDS):
        input_price_trend[str(nid)] = trends_raw[i] if not isinstance(trends_raw[i], Exception) else None
        input_price_latest[str(nid)] = latests_raw[i] if not isinstance(latests_raw[i], Exception) else None

    return {
        "macro_35": macro_35,
        "usd_vnd": usd_vnd,
        "input_price_trend": input_price_trend,
        "input_price_latest": input_price_latest,
    }


async def _collect_block_b():
    # output-resource-by-value: gọi per resourceId, KHÔNG có year param
    resource_value_tasks = [
        findicator.get("electricity/output-resource-by-value", params={"resourceId": rid})
        for rid in RESOURCE_IDS
    ]

    # Các call độc lập
    (
        output_plant,
        proportion,
        desc_structure,
        enso_nearest,
        iip_electric,
        elec_tq,
        *resource_values_raw,
    ) = await asyncio.gather(
        # electric-output-plant: không có year param
        findicator.get("electricity/electric-output-plant"),
        # proportion: year=5Y
        findicator.get("electricity/output-resource-by-proportion", params={"year": "All"}),
        findicator.get("electricity/electric-description-structure"),
        findicator.get("electricity/enso-nearest-date"),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 7, "nameId": 25, "year": "5Y"}
        ),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 119, "nameId": 15, "year": "5Y", "period": "month"}
        ),
        *resource_value_tasks,
    )
    try:
        enso_history = await findicator.get("electricity/enso-history", params={"year": "All"})
    except Exception:
        enso_history = []

    output_resource_by_value = {
        str(rid): resource_values_raw[i]
        for i, rid in enumerate(RESOURCE_IDS)
    }

    # ENSO forecast: dùng date từ enso-nearest-date (trả về list hoặc dict)
    enso_forecast = None
    enso_date = None
    if isinstance(enso_nearest, list) and enso_nearest:
        enso_date = enso_nearest[0]
    elif isinstance(enso_nearest, dict):
        enso_date = enso_nearest.get("date") or enso_nearest.get("nearestDate")
    if enso_date:
        try:
            enso_forecast = await findicator.get(
                "electricity/enso-forecast",
                params={"date": enso_date}
            )
        except Exception:
            enso_forecast = None

    # Sản lượng per-DN by year (gọi song song)
    manufacturing_tasks = [
        findicator.get("electricity/electric_description_manufacturing", params={"ticket": t})
        for t in TICKERS_MANUFACTURING
    ]
    manufacturing_raw = await asyncio.gather(*manufacturing_tasks, return_exceptions=True)
    manufacturing = {
        t: manufacturing_raw[i] if not isinstance(manufacturing_raw[i], Exception) else None
        for i, t in enumerate(TICKERS_MANUFACTURING)
    }

    # Lake levels: lấy danh sách trước, rồi gọi per lakeId
    lake_names = await findicator.get("electricity/lake-name")
    lake_levels = {}
    if isinstance(lake_names, list) and lake_names:
        level_tasks = []
        lake_ids = []
        for lake in lake_names:
            lake_id = lake.get("id") or lake.get("lakeId")
            if lake_id:
                lake_ids.append((lake_id, lake))
                level_tasks.append(
                    findicator.get("electricity/lake-level", params={"lakeId": lake_id})
                )
        levels_raw = await asyncio.gather(*level_tasks, return_exceptions=True)
        for i, (lake_id, lake_info) in enumerate(lake_ids):
            lake_levels[str(lake_id)] = {
                "info": lake_info,
                "data": levels_raw[i] if not isinstance(levels_raw[i], Exception) else None,
            }

    return {
        "output_plant": output_plant,
        "output_resource_by_value": output_resource_by_value,
        "output_resource_by_proportion": proportion,
        "electric_description_structure": desc_structure,
        "manufacturing_per_dn": manufacturing,
        "enso_nearest": enso_nearest,
        "enso_forecast": enso_forecast,
        "enso_history": enso_history,
        "lake_names": lake_names,
        "lake_levels": lake_levels,
        "iip_electric": iip_electric,
        "elec_tq": elec_tq,
    }


async def _collect_block_c():
    output_price, policy_renewable, policy_resource, solar_desc, resource_names = await asyncio.gather(
        findicator.get("electricity/output-price"),
        findicator.get("electricity/policy-renewable"),
        findicator.get("electricity/policy-resource"),
        findicator.get("electricity/electric_description_solar"),
        findicator.get("electricity/output-resource-name"),
    )
    return {
        "output_price": output_price,
        "policy_renewable": policy_renewable,
        "policy_resource": policy_resource,
        "solar_desc": solar_desc,
        "resource_names": resource_names,
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
    for ticker in TICKERS[:5]:  # POW, NT2, PC1, REE, HND
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
