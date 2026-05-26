"""
Macro collector — fetch tất cả dữ liệu vĩ mô.
Output: cache/macro_vn.json + cache/macro_global.json

Mapping macroItemId từ sector_hub_plan.md §5.1–§5.2 (tham chiếu chéo các ngành).
"""
import asyncio, json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart, transform_keys

VN_CACHE = Path("cache/macro_vn.json")
GLOBAL_CACHE = Path("cache/macro_global.json")


async def collect():
    vn_data = await _collect_vn()
    global_data = await _collect_global()

    VN_CACHE.write_text(
        json.dumps({"updated_at": datetime.now().isoformat(), **vn_data}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    GLOBAL_CACHE.write_text(
        json.dumps({"updated_at": datetime.now().isoformat(), **global_data}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"[macro] VN cache saved → {VN_CACHE}")
    print(f"[macro] Global cache saved → {GLOBAL_CACHE}")


async def _collect_vn():
    """Vĩ mô trong nước."""

    # GDP tăng trưởng (macroItemId=1, quarter, yoy)
    gdp = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 1, "year": "5Y", "period": "quarter", "valueType": "yoy"}
    )

    # CPI VN (macroItemId=4, month, yoy)
    cpi_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 4, "nameId": 1, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # PMI sản xuất VN (macroItemId=6, month)
    pmi_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 6, "year": "5Y", "period": "month", "valueType": "value"}
    )

    # IIP tổng VN (macroItemId=7, month, yoy)
    iip_total = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "nameId": 1, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # Chỉ số tiêu thụ CN (macroItemId=12, quarter, value+yoy)
    consumption_idx = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 12, "year": "5Y", "period": "quarter"}
    )

    # Chỉ số tồn kho CN (macroItemId=13, quarter, value+yoy)
    inventory_idx = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 13, "year": "5Y", "period": "quarter"}
    )

    # FDI thực hiện (macroItemId=18, month, value+yoy)
    fdi = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 18, "year": "5Y", "period": "month"}
    )

    # Vốn đầu tư NSNN (macroItemId=20, month, value+yoy)
    gov_invest = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 20, "year": "5Y", "period": "month"}
    )

    # Bán lẻ VN (macroItemId=23, month, value+yoy)
    retail_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "nameId": 2, "year": "5Y", "period": "month"}
    )

    # XK VN tổng (macroItemId=25, month, value+yoy)
    export_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 1, "year": "5Y", "period": "month"}
    )

    # NK VN tổng (macroItemId=26, month, value+yoy)
    import_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 26, "nameId": 1, "year": "5Y", "period": "month"}
    )

    # Tín dụng toàn hệ thống (macroItemId=47, month, value+yoy)
    credit = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 47, "year": "5Y", "period": "month"}
    )

    # Lãi suất huy động (macroItemId=48, nhiều kỳ hạn)
    deposit_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 48, "year": "5Y", "period": "month"}
    )

    # Lãi suất LNH (WiChart PRIMARY)
    try:
        lslnh = await wichart.get("data/tien_te", params={"name": "lslnh"})
    except Exception as e:
        lslnh = {"error": str(e), "stale": True}

    # Cung tiền M2 (macroItemId=46, nameId=1, month, yoy)
    m2 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 46, "nameId": 1, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # Tỷ giá USD/VND (macroItemId=52, nameId=1)
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 2, "year": "5Y"}
    )

    # Lợi suất TPCP VN 5Y + 10Y (macroItemId=54 — max 5Y, KHÔNG có MAX)
    tpcp_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 54, "nameId": "8,9", "year": "5Y"}
    )

    # OMO NHNN (macroItemId=50) — dừng 31/12/2025 → stale badge
    try:
        omo = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 50, "year": "5Y"}
        )
        omo_meta = {"data": omo, "stale": False}
    except Exception:
        omo_meta = {"data": [], "stale": True, "stale_reason": "Dừng 31/12/2025"}

    # Dự trữ ngoại hối (macroItemId=55)
    forex_reserve = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 55, "year": "5Y"}
    )

    # Cán cân thanh toán (macroItemId=56, quarterly)
    balance_of_payments = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 56, "year": "5Y", "period": "quarter"}
    )

    # TTCK VN (macroItemId=134)
    market = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 134, "year": "5Y"}
    )

    return {
        "gdp": gdp,
        "cpi_vn": cpi_vn,
        "pmi_vn": pmi_vn,
        "iip_total": iip_total,
        "consumption_idx": consumption_idx,
        "inventory_idx": inventory_idx,
        "fdi": fdi,
        "gov_invest": gov_invest,
        "retail_vn": retail_vn,
        "export_vn": export_vn,
        "import_vn": import_vn,
        "credit": credit,
        "deposit_rate": deposit_rate,
        "lslnh": lslnh,
        "m2": m2,
        "usd_vnd": usd_vnd,
        "tpcp_vn": tpcp_vn,
        "omo": omo_meta,
        "forex_reserve": forex_reserve,
        "balance_of_payments": balance_of_payments,
        "market": market,
    }


async def _collect_global():
    """Vĩ mô toàn cầu."""

    # FED rate (macroItemId=96, nameId=1)
    fed_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 96, "nameId": 1, "year": "5Y"}
    )

    # Lợi suất UST 2Y + 10Y (macroItemId=54 nameId=US_2Y/US_10Y)
    ust = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 54, "nameId": "3,4", "year": "5Y"}
    )

    # DXY index
    dxy = await findicator.get("bank/dxy-index", params={"year": "5Y"})

    # CPI TQ (macroItemId=107, month, yoy) — lag ~13 tháng
    cpi_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 107, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # PPI TQ (macroItemId=112, month, yoy) — lag ~5 tháng
    ppi_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 112, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # PMI TQ (macroItemId=115, nameId=8 SX + nameId=9 XK orders)
    pmi_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 115, "nameId": "8,9", "year": "5Y", "period": "month"}
    )

    # Global PMI nhiều quốc gia (overview/overview-data?tabId=4)
    try:
        global_pmi = await findicator.get("overview/overview-data", params={"tabId": 4})
    except Exception:
        global_pmi = []

    # XNK TQ (macroItemId=127, month, value+yoy)
    trade_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 127, "year": "5Y", "period": "month"}
    )

    # Bán lẻ TQ (macroItemId=126, month, value+yoy)
    retail_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 126, "year": "5Y", "period": "month"}
    )

    # Bán lẻ Mỹ (macroItemId=84, nameId=1 tổng + nameId=14 thực phẩm)
    retail_us = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 84, "nameId": "1,14", "year": "5Y", "period": "month"}
    )

    # XNK Mỹ (macroItemId=87, month, value+yoy)
    trade_us = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 87, "year": "5Y", "period": "month"}
    )

    # Hàng hoá key (macroItemId=35, nameIds quan trọng nhất)
    # Brent=65, WTI=67, HH Gas=66, Quặng CME=82, HRC CME=86, Than ICE=68,
    # Ngô CBOT=108, ĐN CBOT=87, Bông CBOT=98, Arabica=95, Vàng ICE=78, Urea CME=50
    commodities = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "65,67,66,82,86,68,108,87,98,95,78,50", "year": "5Y"}
    )

    # BĐS TQ (macroItemId=121-125)
    realestate_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": "121,122,123,125", "year": "5Y", "period": "quarter"}
    )

    return {
        "fed_rate": fed_rate,
        "ust": ust,
        "dxy": dxy,
        "cpi_cn": {"data": cpi_cn, "stale": False, "lag_note": "Lag ~13 tháng"},
        "ppi_cn": {"data": ppi_cn, "stale": False, "lag_note": "Lag ~5 tháng"},
        "pmi_cn": pmi_cn,
        "global_pmi": global_pmi,
        "trade_cn": trade_cn,
        "retail_cn": retail_cn,
        "retail_us": retail_us,
        "trade_us": trade_us,
        "commodities": commodities,
        "realestate_cn": realestate_cn,
    }


if __name__ == "__main__":
    asyncio.run(collect())
