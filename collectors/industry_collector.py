"""
Collector cho ngành Khu công nghiệp (/sector/industry).
Đọc: docs/sector_hub_plan.md §5.11 để biết đầy đủ mapping.
Output: cache/sector_industry.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator

CACHE_FILE = Path("cache/sector_industry.json")
TICKERS = ["BCM", "IDC", "KBC", "LHG", "SZC", "VGC", "NTC", "D2D"]


async def collect():
    """Thu thập toàn bộ data ngành Khu công nghiệp và lưu cache."""

    block_a = await _collect_block_a()
    block_b = await _collect_block_b()
    block_c = await _collect_block_c()
    block_d = {"computed_client_side": True}
    block_e = await _collect_block_e()
    block_f = await _collect_block_f()

    block_g = await _collect_block_g()
    cache = {
        "sector": "industry",
        "sector_name": "Khu công nghiệp",
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
    print(f"[industry] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # PMI sản xuất VN
    pmi_vn = await findicator.get("industry/prd-pmi", params={"year": "5Y"})
    # IIP VN
    iip_vn = await findicator.get("industry/prd-iip", params={"year": "5Y"})
    return {
        "pmi_vn": pmi_vn,
        "iip_vn": iip_vn,
    }


async def _collect_block_b():
    # FDI vào ngành theo tỉnh (flow)
    fdi_by_province = await findicator.get("industry/fdi-sector-by-province")
    # FDI đăng ký + thực hiện (tháng/năm)
    fdi_status = await findicator.get(
        "industry/fdi-status",
        params={"filter_type": "MONTH", "year": "1Y"}
    )
    # Giá đất KCN + occupancy theo vùng
    region_land = await findicator.get("industry/region-land")
    # Giá thuê nhà máy (built-to-lease) per tỉnh
    province_factory = await findicator.get("industry/province-factory")
    # Vốn đầu tư NSNN (giải ngân CSHT → kích FDI), macroItemId=20
    capex_public = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 20, "year": "5Y"}
    )
    # Vốn đầu tư xã hội (tổng đầu tư toàn nền), macroItemId=21
    social_investment = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 21, "year": "5Y", "period": "quarter"}
    )
    # FDI thực hiện tháng (macroItemId=18)
    fdi_realized = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 18, "year": "5Y", "period": "month"}
    )
    # PMI TQ SX — tín hiệu dịch chuyển chuỗi cung ứng (macroItemId=115, nameId=8)
    pmi_china = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 115, "nameId": 8, "year": "5Y"}
    )
    # PMI SX global (CN/IN/US/VN) — nameId: 34=CN, 37=IN, 44=US, 45=VN
    pmi_global = await findicator.get(
        "overview/overview-data",
        params={"tabId": 4, "repo": "overview_global"}
    )
    return {
        "fdi_by_province": fdi_by_province,
        "fdi_status": fdi_status,
        "region_land": region_land,
        "province_factory": province_factory,
        "capex_public": capex_public,
        "social_investment": social_investment,
        "fdi_realized": fdi_realized,
        "pmi_china": pmi_china,
        "pmi_global": pmi_global,
    }


async def _collect_block_c():
    # Phê duyệt dự án per-DN (BCM)
    company_approval = await findicator.get("industry/company-approval")
    # Vị trí KCN per-DN (lấy KBC làm mẫu)
    company_land_kbc = await findicator.get(
        "industry/company-land",
        params={"ticket": "KBC"}
    )
    # Danh sách DN KCN + market cap
    filter_company = await findicator.get(
        "industry/filter-company",
        params={"limit": 20}
    )
    return {
        "company_approval": company_approval,
        "company_land_kbc": company_land_kbc,
        "filter_company": filter_company,
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
    for ticker in TICKERS[:4]:  # BCM, IDC, KBC, LHG
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
