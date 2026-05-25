"""
Collector cho ngành Chứng khoán (/sector/securities).
Đọc: docs/sector_hub_plan.md §5.14 để biết đầy đủ mapping.
Output: cache/sector_securities.json

QUAN TRỌNG: corpType=3 cho TRAILING (khác corpType=4).
  Prefix Findicator: `stock` (không phải `securities`).
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_securities.json")
TICKERS = ["SSI", "VND", "HCM", "MBS", "VCI", "BSI", "FTS"]
# Top CTCK cho sstock market share time-series
TOP_CTCK = ["SSI", "VPS", "TCBS", "VCI", "HCM", "MBS", "VND", "MAS", "KIS", "FTS"]


async def collect():
    """Thu thập toàn bộ data ngành Chứng khoán và lưu cache."""
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    cache = {
        "sector": "securities",
        "sector_name": "Chứng khoán",
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
    print(f"[securities] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Lãi suất vay margin (proxy VNIBOR, macroItemId=48)
    margin_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 48, "year": "5Y"}
    )

    # Thanh khoản TTCK + VNINDEX + VN30 (macroItemId=134)
    market_data = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 134, "year": "5Y"}
    )

    return {
        "margin_rate": margin_rate,
        "market_data": market_data,
    }


async def _collect_block_b():
    # Thị phần môi giới tất cả CTCK (35 DN)
    brokerage_share = await findicator.get("stock/brokerage-market-share-companies")

    # Dư nợ margin toàn thị trường (TRAILING corpType=3, accountId=108)
    margin_debt_results = {}
    for ticker in TICKERS:
        try:
            data = await findicator.get(
                "enterprise/v2/finance-ticket-data",
                params={
                    "tableName": "TRAILING",
                    "corpType": 3,
                    "ticket": f'["{ticker}"]',
                    "accountIds": "108",
                }
            )
            margin_debt_results[ticker] = data
        except Exception as e:
            margin_debt_results[ticker] = {"error": str(e)}

    # Breadth TTCK (%CP>SMA200) + PE/PB TTCK VN
    market_breadth_pe = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 134, "nameId": "19,22,24", "year": "5Y"}
    )

    # Thị phần môi giới quarterly per-CTCK (sstock)
    market_share_ts = {}
    for ctck in TOP_CTCK:
        try:
            data = await wichart.get(
                "chart/general-data-series",
                params={"dataSeriesNames": f"Thị phần giao dịch - {ctck}"}
            )
            market_share_ts[ctck] = data
        except Exception as e:
            market_share_ts[ctck] = {"error": str(e)}

    return {
        "brokerage_share": brokerage_share,
        "margin_debt": margin_debt_results,
        "market_breadth_pe": market_breadth_pe,
        "market_share_ts": market_share_ts,
    }


async def _collect_block_c():
    results = {}
    for ticker in TICKERS:
        ticker_data = {}
        try:
            ticker_data["revenue"] = await findicator.get(
                "stock/enterprise-stock-revenue",
                params={"ticket": ticker, "year": "5Y"}
            )
        except Exception as e:
            ticker_data["revenue"] = {"error": str(e)}

        try:
            ticker_data["gross_profit"] = await findicator.get(
                "stock/gross-profit-structure",
                params={"tickets": ticker}
            )
        except Exception as e:
            ticker_data["gross_profit"] = {"error": str(e)}

        try:
            ticker_data["asset"] = await findicator.get(
                "stock/enterprise-stock-asset",
                params={"ticket": ticker, "year": "5Y"}
            )
        except Exception as e:
            ticker_data["asset"] = {"error": str(e)}

        try:
            ticker_data["debt"] = await findicator.get(
                "stock/enterprise-stock-debt",
                params={"ticket": ticker, "year": "5Y"}
            )
        except Exception as e:
            ticker_data["debt"] = {"error": str(e)}

        results[ticker] = ticker_data

    # Dòng tiền ròng TTCK (nameId=1 và 2)
    try:
        money_flow = await findicator.get(
            "stock/money-flow",
            params={"nameId": "1,2", "period": "month_value", "year": "1Y"}
        )
    except Exception:
        money_flow = []
    results["money_flow"] = money_flow

    return results


async def _collect_block_e():
    # TRAILING corpType=3
    # accountIds theo §5.14: 99=Biên LN gộp, 104=ROE, 105=ROA,
    #   107=Thị phần MG HOSE, 160=HNX, 161=UPCOM, 108=Dư nợ margin, 109=Margin/Vốn CSH
    results = {}
    account_ids = "99,104,105,107,160,161,108,109"
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 3,
                "ticket": f'["{ticker}"]',
                "accountIds": account_ids,
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
    for ticker in TICKERS[:4]:  # SSI, VND, HCM, MBS
        data = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "INCOME_STATEMENT",
                "corpType": 3,
                "ticket": f'["{ticker}"]',
                "accountIds": "24,28,43,2",
                "period": "quarter",
            }
        )
        results[ticker] = data
    return results


if __name__ == "__main__":
    asyncio.run(collect())
