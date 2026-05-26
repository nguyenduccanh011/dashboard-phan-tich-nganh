"""
Collector cho ngành bảo hiểm (/sector/insurance).
Đọc: docs/sector_hub_plan.md §5.18
Output: cache/sector_insurance.json

corpType=2 (Bảo hiểm) — khác với các ngành corpType=4.
Loss ratio + Combined ratio tính client-side từ IS corpType=2.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_insurance.json")
TICKERS = ["BVH", "BMI", "BIC", "MIG", "PTI"]

# corpType=2: 14 TRAILING items (accountId 130-145)
TRAILING_ACCOUNT_IDS = "131,132,140,141,143,144,145"

# IS corpType=2: phí BH gốc, bồi thường, QLDN, LNST (để tính loss/combined ratio)
IS_ACCOUNT_IDS = "125,126,127,132,142,143,176,191,193"


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_e = await _block_e()
    block_f = await _block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "insurance",
        "sector_name": "Bảo hiểm",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        # Khối D: loss ratio + combined ratio tính client-side từ IS data
        "block_d": {"computed_client_side": True, "formulas": {
            "loss_ratio": "IS_143 / IS_132",
            "expense_ratio": "IS_176 / IS_132",
            "combined_ratio": "(IS_143 + IS_176) / IS_132",
        }},
        "block_e": block_e,
        "block_f": block_f,
            "block_g": block_g,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[insurance] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    # Lãi suất huy động 12M
    deposit_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 48, "year": "5Y"}
    )
    # Lợi suất TPCP VN 5Y (nameId=8), 10Y (nameId=9), UST 10Y (nameId=3)
    bond_yields = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 54, "nameId": "8,9,3", "year": "5Y"}
    )
    # FED rate
    fed_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 96, "nameId": 1, "year": "5Y"}
    )
    return {
        "deposit_rate": deposit_rate,
        "bond_yields": bond_yields,
        "fed_rate": fed_rate,
    }


async def _block_b():
    # Doanh thu phí BH gốc per-DN theo quý
    results = {}
    for ticker in TICKERS:
        try:
            rev = await findicator.get(
                "enterprise/insurance-revenue",
                params={"ticket": ticker, "period": "quarter", "year": "5Y"}
            )
            results[ticker] = {"type1": rev}
        except Exception as e:
            results[ticker] = {"stale": True, "stale_reason": str(e)}
    return {"insurance_revenue": results}


async def _block_e():
    results = {}
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 2,
                "ticket": f'["{ticker}"]',
                "accountIds": TRAILING_ACCOUNT_IDS,
            }
        )
        analyst = await findicator.get("enterprise/report-analysis", params={"ticket": ticker})
        results[ticker] = {"trailing": trailing, "analyst": analyst}
    return results


async def _block_f():
    # IS corpType=2 — bao gồm phí BH gốc, bồi thường, QLDN để tính ratios client-side
    results = {}
    for ticker in TICKERS:
        ts = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "INCOME_STATEMENT",
                "corpType": 2,
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
            findicator.get('enterprise/overview-valuation', params={'accountIds': '150,151', 'year': '5Y', 'ticket': ticker}),
        )
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
