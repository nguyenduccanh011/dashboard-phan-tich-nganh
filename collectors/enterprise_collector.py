"""
Enterprise Collector — fetch dữ liệu tài chính doanh nghiệp.
Output: cache/enterprise_finance.json

Coverage:
  - Corp list + search + profile
  - Valuation (PE/PB/dividend)
  - Finance comparison (54 TRAILING metrics)
  - Bank metrics (10+ endpoints)
  - Stock OHLC
"""
import asyncio, json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, transform_keys

CACHE_FILE = Path("cache/enterprise_finance.json")

MAJOR_BANKS = ["ACB", "VCB", "VPB", "TPB", "MBB", "BID", "HDB", "CTG", "SHB", "TCB",
               "MB", "STB", "MSB", "EIB", "GPB", "BAB", "SGB", "ABB", "BVH", "PGB",
               "BIC", "NHB", "PVB", "VAB", "OJB", "KLB", "PNB", "CIB", "OCB", "WBK"]

MAJOR_SECURITIES = ["AAS", "MAS", "SSI", "VNS", "VCS", "FTS", "VDS", "BSI", "CTS", "HCM",
                    "RYM", "VCI", "KFS", "TS", "VPS"]

MAJOR_ENTERPRISES = ["VIC", "FPT", "VHM", "HPG", "PGV", "MSN", "NVL", "VRE", "PDR", "PNJ"]


async def collect():
    """Thu thập toàn bộ dữ liệu doanh nghiệp."""

    corp_data = await _collect_corp_data()
    valuation_data = await _collect_valuation()
    finance_comparison = await _collect_finance_comparison()
    bank_data = await _collect_bank_metrics()
    overview_legend = await _collect_overview_legend()

    cache = {
        "sector": "enterprise",
        "updated_at": datetime.now().isoformat(),
        "corp_data": corp_data,
        "valuation": valuation_data,
        "finance_comparison": finance_comparison,
        "bank_metrics": bank_data,
        "overview_legend": overview_legend,
    }

    CACHE_FILE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"[enterprise] cache saved → {CACHE_FILE}")


async def _collect_corp_data():
    """Corp list, search, profile."""
    try:
        corp_list = await findicator.get_corp_list()
    except Exception as e:
        print(f"[enterprise] corp-list error: {e}")
        corp_list = []

    return {
        "corp_list": corp_list,
        "total": len(corp_list) if isinstance(corp_list, list) else 0,
    }


async def _collect_valuation():
    """PE/PB/dividend heatmap cho 35 CTCK + 30 NH."""
    major_tickers = MAJOR_SECURITIES + MAJOR_BANKS[:10] + MAJOR_ENTERPRISES[:5]

    valuation = {}
    for ticker in major_tickers:
        try:
            overview_val = await findicator.get_overview_valuation(ticker)
            dividend = await findicator.get_overview_dividend(ticker)
            valuation[ticker] = {
                "valuation": overview_val,
                "dividend": dividend,
            }
        except Exception as e:
            print(f"[enterprise] valuation/{ticker} error: {e}")
            valuation[ticker] = {"error": str(e)}

    return valuation


async def _collect_finance_comparison():
    """54 TRAILING metrics per-ticket for major enterprises."""
    major_tickers = MAJOR_ENTERPRISES + MAJOR_BANKS[:10] + MAJOR_SECURITIES[:5]

    # Fetch finance labels (54 metrics)
    try:
        finance_labels = await findicator.get_finance_label()
    except Exception as e:
        print(f"[enterprise] finance-label error: {e}")
        finance_labels = {}

    # Fetch TRAILING metrics cho grouped tickets (batch requests để tránh rate limit)
    batch_size = 5
    finance_data = {}

    for i in range(0, len(major_tickers), batch_size):
        batch = major_tickers[i:i+batch_size]
        try:
            data = await findicator.get_finance_ticket_data(batch, table_name="TRAILING")
            if isinstance(data, dict):
                finance_data.update(data)
            else:
                print(f"[enterprise] Unexpected finance data format for batch {batch}")
        except Exception as e:
            print(f"[enterprise] finance-ticket-data batch {batch} error: {e}")

    return {
        "finance_labels": finance_labels,
        "finance_data": finance_data,
        "tickers": major_tickers,
    }


async def _collect_bank_metrics():
    """Bank-specific metrics (10+ endpoints)."""
    bank_metrics = {}

    for ticker in MAJOR_BANKS[:10]:
        try:
            revenue = await findicator.get_bank_revenue(ticker)
            asset = await findicator.get_bank_asset(ticker)
            npl = await findicator.get_bank_bad_debt_ratio(ticker)

            bank_metrics[ticker] = {
                "revenue": revenue,
                "asset": asset,
                "bad_debt_ratio": npl,
            }
        except Exception as e:
            print(f"[enterprise] bank/{ticker} metrics error: {e}")
            bank_metrics[ticker] = {"error": str(e)}

    return bank_metrics


async def _collect_overview_legend():
    """66 live prices + metadata từ overview/legend."""
    try:
        legend = await findicator.get_overview_legend()
        return legend
    except Exception as e:
        print(f"[enterprise] overview-legend error: {e}")
        return {}


if __name__ == "__main__":
    asyncio.run(collect())
