"""
Collector cho ngành Vận tải biển (/sector/transport).
Đọc: docs/sector_hub_plan.md §5.13 để biết đầy đủ mapping.
Output: cache/sector_transport.json

QUAN TRỌNG:
  - nameId=322 (MR tanker) và 341 (VLCC): 0 rows — ĐÃ LOẠI BỎ
  - nameId=339 (Aframax) và 340 (Suezmax): CÓ data ✅
  - Gas tanker 316-319: CÓ data (USD/tháng) ✅
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, transform_keys

CACHE_FILE = Path("cache/sector_transport.json")
TICKERS = ["GMD", "HAH", "PVT", "VSC", "VOS", "MVN"]

# macroIds string cho transport/values — KHÔNG gồm 322 (MR) và 341 (VLCC) vì 0 rows
FREIGHT_MACRO_IDS = "679,680,681,688,308,309,310,311,339,340,689,690,691,692,693,694,695,696,312,313,314,315,316,317,318,319"


async def collect():
    """Thu thập toàn bộ data ngành Vận tải biển và lưu cache."""
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = {"note": "Không có per-DN per-route data — dùng freight index + BCTC làm proxy"}
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()
    macro_transport = await _collect_macro_transport()

    block_g = await _collect_block_g()
    cache = {
        "sector": "transport",
        "sector_name": "Vận tải biển",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": block_d,
        "block_e": block_e,
        "block_f": block_f,
        "macro_transport": macro_transport,
            "block_g": block_g,
    }

    cache = transform_keys(cache)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[transport] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Dầu Brent và WTI
    oil = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "65,67", "year": "5Y"}
    )
    return {"oil": oil}


async def _collect_block_b():
    # Tất cả freight index qua transport/values
    # nameId=339 (Aframax) + 340 (Suezmax) đã xác nhận có data (verify 2026-05-24)
    # nameId=322 (MR) + 341 (VLCC) = 0 rows — không gọi
    freight = await findicator.get(
        "transport/values",
        params={"macroIds": FREIGHT_MACRO_IDS, "year": "5Y"}
    )
    return {"freight": freight}


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
    for ticker in TICKERS[:4]:  # GMD, HAH, PVT, VSC
        data = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "INCOME_STATEMENT",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": "24,28,43,2",
                "period": "quarter",
            }
        )
        results[ticker] = data
    return results


async def _collect_macro_transport():
    # Vĩ mô vận tải hỗ trợ
    tasks = await asyncio.gather(
        # Luân chuyển hàng hoá VN
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 32, "period": "month", "year": "5Y"}),
        # Giá vận tải kho bãi VN
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 33, "period": "quarter", "year": "5Y"}),
        # XNK Mỹ
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 87, "period": "month", "year": "5Y"}),
        # XNK TQ
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 127, "period": "month", "year": "5Y"}),
        # Bán lẻ TQ
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 126, "period": "month", "year": "5Y"}),
        # Bán lẻ Mỹ
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 84, "period": "month", "year": "5Y"}),
        # XK VN tổng
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 25, "period": "month", "year": "5Y"}),
        # PMI TQ đơn hàng XK
        findicator.get("macro-data/macro-item-detail",
                       params={"macroItemId": 115, "nameId": 9, "period": "month", "year": "5Y"}),
        # PMI SX US/EU/JP (tabId=4)
        findicator.get("overview/overview-data",
                       params={"tabId": 4}),
        return_exceptions=True,
    )

    keys = [
        "freight_volume_vn", "transport_price_vn",
        "us_trade", "cn_trade", "cn_retail", "us_retail",
        "vn_export", "cn_pmi_export_orders", "pmi_global",
    ]
    return {k: (v if not isinstance(v, Exception) else {"error": str(v)})
            for k, v in zip(keys, tasks)}



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
