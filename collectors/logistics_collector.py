"""
Collector cho ngành logistics & cảng biển (/sector/logistics).
Đọc: docs/sector_hub_plan.md §5.24
Output: cache/sector_logistics.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, transform_keys

CACHE_FILE = Path("cache/sector_logistics.json")
TICKERS = ["GMD", "HAH", "STG", "TCO", "DVP"]

TRAILING_ACCOUNT_IDS = "2,8,9,22,39,40,154,155"
IS_ACCOUNT_IDS = "24,28,43"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "logistics",
        "sector_name": "Logistics & Cảng biển",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
            "block_g": block_g,
    }
    cache = transform_keys(cache)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[logistics] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # Brent (chi phí nhiên liệu), WCI container (688), BDI hàng rời (681)
    freight_indices = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "65,688,681", "year": "5Y"}
    )
    return {"freight_indices": freight_indices}


async def _block_b():
    # XK VN tổng (proxy throughput cảng XK)
    xk_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "year": "5Y", "period": "month"}
    )
    # NK VN tổng (proxy throughput cảng NK)
    nk_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 26, "year": "5Y", "period": "month"}
    )
    # FDI vào logistics/kho vận (nameId=8)
    fdi_logistics = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 15, "nameId": 8, "year": "5Y"}
    )
    # IIP VN (proxy hàng SX nội địa)
    iip = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # PMI VN (leading indicator)
    pmi = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 6, "year": "5Y", "period": "month"}
    )
    # Container Shanghai→LA/NY
    container_routes = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "691,692", "year": "5Y"}
    )
    # Luân chuyển hàng hoá VN (3 phương thức)
    freight_turnover = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 32, "year": "5Y", "period": "month", "valueType": "value"}
    )
    # Giá vận tải kho bãi VN
    try:
        transport_price = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 33, "year": "5Y", "period": "quarter"}
        )
    except Exception as e:
        transport_price = {"stale": True, "stale_reason": str(e)}
    # XNK TQ (proxy container volume Á-TBD)
    try:
        china_trade = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 127, "year": "5Y", "period": "month", "valueType": "value"}
        )
    except Exception as e:
        china_trade = {"stale": True, "stale_reason": str(e)}
    # XNK Mỹ (proxy volume tuyến US)
    try:
        us_trade = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 87, "year": "5Y", "period": "month", "valueType": "value"}
        )
    except Exception as e:
        us_trade = {"stale": True, "stale_reason": str(e)}
    # XK VN YoY breakdown theo mặt hàng (16 nhóm, overview tabId=6)
    try:
        xk_breakdown = await findicator.get(
            "overview/overview-data",
            params={"tabId": 6, "repo": "overview_vietnam"}
        )
    except Exception as e:
        xk_breakdown = {"stale": True, "stale_reason": str(e)}
    # NK VN YoY breakdown theo nhóm NVL (overview tabId=7)
    try:
        nk_breakdown = await findicator.get(
            "overview/overview-data",
            params={"tabId": 7, "repo": "overview_vietnam"}
        )
    except Exception as e:
        nk_breakdown = {"stale": True, "stale_reason": str(e)}
    # Cán cân thương mại hàng hoá VN (macroItemId=140)
    try:
        trade_balance = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 140, "year": "5Y", "period": "month"}
        )
    except Exception as e:
        trade_balance = {"stale": True, "stale_reason": str(e)}
    # PMI Mỹ (leading indicator đơn hàng XK)
    try:
        pmi_us = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 78, "year": "5Y", "period": "month"}
        )
    except Exception as e:
        pmi_us = {"stale": True, "stale_reason": str(e)}

    return {
        "xk_vn": xk_vn,
        "nk_vn": nk_vn,
        "fdi_logistics": fdi_logistics,
        "iip": iip,
        "pmi": pmi,
        "container_routes": container_routes,
        "freight_turnover": freight_turnover,
        "transport_price": transport_price,
        "china_trade": china_trade,
        "us_trade": us_trade,
        "xk_breakdown": xk_breakdown,
        "nk_breakdown": nk_breakdown,
        "trade_balance": trade_balance,
        "pmi_us": pmi_us,
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
