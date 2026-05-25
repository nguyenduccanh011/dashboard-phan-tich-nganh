# Luồng 2 — Sectors không có Findicator Dashboard
> 11 ngành dùng macroItemId/sstock thay vì sector prefix  
> Chạy song song với Luồng 1 và 3, SAU khi Luồng 0 hoàn thành

---

## Tài liệu cần đọc trước khi bắt đầu

1. `docs/stream-0-foundation.md` — xác nhận foundation đã xong
2. `docs/sector_hub_plan.md` §4 + §4b + §5.17–§5.27
3. `docs/findicator_api.md` — macroItemId patterns
4. `docs/sstock_api.md` — `chart/general-data-series` endpoint
5. `docs/STREAMS.md` §"Nguyên tắc chung"

Section cụ thể trong `sector_hub_plan.md`:

| Ngành | Section |
|---|---|
| Plastics | §5.17 |
| Insurance | §5.18 |
| Oil & Gas | §5.19 |
| Gold | §5.20 |
| Coffee | §5.21 |
| Wood | §5.22 |
| Pharma | §5.23 |
| Logistics | §5.24 |
| Rice | §5.25 |
| Pepper | §5.26 |
| Technology | §5.27 |

---

## Đặc điểm chung của Luồng 2

Các ngành này **không có** `{sector}/legend`, `{sector}/values`, v.v. trên Findicator.  
Thay vào đó, data đến từ:

| Nguồn | Dùng cho |
|---|---|
| `macroItemId=35` | Giá hàng hoá quốc tế (nameIds khác nhau theo ngành) |
| `macroItemId=25` | XK VN theo mặt hàng (nameId=6 cà phê, 8 tiêu, 9 gạo, 29 gỗ...) |
| `macroItemId=26` | NK VN theo mặt hàng |
| `macroItemId=52` | Tỷ giá USD/VND |
| `macroItemId=7`  | IIP theo ngành (nhiều nameId) |
| `macroItemId=4`  | CPI theo danh mục |
| `macroItemId=15` | FDI theo ngành |
| `macroItemId=23` | Bán lẻ VN |
| WiChart          | Một số giá hàng hoá nội địa (lúa, tiêu, cà phê) |
| sstock `chart/general-data-series` | Giá ống nhựa, thị phần CTCK, NaOH TQ, v.v. |
| `enterprise/v2/finance-ticket-data` TRAILING + IS | Khối E/F |

---

## Pattern collector Luồng 2

Ngắn hơn Luồng 1 vì chỉ gọi `macroItemId`:

```python
# collectors/plastics_collector.py
"""
Collector cho ngành nhựa tổng hợp (/sector/plastics).
Đọc: docs/sector_hub_plan.md §5.17
Output: cache/sector_plastics.json

Không có sector dashboard riêng trên Findicator.
Data đến từ macroItemId=35 (NVL nhựa TQ) + BCTC TRAILING corpType=4.
"""
import asyncio, json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_plastics.json")
TICKERS = ["AAA", "NTP", "BMP", "DNP", "RDP"]

# nameIds cho nguyên liệu nhựa TQ (macroItemId=35)
PLASTICS_NAME_IDS = {
    170: "PET TQ (CNY/T)",
    183: "PP TQ (CNY/T)",
    231: "PVC TQ (CNY/T)",
    203: "LDPE TQ (CNY/T)",
    204: "HDPE TQ (CNY/T)",
    232: "LLDPE TQ (CNY/T)",
    67:  "Dầu WTI (feedstock)",
    66:  "Khí TN HH (feedstock)",
}

TRAILING_ACCOUNT_IDS = "35,39,40,2,8,154,155,47"  # vốn hóa, PE, PB, biên gộp, ROE, PE fwd, PB fwd, EV/EBITDA
IS_ACCOUNT_IDS = "24,28,43"  # DT, LN gộp, LNST


async def collect():
    block_a = await _block_a()
    block_b = await _block_b()
    block_c = await _block_c()
    block_e = await _block_e()
    block_f = await _block_f()

    cache = {
        "sector": "plastics",
        "sector_name": "Nhựa tổng hợp",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": {"computed_client_side": True},
        "block_e": block_e,
        "block_f": block_f,
    }
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[plastics] cache saved → {CACHE_FILE}")
    return cache


async def _block_a():
    name_ids_str = ",".join(str(k) for k in PLASTICS_NAME_IDS)
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": name_ids_str, "year": "5Y"}
    )
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 1, "year": "5Y"}
    )
    # CNY/VND fallback (macroItemId=53 dừng 31/12/2025)
    cny_vnd = await findicator.get("steel/exchange-rate")
    return {
        "plastics_raw": macro_35,
        "usd_vnd": usd_vnd,
        "cny_vnd": cny_vnd,
        "name_ids": PLASTICS_NAME_IDS,
    }


async def _block_b():
    # NK nhựa nguyên liệu VN
    import_plastic = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 26, "nameId": "22,23", "year": "5Y"}
    )
    # IIP cao su + nhựa (nameId=16)
    iip = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "nameId": 16, "year": "5Y", "period": "month", "valueType": "yoy"}
    )
    # Bán lẻ hàng hoá VN (nameId=2)
    retail = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "nameId": 2, "year": "5Y"}
    )
    return {"import_plastic": import_plastic, "iip": iip, "retail": retail}


async def _block_c():
    # Giá ống nhựa nội địa từ sstock
    pipe_series = [
        "Hàng hóa trong nước (tháng) - Ống nhựa 27 x 1.8mm",
        "Hàng hóa trong nước (tháng) - Ống nhựa 60 x 2mm",
        "Hàng hóa trong nước (tháng) - Ống nhựa 90 x 2,9mm",
    ]
    results = {}
    for name in pipe_series:
        try:
            r = await findicator.get(
                "sstock/chart/general-data-series",
                params={"dataSeriesNames": name}
            )
            results[name] = r
        except Exception as e:
            results[name] = {"error": str(e), "stale": True}
    return {"pipe_prices": results}


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


if __name__ == "__main__":
    asyncio.run(collect())
```

---

## Bảng tóm tắt mỗi ngành Luồng 2

### 5.17 Plastics — `/sector/plastics`
- **Tickers**: AAA, NTP, BMP, DNP, RDP | **corpType**: 4
- **Khối A**: macroItemId=35 nameId=170,183,231,203,204,232,67,66 + macroItemId=52
- **Khối B**: macroItemId=26 (NK nhựa nameId=22,23) + macroItemId=7 nameId=16 (IIP)
- **Khối C**: sstock `chart/general-data-series` giá ống nhựa (3 specs)
- **CNY/VND**: fallback `steel/exchange-rate` (macroItemId=53 dừng 31/12/2025)
- **Spread D**: Biên gộp BCTC vs biến động NVL — tính client-side

### 5.18 Insurance — `/sector/insurance`
- **Tickers**: BVH, BMI, BIC, MIG, PTI | **corpType**: **2** (KHÁC với các ngành khác)
- **accountIds TRAILING corpType=2**: 140(vốn hóa), 141(EPS), 143(BVPS), 144(PE), 145(PB), 131(ROE), 132(ROA)
- **accountIds IS corpType=2**: 125(phí BH gốc), 143(chi bồi thường gross), 176(QLDN), 191(LNST) + nhiều hơn
- **Loss ratio** = accountId=143 / accountId=132 — tính client-side
- **Combined ratio** = (143+176) / 132 — tính client-side
- **Khối A**: macroItemId=48 (lãi suất huy động) + macroItemId=54 (TPCP VN 5Y/10Y)
- **Khối B**: `enterprise/insurance-revenue?ticket=BVH&period=quarter&year=5Y` → type=1

### 5.19 Oil & Gas — `/sector/oilgas`
- **Tickers**: GAS, PVS, PVD, BSR, PLX | **corpType**: 4
- **Khối A**: macroItemId=35 nameId=65(Brent),67(WTI),66(HH Gas) + macroItemId=52
- **Khối B**: Gas tanker rates nameId=312–319 (VLGC, LGC, MGC...) — đây là điểm đặc trưng
- **Khối C**: macroItemId=35 nameId=612,613,614(RON95/92) + 618(DO) + 622(dầu hoả)
- **Spread D (PLX)**: Giá xăng RON95 (VNĐ/lít) − Brent × USD_VND / 159 (lít/thùng)
- **Bổ sung per-DN**: `enterprise/manufactoring-revenue?ticket=GAS&year=All&period=quarter`

### 5.20 Gold — `/sector/gold`
- **Tickers**: PNJ | **corpType**: 4
- **Khối A**: macroItemId=35 nameId=78(ICE quốc tế),730(quy đổi VNĐ),584(SJC mua),585(SJC bán) + macroItemId=52 + `bank/dxy-index`
- **Spread D**: SJC bán − quy đổi ICE × USD_VND / 26.133 → premium %
- **Note**: Không có năm nameId nào của vàng cần filter stale

### 5.21 Coffee — `/sector/coffee`
- **Tickers**: VCF, MCF | **corpType**: 4
- **Khối A**: macroItemId=35 nameId=95(Arabica ICE), 687(hạt VN Robusta) + macroItemId=52
- **Khối B**: macroItemId=25 **nameId=6** (cà phê XK) — verify: 04/2026 = 822.5 Tr USD / 189.9 kT / 4332 USD/T
- **Spread D**: Giá XK bình quân (Tr USD/Nghìn tấn) − Giá hạt VN × USD_VND

### 5.22 Wood — `/sector/wood`
- **Tickers**: GDT, VIF, PTB, ACG | **corpType**: 4
- **Khối A**: macroItemId=35 nameId=89(gỗ CME) + macroItemId=52 + macroItemId=7 **nameId=29** (IIP chế biến gỗ)
- **Khối B**: macroItemId=25 **nameId=29** (XK gỗ) + macroItemId=26 **nameId=28** (NK gỗ) + macroItemId=15 **nameId=6** (FDI gỗ)
- **`overview/overview-data?tabId=6`**: nameId=19 (XK gỗ YoY) + nameId=20 (XK tinh chế YoY)

### 5.23 Pharma — `/sector/pharma`
- **Tickers**: DHG, IMP, DMC, TRA, DBD | **corpType**: 4
- **Khối A**: macroItemId=52 + macroItemId=4 **nameId=16** (CPI thuốc +13.58%) + macroItemId=4 **nameId=5** (CPI DV y tế +17.65%) + macroItemId=26 **nameId=63** (NK dược) + **nameId=62** (NK NPL dược)
- **Khối B**: macroItemId=15 **nameId=15** (FDI y tế/dược) + macroItemId=7 **nameId=15** (IIP dược -10.2%)
- **Note**: tất cả nameIds đã verify 2026-05-24

### 5.24 Logistics — `/sector/logistics`
- **Tickers**: GMD, HAH, STG, TCO, DVP | **corpType**: 4
- **Khối A**: macroItemId=35 nameId=65(Brent) + 688(WCI container) + 681(BDI)
- **Khối B**: macroItemId=25/26 (XNK VN) + macroItemId=15 **nameId=8** (FDI logistics 366 Tr USD/tháng) + macroItemId=32 (luân chuyển HH) + macroItemId=6 (PMI VN)
- **Overlap với Transport**: freight index tương tự §5.13 — có thể tái dùng collector logic

### 5.25 Rice — `/sector/rice`
- **Tickers**: LTG, AGM, TAR | **corpType**: 4
- **Khối A**: WiChart `key=hanghoa, name=lua` (PRIMARY, fresh 2026-05-14) + macroItemId=52 + macroItemId=35 nameId=12,13(urea) + 65(Brent)
- **Khối B**: macroItemId=25 **nameId=9** (gạo XK) — verify: 04/2026 = 513.9 Tr USD / 1107 kT / 464 USD/T
- **Note WiChart**: không có year filter — backend cắt bằng `yearToCutoff()` logic

### 5.26 Pepper — `/sector/pepper`
- **Tickers**: HAL | **corpType**: 4
- **Khối A**: WiChart `key=hanghoa, name=tieu` (PRIMARY, fresh 2026-05-22) + macroItemId=52 + macroItemId=35 nameId=65
- **Khối B**: macroItemId=25 **nameId=8** (hạt tiêu XK) — verify: 04/2026 = 193.9 Tr USD / 30.9 kT / 6265 USD/T
- **Note**: Ngành nhỏ (HAL là proxy), dashboard chủ yếu phục vụ macro XK nông sản

### 5.27 Technology — `/sector/technology`
- **Tickers**: FPT, CMG, VGI, ELC | **corpType**: 4
- **Khối A**: macroItemId=52 (USD/VND, revenue offshore FPT) + macroItemId=96 (FED rate)
- **Lưu ý**: XK điện tử VN chủ yếu là Samsung/Intel (FDI, không niêm yết) — dashboard tập trung IT services + macro
- **Chưa có đủ data**: §5.27 trong sector_hub_plan.md cần bổ sung thêm trước khi implement

---

## Pattern WiChart collector (dùng cho rice, pepper)

```python
async def _collect_wichart_commodity(key: str, name: str) -> dict:
    """
    Fetch WiChart commodity data.
    WiChart không có year filter — trả toàn bộ, backend tự cắt.
    """
    try:
        data = await wichart.get(f"data/{key}", params={"name": name})
        return {
            "data": data,
            "stale": False,
            "source": f"WiChart key={key} name={name}",
        }
    except Exception as e:
        return {
            "data": [],
            "stale": True,
            "stale_reason": str(e),
            "source": f"WiChart key={key} name={name}",
        }
```

## Pattern sstock `general-data-series` (dùng cho plastics, chemistry, securities)

```python
async def _collect_sstock_series(data_series_name: str) -> dict:
    """
    Fetch sstock chart/general-data-series.
    Tên series PHẢI CHÍNH XÁC (phân biệt hoa/thường, dấu).
    """
    try:
        data = await findicator.get(
            "sstock/chart/general-data-series",
            params={"dataSeriesNames": data_series_name}
        )
        return {"data": data, "stale": False}
    except Exception as e:
        return {"data": [], "stale": True, "stale_reason": str(e)}
```

---

## Thứ tự ưu tiên ngành trong Luồng 2

| Ưu tiên | Ngành | Lý do |
|---|---|---|
| 1 | **Oil & Gas** | Gas tanker rates là điểm phân tích quan trọng (GAS/PVT) |
| 2 | **Gold** | Đơn giản + spread SJC độc đáo |
| 3 | **Insurance** | corpType=2 — phải test riêng, loss/combined ratio |
| 4 | **Plastics** | sstock pipe prices + CNY/VND fallback |
| 5 | **Logistics** | Overlap với Transport (Luồng 1) |
| 6 | Coffee | Đơn giản |
| 7 | Rice | WiChart fresh |
| 8 | Wood | IIP gỗ verify ok |
| 9 | Pharma | CPI/IIP đã verify |
| 10 | Pepper | Ngành nhỏ |
| 11 | Technology | Thiếu data, làm sau |

---

## Checklist mỗi ngành Luồng 2

- [ ] `collectors/{sector}_collector.py`: gọi đúng macroItemIds + nameIds
- [ ] WiChart stale check: set badge nếu latest data cũ > 6 tháng
- [ ] sstock series: tên exact, có fallback nếu auth fail
- [ ] `static/js/sector-{code}.js`: render đủ 6 khối
- [ ] Insurance: tính loss ratio + combined ratio client-side, hiển thị trong Khối D
- [ ] Oil & Gas: gas tanker rates hiển thị rõ ràng (8 series nameId=312–319)
- [ ] Rice/Pepper WiChart: `parseWiChartSeries(rows, yearToCutoff(year))` cho year filter
- [ ] Không có lỗi console khi mở trang
