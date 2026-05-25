"""
Collector cho ngành Ngân hàng (/sector/bank).
Đọc: docs/sector_hub_plan.md §5.2 để biết đầy đủ mapping.
Output: cache/sector_bank.json

QUAN TRỌNG: corpType=1 (không phải 4).
  PE=89, PB=90, ROE=67, ROA=68 (khác hoàn toàn corpType=4).
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_bank.json")
TICKERS = ["VCB", "BID", "CTG", "TCB", "ACB", "MBB", "VPB", "HDB", "STB", "LPB"]
TICKERS_BCTC = ["VCB", "BID", "CTG", "TCB", "ACB", "MBB"]


async def collect():
    """Thu thập toàn bộ data ngành Ngân hàng và lưu cache."""
    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()
    bank_charts = await _collect_bank_charts()

    cache = {
        "sector": "bank",
        "sector_name": "Ngân hàng",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": block_d,
        "block_e": block_e,
        "block_f": block_f,
        "bank_charts": bank_charts,
    }

    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[bank] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Lãi suất huy động (10 kỳ hạn, macroItemId=48)
    deposit_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 48, "year": "5Y"}
    )
    # Lãi suất FED
    fed_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 96, "nameId": 1, "year": "5Y"}
    )
    # Tỷ giá USD/VND
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )
    # DXY Index
    dxy = await findicator.get("bank/dxy-index", params={"year": "5Y"})

    # Lãi suất LNH (WiChart PRIMARY — macroItemId=49 xác nhận 0 rows)
    lnh = await wichart.get("tien_te", "lslnh")

    # Lợi suất TPCP 5Y/10Y (VN + US reference)
    tpcp = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 54, "nameId": "8,9,5,3", "year": "5Y"}
    )

    # OMO NHNN — stale badge: dừng 31/12/2025
    try:
        omo = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 50, "year": "5Y"}
        )
        omo_stale = False
    except Exception:
        omo = None
        omo_stale = True

    # Dự trữ ngoại hối VN
    forex_reserve = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 55, "year": "5Y"}
    )

    return {
        "deposit_rate": deposit_rate,
        "fed_rate": fed_rate,
        "usd_vnd": usd_vnd,
        "dxy": dxy,
        "lnh": lnh,
        "tpcp": tpcp,
        "omo": omo,
        "omo_stale": omo_stale,
        "forex_reserve": forex_reserve,
    }


async def _collect_block_b():
    # Tăng trưởng tín dụng vs trần NHNN (dùng ngày đầu tháng hiện tại)
    today = datetime.now()
    credit_date = f"{today.year}-{today.month:02d}-01"
    credit_growth = await findicator.get(
        "bank/bank-credit-growth",
        params={"date": credit_date}
    )
    # CASA/NPL/CoF snapshot per-bank
    overview = await findicator.get("bank/overview/bank-data")

    # Tín dụng toàn hệ thống (macroItemId=47)
    credit_system = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 47, "period": "month", "year": "5Y"}
    )

    # Cung tiền M2 (macroItemId=46, nameId=1, period=month, valueType=yoy)
    m2 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 46, "nameId": 1, "period": "month", "valueType": "yoy", "year": "5Y"}
    )

    # Cán cân thanh toán (macroItemId=56, nameId=1 vãng lai / nameId=40 tổng thể)
    balance_of_payments = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 56, "nameId": "1,40", "year": "5Y"}
    )

    return {
        "credit_growth": credit_growth,
        "overview": overview,
        "credit_system": credit_system,
        "m2": m2,
        "balance_of_payments": balance_of_payments,
    }


async def _collect_block_c():
    # NIM/CASA/CoF/LDR per-bank từ TRAILING corpType=1
    results = {}
    for ticker in TICKERS:
        data = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 1,
                "ticket": f'["{ticker}"]',
                "accountIds": "60,57,58,75",
            }
        )
        results[ticker] = data
    return results


async def _collect_block_e():
    # TRAILING corpType=1 — accountIds KHÁC corpType=4
    # PE=89, PB=90, NPL=62, CAR=73, CAR_tier1=74, ROE=67, ROA=68
    # NIM=60, CASA=57, COF=58, YEA=59, SML=63, LLCR=64, LDR=75
    # LDR_thuan=72, CIR=159, VonNH=76, CreRWA=77, VonHoa=85
    # NII_yoy=168, fee_yoy=169, TOI_yoy=170, PPOP_yoy=171, LNTT_yoy=172, LNST_yoy=173
    results = {}
    account_ids = "89,90,62,73,74,67,68,60,57,58,59,63,64,75,72,159,76,77,85,168,169,170,171,172,173"
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 1,
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
    # BCTC 8 quý: INCOME_STATEMENT corpType=1
    # accountIds: 1(NII), 46(TOI), 16(Dự phòng), 17(LNTT), 21(LNST)
    results = {}
    for ticker in TICKERS_BCTC:
        data = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "INCOME_STATEMENT",
                "corpType": 1,
                "ticket": f'["{ticker}"]',
                "accountIds": "1,46,16,17,21",
                "period": "quarter",
            }
        )
        results[ticker] = data
    return results


async def _collect_bank_charts():
    """Bank-specific charts: credit growth per-bank, asset/income structure, lãi suất huy động..."""
    results = {}

    # Danh sách 30 NH
    bank_list = await findicator.get("bank/bank-list")
    results["bank_list"] = bank_list

    # Metadata per-bank picture
    metadata = await findicator.get("bank/bank-picture-overview-metadata")
    results["metadata"] = metadata

    # TPDN outstanding
    try:
        bond_issuer = await findicator.get("enterprise/bank-debt-by-bond-issuer")
    except Exception:
        bond_issuer = []
    results["bond_issuer"] = bond_issuer

    # Per-bank detailed charts (VCB làm default)
    per_bank = {}
    for ticker in ["VCB", "BID", "TCB", "MBB", "ACB", "VPB"]:
        ticker_data = {}

        ticker_data["credit_growth"] = await findicator.get(
            "bank/bank-credit-growth-by-ticket",
            params={"tickets": ticker, "quarter": 1, "year": "5Y"}
        )
        ticker_data["asset_structure"] = await findicator.get(
            "bank/asset-structure",
            params={"tickets": ticker, "year": "5Y"}
        )
        ticker_data["income_structure"] = await findicator.get(
            "bank/income-structure",
            params={"tickets": ticker, "year": "5Y"}
        )
        ticker_data["deposit_rate"] = await findicator.get(
            "bank/deposit-interest-rate",
            params={"tickets": ticker, "year": "5Y"}
        )
        ticker_data["capital_structure"] = await findicator.get(
            "bank/capital-structure",
            params={"tickets": ticker, "year": "5Y"}
        )
        ticker_data["bad_debt_ratio"] = await findicator.get(
            "enterprise/bank-bad-debt-ratio",
            params={"ticket": ticker, "period": "quarter", "year": "5Y"}
        )
        ticker_data["loan_over_time"] = await findicator.get(
            "enterprise/bank-loan-over-time",
            params={"ticket": ticker, "period": "quarter", "year": "5Y"}
        )
        ticker_data["client_debt"] = await findicator.get(
            "enterprise/bank-client-debt",
            params={"ticket": ticker, "period": "quarter", "year": "5Y"}
        )
        ticker_data["bank_revenue"] = await findicator.get(
            "enterprise/bank-revenue",
            params={"ticket": ticker, "period": "quarter", "year": "5Y"}
        )
        ticker_data["bank_asset"] = await findicator.get(
            "enterprise/bank-asset",
            params={"ticket": ticker, "period": "quarter", "year": "5Y"}
        )
        ticker_data["bank_debt"] = await findicator.get(
            "enterprise/bank-debt",
            params={"ticket": ticker, "period": "quarter", "year": "5Y"}
        )
        ticker_data["profit_after_tax"] = await findicator.get(
            "enterprise/bank-profit-after-tax",
            params={"ticket": ticker, "period": "quarter", "year": "5Y"}
        )

        ticker_data["loan_by_sector"] = []
        ticker_data["loan_by_type"] = []
        ticker_data["loan_by_quality"] = []

        per_bank[ticker] = ticker_data

    results["per_bank"] = per_bank
    return results


if __name__ == "__main__":
    asyncio.run(collect())
