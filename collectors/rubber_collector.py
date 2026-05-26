"""
Collector cho ngành Cao su (/sector/rubber).
Đọc: docs/sector_hub_plan.md §5.7 để biết đầy đủ mapping.
Output: cache/sector_rubber.json
Lưu ý: WiChart cao_su stale ~15 tháng (đến 02/2025) — vẫn fetch, JS hiển thị badge.
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime, date
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_rubber.json")
TICKERS = ["DPR", "PHR", "TRC"]


def _quarters(n=8):
    today = date.today()
    q = (today.month - 1) // 3
    results = []
    yr = today.year
    for _ in range(n):
        m = q * 3 + 1
        results.append(f"{m:02d}/01/{yr}")
        q -= 1
        if q < 0:
            q = 3
            yr -= 1
    return results


async def collect():
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "rubber",
        "sector_name": "Cao su",
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
    print(f"[rubber] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Cao su là ngành khai thác — không có NVL dynamic.
    # Theo dõi xăng dầu (chi phí thu hoạch + logistics)
    macro_35, usd_vnd = await asyncio.gather(
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 35, "nameId": "65,67", "year": "5Y"}
        ),
        findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
        ),
    )
    return {
        "macro_35": macro_35,  # nameId=65 (Brent), 67 (WTI)
        "usd_vnd": usd_vnd,
    }


def _compute_yoy_pct(nested):
    """Chuyển [[{date,value}×12], ...] sang flat [{date, value=YoY%}]."""
    if not isinstance(nested, list) or len(nested) < 2:
        return []
    result = []
    for yi in range(1, len(nested)):
        prev = {r["date"][5:7]: r["value"] for r in nested[yi - 1] if isinstance(r, dict) and r.get("value") is not None}
        for r in nested[yi]:
            if not isinstance(r, dict):
                continue
            m = r["date"][5:7]
            pv = prev.get(m)
            cv = r.get("value")
            if pv and cv is not None and pv != 0:
                result.append({"date": r["date"], "value": round((cv - pv) / pv * 100, 2)})
    return result


async def _collect_block_b():
    overview = await findicator.get("rubber/overview/rubber-data")
    try:
        raw_yoy = await findicator.get(
            "rubber/values-year-over-year",
            params={"macroIds": 1, "repo": "macro_vn_exim_excomdty", "year": "5Y"}
        )
        export_yoy = _compute_yoy_pct(raw_yoy)
    except Exception:
        export_yoy = []
    return {
        "overview": overview,
        "export_yoy": export_yoy,
    }


async def _collect_block_c():
    # data-year-options="1Y,3Y,5Y" — MAX → null, không hỗ trợ
    jpx, singapore = await asyncio.gather(
        findicator.get(
            "rubber/values",
            params={"repo": "macro_comdty", "macroIds": 51, "period": "date_value", "year": "5Y"}
        ),
        findicator.get(
            "rubber/values",
            params={"repo": "macro_comdty", "macroIds": 97, "period": "date_value", "year": "5Y"}
        ),
    )

    # WiChart cao_su: stale ~15 tháng (dữ liệu đến 02/2025)
    try:
        cao_su = await wichart.get(key="hanghoa", name="cao_su")
    except Exception:
        cao_su = None
    # Đánh dấu stale bất kể fetch thành công hay không
    if isinstance(cao_su, dict):
        cao_su["stale"] = True
        cao_su["stale_reason"] = "Dữ liệu đến 02/2025"
    else:
        cao_su = {"stale": True, "stale_reason": "Dữ liệu đến 02/2025", "data": cao_su}

    return {
        "jpx": jpx,         # JPX (JPY/Kg) — nameId=51
        "singapore": singapore,  # Singapore TSR20 (USD Cents/Kg) — nameId=93
        "wichart_cao_su": cao_su,
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
    quarters = _quarters(8)
    results = {}
    for ticker in TICKERS:
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
