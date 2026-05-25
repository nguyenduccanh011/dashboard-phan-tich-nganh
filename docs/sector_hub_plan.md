# Sector Hub — Kế hoạch dự án đầy đủ

> Phiên bản: 1.3 | Cập nhật: 2026-05-24 (test API thực tế — fix bank accountIds + 11 bổ sung)  
> Nguồn dữ liệu: Findicator, WiChart, FireAnt  
> Scope: Web app phân tích ngành — **27 ngành** (21 gốc + gỗ/dược/logistics + lúa gạo/hồ tiêu/công nghệ) + Macro dashboard

---

## 1. Tổng quan dự án

### Mục tiêu
Một web app tập trung tất cả dữ liệu cần thiết để phân tích từng ngành cổ phiếu Việt Nam:
- Giá nguyên vật liệu đầu vào
- Giá bán / ASP đầu ra
- Thị phần và sản lượng các DN trong ngành
- BCTC so sánh nhiều ticker (IS/BS/TRAILING)
- Định giá realtime (PE/PB/PS)
- Xu hướng XNK, FDI, vĩ mô liên quan

### Nguyên tắc thiết kế
1. **Mỗi ngành = 1 URL** — `/sector/steel`, `/sector/bank`, v.v.
2. **Data cache JSON** — backend gọi Findicator, lưu file JSON; browser chỉ đọc cache
3. **Cron hàng ngày** — tự động refresh 7:30 sáng
4. **Highcharts** — thống nhất với hệ thống VVIP hiện tại

---

## 2. Tech Stack

| Layer | Công nghệ | Lý do |
|---|---|---|
| Backend | FastAPI (Python) | Tái dùng findicator_api.py, wichart_api.py |
| Cache | JSON files trong `cache/` | Không cần DB, đơn giản, portable |
| Scheduler | APScheduler (chạy trong FastAPI) | Không cần cron riêng |
| Frontend | Vanilla JS + Highcharts + Tailwind CDN | Nhẹ, nhanh, không build step |
| Charts | Highcharts (CDN) | Đã có license, đồng nhất với VVIP |
| Auth | Không — nội bộ, chạy localhost | Phase 1 đơn giản |

---

## 3. Cấu trúc thư mục

```
sector-hub/                         ← thư mục dự án riêng
│
├── app.py                          ← FastAPI entry point + APScheduler
├── requirements.txt
├── .env                            ← FINDICATOR_EMAIL, PASSWORD, SECRET
│
├── routers/
│   ├── macro.py                    ← /api/macro/*
│   ├── sector.py                   ← /api/sector/{code}/*
│   └── stock.py                    ← /api/stock/{ticker}/*
│
├── collectors/                     ← thu thập + lưu cache
│   ├── base.py                     ← FindicatorClient, WiChartClient (copy/symlink)
│   ├── macro_collector.py          ← vĩ mô VN/US/CN
│   ├── steel_collector.py          ← ngành thép
│   ├── bank_collector.py           ← ngành ngân hàng
│   ├── cement_collector.py         ← xi măng
│   ├── pangasius_collector.py      ← cá tra
│   ├── shrimp_collector.py         ← tôm
│   ├── aviation_collector.py       ← hàng không
│   ├── rubber_collector.py         ← cao su
│   ├── pig_collector.py            ← chăn nuôi
│   ├── chemistry_collector.py      ← phân bón / hóa chất
│   ├── textile_collector.py        ← dệt may
│   ├── industry_collector.py       ← KCN
│   ├── realestate_collector.py     ← BĐS
│   ├── transport_collector.py      ← vận tải biển
│   ├── stock_sec_collector.py      ← chứng khoán (CTCK)
│   ├── food_beverage_collector.py  ← thực phẩm đồ uống
│   ├── plastics_collector.py       ← nhựa tổng hợp
│   ├── insurance_collector.py      ← bảo hiểm
│   ├── oilgas_collector.py         ← dầu khí
│   ├── gold_collector.py           ← vàng
│   └── coffee_collector.py         ← cà phê
│
├── cache/                          ← JSON files, overwrite daily
│   ├── macro_vn.json
│   ├── macro_global.json
│   ├── sector_steel.json
│   ├── sector_bank.json
│   ├── sector_plastics.json
│   ├── sector_insurance.json
│   ├── sector_oilgas.json
│   ├── sector_gold.json
│   ├── sector_coffee.json
│   ├── ...                         ← 1 file per sector
│   └── stock_{TICKER}.json         ← per-ticker cache
│
├── static/
│   ├── index.html                  ← landing page / sector list
│   ├── sector.html                 ← template trang ngành (JS fetch)
│   ├── macro.html                  ← trang vĩ mô
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── charts.js               ← Highcharts helpers
│       ├── sector-steel.js         ← render logic ngành thép
│       ├── sector-bank.js
│       └── ...
│
└── docs/
    └── api_mapping.md              ← này (tài liệu kế hoạch)
```

---

## 4. Layout trang ngành (chung)

Mỗi trang ngành có cấu trúc 6 khối cố định, nội dung khác nhau:

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Tên ngành | Cập nhật: HH:MM DD/MM/YYYY               │
├────────────────────┬────────────────────────────────────────────┤
│ [A] GIÁ ĐẦU VÀO   │ [B] THỊ TRƯỜNG NGÀNH                      │
│ Giá NVL key (5 TS) │ Thị phần DN (pie/bar) + sản lượng trend   │
├────────────────────┼────────────────────────────────────────────┤
│ [C] GIÁ BÁN / ASP │ [D] SPREAD / MARGIN TRACKER               │
│ Giá đầu ra (3 TS)  │ = Giá bán − weighted NVL đầu vào         │
├────────────────────┴────────────────────────────────────────────┤
│ [E] BẢNG CỔ PHIẾU NGÀNH                                        │
│ Ticker | Giá | Vốn hóa | PE | PB | Biên gộp | ROE | YTD %    │
│ + Analyst consensus: Recommend | Upside% | Target price       │
├─────────────────────────────────────────────────────────────────┤
│ [F] BCTC SO SÁNH — 8 quý liên tiếp (line + bar combo)         │
│ Doanh thu | Lợi nhuận gộp | LNST | Biên gộp %                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4b. Quy tắc chung cho Khối E (áp dụng mọi ngành)

### Forward Valuation (corpType=4 SX/BĐS — KHÔNG áp dụng cho NH/CK/BH)

| accountId | Chỉ số | API |
|---|---|---|
| 154 | PE forward (consensus analyst) | `enterprise/overview-valuation?ticket=&accountIds=154` |
| 155 | PB forward (consensus analyst) | `enterprise/overview-valuation?ticket=&accountIds=155` |
| 46 | EV/EBIT (trailing) | `finance-ticket-data?tableName=TRAILING` |
| 47 | EV/EBITDA (trailing) | `finance-ticket-data?tableName=TRAILING` |
| 43 | EV tuyệt đối (Tỷ đồng) | `finance-ticket-data?tableName=TRAILING` |

### Working Capital & Growth KPIs (corpType=4 TRAILING — verify 2026-05-24, HPG Q1/2026)

Các accountId dưới đây có sẵn trong TRAILING nhưng chưa có trong bảng Khối E cơ bản. Thêm vào Khối E mỗi ngành theo mức độ liên quan:

| accountId | Chỉ số | Giá trị mẫu (HPG Q1/2026) | Ngành ưu tiên |
|---|---|---|---|
| 13 | Số ngày tồn kho (DIO) | 120.6 ngày | Thép, F&B, nhựa, dệt may |
| 14 | Số ngày phải thu (DSO) | 19.4 ngày | Thép, BĐS, KCN |
| 16 | Số ngày phải trả (DPO) | 38.2 ngày | Mọi ngành SX |
| 17 | Chu kỳ tiền mặt CCC = DIO+DSO−DPO | 101.7 ngày | Thép, dệt may, F&B |
| 24 | Interest coverage (EBIT/lãi vay) | 3.55x | BĐS, dầu khí, thép vay nhiều |
| 49 | Net cash tuyệt đối (Tỷ đồng) | −54,894 (=accountId 48) | Mọi ngành — dùng accountId=48 |
| 50 | Net cash / Vốn hóa (%) | −0.266 | Mọi ngành SX |
| 164 | Tăng trưởng EBIT YoY | +52.9% | Ngành có biến động chi phí lớn |
| 165 | Tăng trưởng EBITDA YoY | +54.5% | Thép, điện, logistics |
| 166 | Tăng trưởng LNST hợp nhất YoY | +170.3% | Mọi ngành |
| 167 | Tăng trưởng LNST CT mẹ YoY | +168.9% | Mọi ngành |

> Gọi qua `enterprise/v2/finance-ticket-data?tableName=TRAILING&corpType=4&ticket=["HPG"]&period=quarter&date=MM/DD/YYYY`.

### Waterfall DT→LNST (corpType=4 SX/BĐS)

Dùng `enterprise/manufactoring-revenue-to-profit-ratio` cho 1 quý cụ thể (11 type: DT→GVHB→LN gộp→CF tài chính→LNTT→thuế→LNST). Kết hợp với Khối F BCTC 8 quý cho phân tích xu hướng.

### Per-chart time buttons

Mỗi chart trong sector.html cần attribute `data-year-options` riêng (không dùng global filter):
- Hàng hoá daily: `data-year-options="1Y,3Y,5Y,MAX"`
- Macro monthly: `data-year-options="1Y,3Y,5Y"`
- `pig/pig_farming_global`: **cố định `year=1Y`** (5Y/MAX → 400)
- `electricity/output-resource-by-proportion`: `data-year-options="5Y,10Y,All"`
- `electricity/enso-history`: `data-year-options="1Y,3Y,5Y,All"`
- `macroItemId=54 (TPCP)`: tối đa `5Y` (MAX không hỗ trợ)
- WiChart: **không có filter** — frontend tự cắt theo `timestamp_ms`

| `rubber/values` | `data-year-options="1Y,3Y,5Y"` (MAX → trả null, không hỗ trợ) |
| `transport/values` | `data-year-options="1Y,3Y,5Y"` (MAX → trả null, không hỗ trợ) |
| `aviation/flight-company-data` | `data-year-options="1Y,3Y,5Y"` (MAX → trả null, không hỗ trợ) |
| `cement/coal-price`, `cement/internal-cement-price`, `cement/average-export-price` | `data-year-options="1Y,3Y,5Y"` |
| `bank/asset-structure`, `bank/income-structure`, `bank/capital-structure` | `data-year-options="1Y,3Y,5Y"` (quarterly, ~20/60/100 rows) |
| `bank/deposit-interest-rate` | `data-year-options="1Y,3Y,5Y"` (daily, ~1360/3148/3564 rows) |
| `bank/bank-credit-growth-by-ticket` | fixed `year=5Y` — không có nút |
| `electricity/output-resource-by-value` | **không có year param** — luôn trả full dataset (~29 rows/resourceId) |
| `electricity/electric-output-plant` | **không có year param** — luôn trả full 36 nhà máy |
| `pangasius/export-price-to-markets`, `pangasius/export-status` | `data-year-options="1Y,3Y,5Y"` |
| `shrimp/enterprise-export-status`, `shrimp/enterprise-export-price-to-markets` | `data-year-options="1Y,3Y,5Y"` |
| `macroItemId=9` (Giá NVL VN) | `data-year-options="1Y,3Y,5Y"` — chỉ hỗ trợ `valueType=qoq/yoy`, **không có `value`**; `period=quarter` |
| `macroItemId=10` (PPI VN) | `data-year-options="1Y,3Y,5Y"` — chỉ hỗ trợ `valueType=qoq/yoy`, **không có `value`**; `period=quarter` |
| `macroItemId=107` (CPI TQ) | `data-year-options="1Y,3Y,5Y"` — lag ~13 tháng (data đến 04/2025), `valueType=yoy`, `period=month` |
| `macroItemId=112` (PPI TQ) | `data-year-options="1Y,3Y,5Y"` — lag ~5 tháng (data đến 12/2025), `valueType=yoy`, `period=month` |
| `macroItemId=30` (Vận chuyển HH VN — số lượng) | `data-year-options="1Y,3Y,5Y"` — `period=month`, `valueType=value/yoy`, 88 rows/5Y |
| `sstock/company/stock-comparison` | **không có nút** — trả 1D/1W/1M/3M/6M/1Y/3Y cố định (không có 5Y); 1 call per ticker |

### Data staleness badges

| Nguồn | Vấn đề | Badge |
|---|---|---|
| WiChart `cao_su` | Stale ~15 tháng (2025-02-10) | ⚠ "Dữ liệu đến 02/2025" |
| WiChart `xi_mang` | Stale ~15 tháng (2025-02-04) | ⚠ "Dữ liệu đến 02/2025" |
| macroItemId=49 (VNIBOR) | 0 rows — fallback WiChart lslnh | ℹ "Nguồn: WiChart" |
| macroItemId=50 (OMO) | Dừng 31/12/2025 | ⚠ "Dữ liệu đến 12/2025" |
| macroItemId=53 (tỷ giá khác) | Dừng 31/12/2025 → fallback `steel/exchange-rate` | ℹ "Nguồn: Findicator realtime" |
| macroItemId=119 (China energy) | Lag ~17 tháng (data đến 12/2024) | ⚠ "Lag ~17 tháng" |
| macroItemId=107 (CPI TQ) | Lag ~13 tháng (data đến 04/2025). **Verify 2026-05-24** | ⚠ "Lag ~13 tháng" |
| macroItemId=112 (PPI TQ) | Lag ~5 tháng (data đến 12/2025). **Verify 2026-05-24** | ⚠ "Lag ~5 tháng" |
| macroItemId=35 nameId=322 (MR tanker) | **0 rows** — không có data. **Verify 2026-05-24** | ❌ Loại bỏ khỏi transport call |
| macroItemId=35 nameId=341 (VLCC tanker) | **0 rows** — không có data. **Verify 2026-05-24** | ❌ Loại bỏ khỏi transport call |

Cache schema cần field `"stale": true` + `"stale_reason": "..."` (xem §8).

---

## 5. Mapping dữ liệu từng ngành

---

### 5.1 Thép (`/sector/steel`)

**DN niêm yết**: HPG, HSG, NKG, TNA  
**Findicator sector prefix**: `steel`

#### Khối A — Giá đầu vào

| Chỉ số | Nguồn | API | nameId |
|---|---|---|---|
| Quặng sắt CME (USD/T) | Findicator macro | macroItemId=35 | 82 |
| Quặng sắt TQ (CNY/T) | Findicator macro | macroItemId=35 | 243 |
| Than cốc SGX (USD/T) | Findicator macro | macroItemId=35 | 153 |
| Than cốc TQ (CNY/T) | Findicator macro | macroItemId=35 | 158 |
| HRC CME (USD/T) | Findicator macro | macroItemId=35 | 86 |
| HRC TQ (CNY/T) | Findicator macro | macroItemId=35 | 161 |
| Thép phế LME (USD/T) | Findicator macro | macroItemId=35 | 61 |
| Tỷ giá USD/VND | Findicator macro | macroItemId=52 | nameId=1 |
| Tỷ giá CNY/VND | Findicator macro | macroItemId=53 | nameId=4 |
| Giá thép cuộn VN (backup) | WiChart | key=hanghoa, name=thep | — |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Thị phần 4 DN (HPG/HSG/NKG/TVDUC) monthly % | `steel/domestic-market-share?year=5Y` |
| **Thị phần per-DN** (drill-down từng DN) | `steel/enterprise-domestic-market-share?ticket=HPG&year=5Y` → 180 rows, name_id={18,20,21}, %. **Verify 2026-05-24** |
| Cơ cấu sản lượng per-DN (nội địa vs XK) | `steel/enterprise-quantity-structure?ticket=HPG` |
| Tồn kho thép nội địa (4 series) | `steel/domestic-market-data?seriesType=TIME_SERIES&type=inventory` |
| **Xuất khẩu thép monthly** (4 series, Nghìn tấn) | `steel/demand-export-status?seriesType=TIME_SERIES&year=5Y` → name_id={18,19,20,21}, 60 rows. **Verify 2026-05-24**: latest name_id=18→108.6T, 19→285.8T, 20→38.1T, 21→103.7T |
| NK thép VN theo tháng (Tr USD + Nghìn tấn) | `steel/overview/steel-data` → `steelOverviewImportValue` |
| SX thép thô global (top quốc gia) | `steel/overview/steel-data` → `steelManufacturingCountryData` |

#### Khối C — Giá bán

| Chỉ số | nameId | Unit |
|---|---|---|
| Thép thanh CB300-D10 VN | 10 | VNĐ/kg |
| Thép thanh CB400-D10 VN | 593 | VNĐ/kg |
| Thép cuộn CB240-D6 VN | 595 | VNĐ/kg |
| Thép cuộn CB240-D8 VN | 596 | VNĐ/kg |

Source: `steel/input-price?macroIds=47,49,159,167&vnMacroIds=11&year=5Y` → lọc nameId=10/593/595/596

#### Khối D — Spread tracker

```
Spread = Giá CB300 (VNĐ/T) − [Quặng sắt × 1.6 × USD_VND + Than cốc × 0.5 × USD_VND]
```
Vẽ dạng area chart theo tháng, so với biên gộp thực tế từ BCTC.

#### Khối E — Cổ phiếu

| Cột | API | accountId |
|---|---|---|
| Giá, Volume | `enterprise/stock-ohlc?symbol=HPG` | — |
| Vốn hóa (Tỷ VNĐ) | `finance-ticket-data?tableName=TRAILING` | 35 |
| PE trailing | `finance-ticket-data?tableName=TRAILING` | 39 |
| PB trailing | `finance-ticket-data?tableName=TRAILING` | 40 |
| Biên gộp % | `finance-ticket-data?tableName=TRAILING` | 2 |
| ROE | `finance-ticket-data?tableName=TRAILING` | 8 |
| Tăng trưởng DT YoY | `finance-ticket-data?tableName=TRAILING` | 163 |
| Analyst: Recommend/Upside/Target | `enterprise/report-analysis?ticket=HPG` | — |

#### Khối F — BCTC 8 quý

Table: `INCOME_STATEMENT`, corpType=4, tickers=["HPG","HSG","NKG"]  
accountIds: 24(DT), 28(LN gộp), 43(LNST), 2(biên gộp%)  
API: `finance_timeseries(["HPG","HSG","NKG"], n_quarters=8)`

---

### 5.2 Ngân hàng (`/sector/bank`)

**DN niêm yết**: VCB, BID, CTG, TCB, ACB, MBB, VPB, HDB, STB, LPB, MSB, VIB, OCB  
**Findicator sector prefix**: `bank`

#### Khối A — Giá đầu vào (cost of funds)

| Chỉ số | API |
|---|---|
| Lãi suất huy động daily (KKH → 36M) | macroItemId=48 (10 kỳ hạn) |
| Lãi suất FED | macroItemId=96, nameId=1 |
| Tỷ giá USD/VND | macroItemId=52, nameId=1 |
| DXY Index | `bank/dxy-index?year=5Y` |
| Lãi suất LNH (qua đêm/1W/2W) | **WiChart** key=tien_te, name=lslnh — 3 series daily, 497 pts (**PRIMARY** — macroItemId=49 xác nhận 0 rows) |
| Lợi suất TPCP VN 5Y/10Y | macroItemId=54, nameId=VN_5Y/VN_10Y |
| Lợi suất UST 2Y/10Y (macro reference) | macroItemId=54, nameId=US_2Y/US_10Y |
| OMO NHNN (phát hành/đáo hạn/bơm ròng) | macroItemId=50 (8 series) |
| Dự trữ ngoại hối VN (Triệu USD) | macroItemId=55 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Tăng trưởng tín dụng vs trần NHNN (28 NH) | `bank/bank-credit-growth?date=YYYY-MM-01` |
| CASA/NPL/CoF snapshot per-bank | `bank/overview/bank-data` |
| Tín dụng toàn hệ thống (Tỷ VNĐ YoY) | macroItemId=47 (month, value+yoy) |
| **Cung tiền M2 VN** (Tỷ VNĐ + YoY) | macroItemId=46, **nameId=1**, `period=month`, `valueType=yoy` — 60 rows/5Y, latest 01/2026 = +7.71% YoY. **Verify 2026-05-24** |
| Cán cân thanh toán (proxy FX pressure) | macroItemId=56, nameId=1 (vãng lai) / nameId=40 (tổng thể), quarterly, 20 rows. **Verify 2026-05-24**: Q4/2025 cán cân vãng lai = +7,654 triệu USD |

#### Khối C — Giá bán (NIM / Yield)

| Chỉ số | API | accountId |
|---|---|---|
| NIM per-bank | TRAILING corpType=1 | 60 |
| CASA ratio | TRAILING corpType=1 | 57 |
| CoF (cost of funds) | TRAILING corpType=1 | 58 |
| LDR | TRAILING corpType=1 | 75 |

#### Khối D — Spread tracker

```
NIM spread = NIM − CoF (theo quý, so sánh các NH)
```

#### Khối E — Cổ phiếu (corpType=1)

> **Xác nhận 2026-05-24**: TRAILING corpType=1 có 43 items, accountId khác hoàn toàn corpType=4.

| Cột | accountId TRAILING |
|---|---|
| PE | **89** |
| PB | **90** |
| NPL | 62 |
| CAR (TT 41/2016) | 73 |
| CAR tier 1 | 74 |
| ROE | **67** |
| ROA | **68** |
| NIM | 60 |
| CASA | 57 |
| COF (chi phí lãi) | 58 |
| YEA (tỷ suất tài sản sinh lãi) | 59 |
| SML (nợ nhóm 2) | 63 |
| LLCR (bao phủ nợ xấu) | 64 |
| LDR | 75 |
| LDR thuần | 72 |
| CIR (chi phí/thu nhập) | 159 |
| Vốn ngắn hạn cho vay TDH | 76 |
| CreRWA/TA | 77 |
| Vốn hóa (Tỷ đồng) | 85 |
| Tăng trưởng NII YoY | 168 |
| Tăng trưởng fee thuần YoY | 169 |
| Tăng trưởng TOI YoY | 170 |
| Tăng trưởng PPOP YoY | 171 |
| Tăng trưởng LNTT YoY | 172 |
| Tăng trưởng LNST YoY | 173 |

#### Khối F — BCTC 8 quý

Table: `INCOME_STATEMENT`, corpType=1  
accountIds: 1(NII), 46(Tổng TOI), 16(Dự phòng), 17(LNTT), 21(LNST)  
Tickers: VCB, BID, CTG, TCB, ACB, MBB

#### Thêm — Bank-specific charts

| Chart | API |
|---|---|
| Credit growth vs NHNN cap (bar race) | `bank/bank-credit-growth?date=` |
| Credit growth per-bank theo quý | `bank/bank-credit-growth-by-ticket?tickets=VCB&quarter=1&year=5Y` |
| Cấu trúc tài sản per-NH theo quý | `bank/asset-structure?tickets=VCB&year=5Y` |
| Cấu trúc thu nhập per-NH | `bank/income-structure?tickets=VCB&year=5Y` |
| Lãi suất huy động daily | `bank/deposit-interest-rate?tickets=VCB&year=5Y` |
| TPDN outstanding | `enterprise/bank-debt-by-bond-issuer` |
| Đường cong lợi suất TPCP VN (5/10Y) | macroItemId=54 → filter VN series |
| Cấu trúc vốn (nợ phải trả) per-NH theo quý | `bank/capital-structure?tickets=VCB&year=5Y` |
| Metadata kỳ + danh sách NH có data | `bank/bank-picture-overview-metadata` |
| **Nợ xấu nhóm 1 vs nhóm 2+ time series** | `enterprise/bank-bad-debt-ratio?ticket=VCB&period=quarter&year=5Y` → type 1 vs 2, per quý |
| **Phân kỳ hạn vay** (ngắn/trung/dài) | `enterprise/bank-loan-over-time?ticket=VCB&period=quarter&year=5Y` → type 1-2, per quý |
| **Phân loại dư nợ khách hàng** | `enterprise/bank-client-debt?ticket=VCB&period=quarter&year=5Y` → type 1-2, per quý |
| **Lãi suất huy động per-NH** (15 kỳ hạn) | `stock/vn-interest-value?macroIds={groupId}-{nameId}&year=5Y` — metadata từ `stock/vn-interest-metadata` |
| Cơ cấu thu nhập per-NH (lãi/phi lãi/DV/FX) | `enterprise/bank-revenue?ticket=VCB&period=quarter&year=5Y` → type 1-5 |
| Cơ cấu tài sản per-NH | `enterprise/bank-asset?ticket=VCB&period=quarter&year=5Y` → type 1-5 |
| TPDN outstanding per-NH | `enterprise/bank-debt-by-bond-issuer?ticket=VCB&period=quarter&year=5Y` → type 1-2 |
| **Cấu trúc nợ phải trả per-NH** (type 1-5) | `enterprise/bank-debt?ticket=VCB&period=quarter&year=5Y` → 100 rows, VND tuyệt đối. **Verify 2026-05-24**: type={1-5} |
| **Danh sách 30 NH đầy đủ** (dropdown selector) | `bank/bank-list` → list[30] {ticket, corp_name, floor, market_cap_tyvnd}. **Verify 2026-05-24** |
| **Dư nợ theo ngành kinh tế per-NH** (annual) | sstock `chart/bank/loan-structure-by-sector?mack=VCB&startYear=2026&endYear=2018&year=2025` → 18 rows, key=`data`, phân loại 18 ngành KT (CN chế biến/BĐS/Bán lẻ/Nông lâm/...). **Verify 2026-05-24** |
| **Dư nợ theo loại khách hàng per-NH** (annual) | sstock `chart/bank/loan-structure-by-type?mack=VCB&startYear=2026&endYear=2018&year=2025` → 13 rows, key=`presentationInfo`, phân loại DNNN/CTCP/DN FDI/Cá nhân. **Verify 2026-05-24** |
| **Phân loại nợ theo chất lượng** (nợ đủ tiêu chuẩn + nhóm 1-5) | sstock `chart/bank/loan-structure-by-quality?mack=VCB&startYear=2026&endYear=2020&quarter=0` → 42 rows, key=**`balanceSheetInfo`** (KHÔNG phải `data`). Row 27=Tổng dư nợ, row 28=Nợ đủ tiêu chuẩn. **Verify 2026-05-24** |
| **LNST per quý per-NH time-series** | `enterprise/bank-profit-after-tax?ticket=VCB&period=quarter&year=5Y` → 20 rows, type=1, VND tuyệt đối. **Verify 2026-05-24**: VCB Q1/2026 = 9.46 nghìn tỷ |

---

### 5.3 Xi măng (`/sector/cement`)

**DN niêm yết**: HT1, BCC, BTS, SCJ  
**Findicator sector prefix**: `cement`

#### Khối A — Giá đầu vào

| Chỉ số | API |
|---|---|
| Giá than đá (nameId=54, USD/Tấn) | `cement/coal-price?year=5Y` |
| Giá than ICE backup | macroItemId=35, nameId=68 |
| Giá điện (chính sách — tĩnh) | manual input |
| Giá dầu Brent (logistics) | macroItemId=35, nameId=65 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| IIP xi măng YoY | `cement/values-year-over-year?macroIds=29` |
| Sản lượng clinker + XK | `cement/clanhke-value?macroIds=15&period=month_value` |
| XK xi măng trung bình (USD/T) | `cement/average-export-price?year=5Y` |
| Tiêu thụ clinker YoY | `cement/clanhke-year-over-year?macroIds=15` |
| **Chỉ số tiêu thụ công nghiệp** (signal demand xi măng) | macroItemId=12 (quarter, value/yoy) |
| **Chỉ số tồn kho công nghiệp** (signal dư cung) | macroItemId=13 (quarter, value/yoy) |
| Vốn đầu tư NSNN (giải ngân đầu tư công → tiêu thụ XM) | macroItemId=20 (month, value/yoy) |

**Gap**: Findicator không có per-DN market share cement → dùng BCTC comparison làm proxy.

#### Khối C — Giá bán

| Chỉ số | API |
|---|---|
| Giá xi măng Hà Tiên PCB40 (VNĐ/kg) | `cement/internal-cement-price?year=5Y` (nameId=57) |
| Giá XK xi măng (USD/T) | `cement/average-export-price` |

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["HT1","BCC","BTS"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)

---

### 5.4 Cá tra (`/sector/pangasius`)

**DN niêm yết**: VHC, ANV, IDI, ACL, ABT  
**Findicator sector prefix**: `pangasius`

#### Khối A — Giá đầu vào

| Chỉ số | API |
|---|---|
| Giá cá tra nguyên liệu VN (VNĐ/kg) | macroItemId=35, nameId=3 |
| Giá cá tra giống | macroItemId=35, nameId=2 |
| Giá thức ăn chăn nuôi: Ngô CBOT | macroItemId=35, nameId=108 |
| Giá Đậu nành CBOT | macroItemId=35, nameId=87 |
| Tỷ giá USD/VND | macroItemId=52 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| XK cá tra toàn ngành YoY | `pangasius/export-year-over-year` |
| XK theo thị trường (4 nước) | `pangasius/export-quantity-to-markets?year=5Y` |
| Turnover + Quantity per-DN monthly | `pangasius/export-status?ticket=VHC` |
| **Bán lẻ thực phẩm Mỹ** (proxy demand cá tra) | macroItemId=84, **nameId=14** (Thực phẩm & đồ uống, Tr USD, monthly) |
| **Bán lẻ tổng Mỹ** (proxy sức mua) | macroItemId=84, **nameId=1** (Tổng, 752K Tr USD) |

#### Khối C — Giá bán / ASP

| Chỉ số | API |
|---|---|
| ASP per-DN × 4 thị trường (USD/kg) | `pangasius/export-price-to-markets?ticket=ANV` |
| Breakout thị trường per-DN | `pangasius/export-status-to-markets?ticket=ANV` |

**4 thị trường**: Mỹ, TQ, EU, ASEAN

#### Khối D — Spread tracker

```
Spread = ASP xuất khẩu (USD/kg × tỷ giá) − giá cá tra nguyên liệu (VNĐ/kg)
```

---

### 5.5 Tôm (`/sector/shrimp`)

**DN niêm yết**: MPC, FMC, CMX  
**Findicator sector prefix**: `shrimp`

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Tôm thẻ VN 50 con/kg (VNĐ/kg) | macroItemId=35 | 23 |
| Tôm thẻ VN 30 con/kg | macroItemId=35 | 22 |
| Tôm sú VN (tham khảo) | macroItemId=35 | 21 |
| Ngô CBOT (thức ăn) | macroItemId=35 | 108 |
| Đậu nành CBOT | macroItemId=35 | 87 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Tổng quan ngành (Ecuador/Asia/VN volume) | `shrimp/overview/shrimp-data` |
| **Bán lẻ thực phẩm Mỹ** (proxy demand tôm) | macroItemId=84, **nameId=14** (Thực phẩm & đồ uống, monthly) |
| Giá XK thế giới (tôm thẻ nameId=28) | `shrimp/global-market-export-price?macroId=28&year=5Y` |
| Giá XK thẻ YoY per quốc gia | `shrimp/global-market-export-price-year-over-year` |
| Top quốc gia XK tôm | `shrimp/global-market-export-price-by-product` |

#### Khối C — Giá bán / ASP per-DN

| Chỉ số | API |
|---|---|
| ASP tôm thẻ per-DN × 4 thị trường | `shrimp/enterprise-export-price-to-markets?ticket=MPC&macroIds=28` |
| ASP tôm sú per-DN | `shrimp/enterprise-export-price-to-markets?ticket=MPC&macroIds=29` |
| Turnover + Quantity monthly per-DN | `shrimp/enterprise-export-status?ticket=MPC&macroIds=28&period=month_value` |

---

### 5.6 Hàng không (`/sector/aviation`)

**DN niêm yết**: HVN, VJC, BAV  
**Findicator sector prefix**: `aviation`

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Giá Dầu Brent (USD/Bbl) | macroItemId=35 | 65 |
| Giá Dầu hỏa vùng 1 VN (VNĐ/Lít) — proxy JetA-1 nội địa | macroItemId=35 | **623** |
| Giá Dầu hỏa vùng 2 VN (VNĐ/Lít) | macroItemId=35 | **627** |
| NK xăng dầu các loại (Tr USD, monthly) — proxy chi phí nhiên liệu ngành | sstock `chart/general-data-series?dataSeriesNames=Nhập khẩu theo mặt hàng - Xăng dầu các loại - Tổng nhập khẩu các quốc gia` | — |
| Tỷ giá USD/VND | macroItemId=52 | 1 |
| Lãi suất vay (chi phí tài chính thuê máy bay) | macroItemId=96 | 1 (FED rate) |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Số chuyến bay monthly per-hãng (VJC/HVN/BAV) | `aviation/flight-company-data?period=month_value&tickets=VJC&year=5Y` |
| Khách quốc tế đến VN monthly | `aviation/visitor-come-to-vn?macroIds=&repo=MacroVnInternational&period=month_value&year=5Y` |
| Khách QT đến VN YoY per quốc gia | `aviation/values-year-over-year?macroIds=&repo=MacroVnInternational&period=month_yoy&year=3Y` |
| Vận chuyển HK (triệu lượt, macro VN) | macroItemId=29 (month/quarter/year, value/yoy) |
| Luân chuyển hành khách (tỷ HK.km) | macroItemId=31 (month, value/yoy — 3 phương thức: đường bộ/biển/HK) |
| Khách quốc tế VN (35 nước + 3 phương tiện) | macroItemId=61 (month/quarter/year, value/yoy) |
| Danh sách 17 sân bay (dim) | `aviation/dim-airports` → `{id, name, airportCode, nameLegend, sortIndex}` |

#### Khối C — Giá bán

Không có per-DN ASP từ Findicator → dùng DT per-DN từ BCTC (accountId=24) / số chuyến bay làm proxy yield.

#### Khối D — Spread tracker

```
Proxy margin = DT thuần / chuyến bay − (Brent × hệ số tiêu thụ nhiên liệu × tỷ giá)
```

---

### 5.7 Cao su (`/sector/rubber`)

**DN niêm yết**: DPR, PHR, TRC  
**Findicator sector prefix**: `rubber`

#### Khối A — Giá đầu vào

Cao su là ngành khai thác → đầu vào là chi phí trồng (tĩnh), không có giá NVL dynamic.  
Thay thế: theo dõi giá xăng dầu (logistics + thu hoạch).

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Diện tích trồng cao su VN + top quốc gia | `rubber/overview/rubber-data` → `rubberFarming` |
| Cơ cấu ứng dụng (lốp xe 65%...) | `rubber/overview/rubber-data` → `rubberApplication` |
| SX cao su VN theo năm | `rubber/overview/rubber-data` → `rubberOverall` |
| XK cao su VN YoY | `rubber/values-year-over-year?macroIds=...&repo=macro_vn_exim_excomdty` |

#### Khối C — Giá bán cao su

| Chỉ số | API | nameId |
|---|---|---|
| Cao su JPX (JPY/Kg) | `rubber/values?repo=macro_comdty&macroIds=51&period=date_value` | 51 |
| Cao su Singapore TSR20 (USD Cents/Kg) | `rubber/values?repo=macro_comdty&macroIds=93&period=date_value` | 93 |

---

### 5.8 Chăn nuôi heo (`/sector/pig`)

**DN niêm yết**: DBC, BAF, MML  
**Findicator sector prefix**: `pig`

#### Khối A — Giá đầu vào (thức ăn chăn nuôi)

| Chỉ số | API | nameId |
|---|---|---|
| Ngô CBOT (USd/Bu) | macroItemId=35 | 108 |
| Đậu nành CBOT | macroItemId=35 | 87 |
| Bã đậu nành TQ | macroItemId=35 | 160 |
| Lúa mỳ CBOT | macroItemId=35 | 88 |
| Giá heo giống VN (VNĐ/kg) | `pig/macro-comdty-vn?macroIds=63&period=date_value` | 63 |
| Giá vốn nuôi VN (VNĐ/kg) | `pig/macro-comdty-vn?macroIds=8&period=date_value` | 8 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Tăng trưởng đàn VN + số heo nái | `pig/pig_farming_global?macroIds=1,3&period=month_value&year=1Y` |
| NK thịt heo VN | `pig/legend` → `macroGlobalDimImportComdty` |

#### Khối C — Giá bán

| Chỉ số | API | nameId |
|---|---|---|
| Giá heo hơi VN (3 miền avg) | `pig/macro-comdty-vn?macroIds=9&period=date_value` | 9 |
| Giá heo TQ (CNY/kg) | `pig/macro-comdty?macroIds=260&period=date_value` | 260 |
| Giá heo hơi VN (backup WiChart) | WiChart key=hanghoa, name=heo_hoi | — |

#### Khối D — Spread tracker

```
Margin = Giá heo hơi VN (VNĐ/kg) − Giá vốn nuôi (VNĐ/kg)
Tỷ lệ thức ăn = Ngô CBOT × USD_VND × hệ số FCR
```

**Gap**: Không có per-DN data (DBC/BAF/MML) từ Findicator → hoàn toàn dựa BCTC.

---

### 5.9 Phân bón / Hóa chất (`/sector/chemistry`)

**DN niêm yết**: DPM, DCM, LAS, BFC, DDV, CSV  
**Findicator sector prefix**: `chemistry`

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Khí TN Henry Hub (USD/MMBtu) | macroItemId=35 | 66 |
| Than đá ICE (USD/T) | macroItemId=35 | 68 |
| Lưu Huỳnh TQ | macroItemId=35 | 182 |
| Axit Sulfuric TQ | macroItemId=35 | 253 |
| Phốt pho vàng TQ | macroItemId=35 | 213 |
| **Xút (NaOH) TQ Spot** (CNY/T) — đầu vào Chlor-Alkali (CSV, DDV) | sstock `chart/general-data-series?dataSeriesNames=Hàng hóa thế giới - Xút (NaOH) Trung Quốc (Spot)` → 1716 rows daily, latest 2026-05-22 = 620 CNY/T. **Verify 2026-05-24** | — |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Cơ cấu CP SX phân bón (Urea gas/coal, DAP/MAP) | `chemistry/overview/fertilizer-data` |
| Cơ cấu CP xút (caustic soda) | `chemistry/overview/caustic-soda-data` |
| Cơ cấu CP DAP/MAP | `chemistry/overview/phosphorus-data` |
| Giá phân bón VN theo tháng | `chemistry/fertilizer-product-price?period=month_value` |

#### Khối C — Giá bán phân bón

| Chỉ số | API | nameId |
|---|---|---|
| Urea CME (USD/T) | macroItemId=35 | 50 |
| Urea TQ (USD/T) | macroItemId=35 | 190 |
| Urea Phú Mỹ (VNĐ/T) | macroItemId=35 | 12 |
| Urea Cà Mau (VNĐ/T) | macroItemId=35 | 13 |
| DAP TQ (USD/T) | macroItemId=35 | 156 |
| DAP Đình Vũ (VNĐ/T) | macroItemId=35 | 29 |
| Kali Phú Mỹ (VNĐ/T) | macroItemId=35 | 30 |
| Backup WiChart | key=hanghoa, name=phan_ure | — |

#### Khối D — Spread

```
Urea spread = Giá Urea Phú Mỹ − Chi phí khí (Henry Hub × hệ số tiêu thụ × USD_VND)
```

---

### 5.10 Dệt may (`/sector/textile`)

**DN niêm yết**: TCM, TNG, MSH, VGT, STK, ADS  
**Findicator sector prefix**: `textile`

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Bông CBOT (USd/Lbs) | macroItemId=35 | 98 |
| Xơ bông TQ (CNY/T) | macroItemId=35 | 168 |
| Sợi cotton TQ | macroItemId=35 | 185 |
| Sợi Polyester DTY TQ | macroItemId=35 | 163 |
| Sợi Polyester POY TQ | macroItemId=35 | 186 |
| Tỷ giá USD/VND | macroItemId=52 | 1 |

#### Khối B — Thị trường ngành

| Chỉ số | API | Repo |
|---|---|---|
| XK dệt may VN monthly + YoY (Tr USD) | macroItemId=25 | `textile/values-by-macro-ids?repo=MacroVnEximExcomdty` |
| XK dệt may theo thị trường (Mỹ/EU/TQ) | `textile/textileExportCountry` ✅ | — |
| Tổng quan XK ngành (overall/application/country) | `textile/overview/textile-data` ✅ | — |
| NK vải/sợi nguyên liệu | macroItemId=26 | `textile/values-by-macro-ids?repo=MacroVnEximImcomdty` |
| FDI vào dệt may | macroItemId=15 | — |
| **Chỉ số lao động ngành dệt** | `textile/values-by-macro-ids` | `repo=MacroVnLabourIndex` |
| **IIP ngành dệt may VN** | `textile/values-by-macro-ids` | `repo=MacroVnPrdIip` |
| **XK dệt may Bangladesh (đối thủ chính)** | `textile/values-by-macro-ids` | `repo=MacroGlobalBangladeshExportComdty` |
| **XK dệt may Trung Quốc** | `textile/values-by-macro-ids` | `repo=MacroGlobalChinaExportComdty` |
| **XK dệt may Ấn Độ** | `textile/values-by-macro-ids` | `repo=MacroGlobalIndiaExportComdty` |
| **XK dệt may Thổ Nhĩ Kỳ (thị trường EU)** | `textile/values-by-macro-ids` | `repo=MacroGlobalTurkeyExportComdty` |
| **PMI SX EU/US/Nhật** (demand signal đơn hàng) | `overview/overview-data?tabId=4` | nameId: 36=DE, 44=US, 40=JP, 49=Euro — PMI<50 → đơn hàng giảm |
| **Bán lẻ quần áo Mỹ** (proxy demand XK dệt may) | macroItemId=84, **nameId=20** (Quần áo & phụ kiện, Tr USD, monthly) | Tương quan cao với đơn hàng TCM/TNG/MSH/VGT vào thị trường Mỹ |

> Tất cả `textile/values-by-macro-ids` dùng params: `macroIds` (CSV), `year=1Y/3Y/5Y`, `period=month_value|month_yoy`.

**Gap**: Không có per-DN data → dựa BCTC. So sánh XK Bangladesh/India/Turkey/China giúp đánh giá khả năng cạnh tranh của TCM/TNG/MSH/VGT.

---

### 5.11 Khu công nghiệp (`/sector/industry`)

**DN niêm yết**: BCM, IDC, KBC, LHG, SZC, VGC, NTC, D2D  
**Findicator sector prefix**: `industry`

#### Khối A — Giá đầu vào (vận hành KCN)

| Chỉ số | API |
|---|---|
| Giá điện (chi phí hoạt động KCN) | manual/chính sách |
| PMI sản xuất VN | `industry/prd-pmi?year=5Y` |
| IIP VN | `industry/prd-iip?year=5Y` |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| FDI vào ngành theo tỉnh (flow) | `industry/fdi-sector-by-province` |
| FDI đăng ký + thực hiện (tháng/năm) | `industry/fdi-status?filter_type=MONTH&year=1Y` |
| FDI per tỉnh | `industry/fdi-province?year=5Y&provine_id=1` |
| Giá đất KCN + occupancy theo vùng | `industry/region-land` |
| Giá thuê nhà máy (built-to-lease) per tỉnh | `industry/province-factory` |
| **Vốn đầu tư NSNN** (giải ngân CSHT → kích FDI) | macroItemId=20 (month, value/yoy) |
| **Vốn đầu tư xã hội** (tổng đầu tư toàn nền kinh tế) | macroItemId=21 (quarter, value/yoy) |
| FDI thực hiện (tháng, Tr USD) | macroItemId=18 (month, value/yoy) |
| PMI TQ SX (tín hiệu dịch chuyển chuỗi cung ứng) | macroItemId=115, nameId=8 (month) |
| PMI SX global (20+ quốc gia) | `overview/overview-data?tabId=4&repo=overview_global` → 371 rows. nameId: 34=CN, 36=DE, 37=IN, 44=US, 45=VN, 49=Euro — dùng CN/IN/US để đánh giá dịch chuyển chuỗi cung ứng FDI |

#### Khối C — Giá bán / Thu nhập

| Chỉ số | API |
|---|---|
| Phê duyệt dự án KCN per-DN (BCM) | `industry/company-approval` |
| Vị trí KCN per-DN (lat/lng/diện tích) | `industry/company-land?ticket=KBC` |
| Danh sách DN KCN + market cap | `industry/filter-company?limit=20` |

---

### 5.12 Bất động sản (`/sector/realestate`)

**DN niêm yết**: VHM, NVL, PDR, DXG, KDH, DIG, NLG  
**Findicator sector prefix**: `real-estate`

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Chính sách pháp lý BĐS (luật có hiệu lực) | `real-estate/laws` → dict{year:[{url,name,date}]} từ 2006-2026 |
| **Lãi suất huy động** (proxy cầu mua nhà) | macroItemId=48: **nameId=6**=12M, **nameId=9**=24M, **nameId=10**=36M (⚠ data 36M chỉ đến 08/2024) |
| **Vốn đầu tư NSNN** (đầu tư công → catalyst BĐS) | macroItemId=20 (month, value/yoy) |
| **Vốn đầu tư xã hội** | macroItemId=21 (quarter, value/yoy) |
| BĐS TQ: Đầu tư phát triển/xây dựng YoY | macroItemId=121 |
| BĐS TQ: Diện tích sàn (YoY) | macroItemId=122 |
| BĐS TQ: Doanh thu bán BĐS (YoY) | macroItemId=123 |
| BĐS TQ: Đầu tư TS cố định YoY | macroItemId=125 |

**Note**: `real-estate/supply-demand` không tồn tại trên Findicator — dùng BCTC DT per-DN làm proxy cung và lãi suất làm proxy cầu.

#### Khối C — Giá

| Chỉ số | API |
|---|---|
| Định giá per-DN | `real-estate/core-index-valuation?tickets=VHM` |
| Danh sách dự án per-DN | `real-estate/company-project?tickets=VHM` |

#### BCTC

TRAILING corpType=4, tickers=["VHM","NVL","PDR","DXG","KDH"]

---

### 5.13 Vận tải biển (`/sector/transport`)

**DN niêm yết**: GMD, HAH, PVT, VSC, VOS, MVN  
**Findicator sector prefix**: `transport`

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Dầu Brent (USD/Bbl) | macroItemId=35 | 65 |
| Dầu WTI | macroItemId=35 | 67 |

#### Khối B — Thị trường ngành (Freight Index)

| Chỉ số | API | nameId |
|---|---|---|
| BDI (Baltic Dry Index) | macroItemId=35 | 681 |
| BDTI (dầu thô) | macroItemId=35 | 679 |
| BCTI (dầu sản phẩm) | macroItemId=35 | 680 |
| WCI (container tổng hợp) | macroItemId=35 | 688 |
| Supramax charter rate | macroItemId=35 | 308 |
| Capesize charter rate | macroItemId=35 | 309 |
| Panamax charter rate | macroItemId=35 | 310 |
| Handysize charter rate | macroItemId=35 | 311 |
| ~~MR tanker~~ | ~~macroItemId=35~~ | ~~322~~ — **0 rows, verify 2026-05-24. Loại bỏ** |
| ~~VLCC tanker~~ | ~~macroItemId=35~~ | ~~341~~ — **0 rows, verify 2026-05-24. Loại bỏ** |
| Aframax tanker (USD/ngày) | macroItemId=35 | **339** ✅ 254 rows/5Y, latest 2026-05-20, ~$28,500/ngày. Liên quan PVT đội Aframax |
| Suezmax tanker (USD/ngày) | macroItemId=35 | **340** ✅ 256 rows/5Y, latest 2026-05-20, ~$37,500/ngày |
| Container Shanghai→Rotterdam (EU) | macroItemId=35 | 689 |
| Container Shanghai→Genoa | macroItemId=35 | 690 |
| Container Shanghai→LA | macroItemId=35 | 691 |
| Container Shanghai→NY | macroItemId=35 | 692 |
| Container Rotterdam→Shanghai | macroItemId=35 | 693 |
| Container LA→Shanghai | macroItemId=35 | 694 |
| Container NY→Rotterdam | macroItemId=35 | 695 |
| Container Rotterdam→NY | macroItemId=35 | 696 |
| **Gas tanker VLGC (LPG)** | macroItemId=35 | 312 |
| **Gas tanker LGC** | macroItemId=35 | 313 |
| **Gas tanker MGC** | macroItemId=35 | 314 |
| **Gas tanker HDY SR** | macroItemId=35 | 315 |
| **Gas tanker ETH** | macroItemId=35 | 316 |
| **Gas tanker SR** | macroItemId=35 | 317 |
| **Gas tanker COASTER Asia** | macroItemId=35 | 318 |
| **Gas tanker COASTER Europe** | macroItemId=35 | 319 |

Gọi qua: `transport/values?macroIds=679,680,681,688,308,309,310,311,339,340,689,690,691,692,693,694,695,696,312,313,314,315,316,317,318,319&year=5Y`

> **Lưu ý**: nameId=322 (MR tanker) và nameId=341 (VLCC) xác nhận 0 rows (verify 2026-05-24) — đã loại bỏ khỏi API call. nameId=339 (Aframax) và 340 (Suezmax) **xác nhận có data** (verify 2026-05-24): ~254-256 rows/5Y, cập nhật 2026-05-20.

> **Gas tanker rates (312-319)**: USD/tháng, liên quan đến GAS/PVT vận chuyển LPG. **Verify 2026-05-24**: 312=6,000,000 / 313=3,850,000 / 314=1,850,000 / 315=980,000 / 316=1,100,000 / 317=630,000 / 318=550,000 / 319=280,000 (USD/tháng).

#### Khối C — Giá bán

Không có per-route per-DN → dùng freight index làm proxy revenue, BCTC per-DN cho DT thực tế.

**Gap**: Không có per-DN data từ Findicator → hoàn toàn dựa BCTC + proxy freight.

#### Bổ sung — Vĩ mô vận tải

| Chỉ số | API |
|---|---|
| Luân chuyển hàng hoá VN (3 phương thức) | macroItemId=32 (month, value/yoy) |
| Giá vận tải kho bãi VN | macroItemId=33 (quarter, value/yoy) |
| XNK Mỹ (proxy volume cảng) | macroItemId=87 (month, value/yoy) |
| XNK TQ (proxy volume tàu hàng rời/container) | macroItemId=127 (month, value/yoy) |
| Bán lẻ TQ (proxy demand container Á→Âu) | macroItemId=126 (month, value/yoy) |
| Bán lẻ Mỹ (proxy volume cảng LA/NY routes) | macroItemId=84 (month, value) |
| XK VN tổng (proxy throughput cảng VN) | macroItemId=25 (month, value/yoy) |
| PMI TQ đơn hàng XK (leading indicator freight) | macroItemId=115, nameId=9 (month) |
| **PMI SX US/EU/JP global** (demand container routes) | `overview/overview-data?tabId=4` → nameId: 44=US, 49=Euro, 40=Japan |

---

### 5.14 Chứng khoán (`/sector/securities`)

**DN niêm yết**: SSI, VND, HCM, MBS, VCI, BSI, FTS  
**Findicator sector prefix**: `stock`

#### Khối A — Giá đầu vào (cost)

| Chỉ số | API |
|---|---|
| Lãi suất vay margin (proxy VNIBOR) | macroItemId=48 |
| Thanh khoản TTCK (Tỷ VNĐ/phiên) | macroItemId=134 |
| VNINDEX level | macroItemId=134, nameId=3 |
| VN30 level | macroItemId=134, nameId=2 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Thị phần môi giới tất cả CTCK (35 DN) | `stock/brokerage-market-share-companies` |
| Dư nợ margin toàn thị trường | TRAILING corpType=3, accountId=108 |
| Breadth TTCK (%CP>SMA200) | macroItemId=134, nameId=19 |
| PE/PB TTCK VN | macroItemId=134, nameId=22,24 |

#### Khối C — Giá bán (doanh thu per-DN)

| Chỉ số | API |
|---|---|
| Cơ cấu DT per-CTCK: môi giới/tự doanh/TPDN | `stock/enterprise-stock-revenue?ticket=SSI&year=5Y` |
| Cơ cấu LN gộp | `stock/gross-profit-structure?tickets=SSI` |
| **Cơ cấu tài sản per-CTCK** | `stock/enterprise-stock-asset?ticket=SSI&year=5Y` |
| **Cơ cấu nguồn vốn per-CTCK** | `stock/enterprise-stock-debt?ticket=SSI&year=5Y` |
| **Dòng tiền ròng TTCK** (âm/dương, 2 nameId) | `stock/money-flow?nameId=1\|2&period=month_value&year=1Y` → list[13] `{name_id, month, start_date, value}` |
| **Thị phần môi giới quarterly time-series** per-CTCK | sstock `chart/general-data-series?dataSeriesNames=Thị phần giao dịch - SSI` → quarterly, 25 pts (2020-Q1→2026-Q1), unit=%, field=`dataSeriesValuesInfo`. Hỗ trợ tất cả top-10 CTCK (SSI/VPS/TCBS/VCI/HCM/MBS/VND/MAS/KIS/FTS). **Verify 2026-05-24**: VPS=15.32%, SSI=11.14%, TCBS=8.85% Q1/2026 |

#### Cổ phiếu (corpType=3 TRAILING)

| accountId | Chỉ số |
|---|---|
| 99 | Biên LN gộp |
| 104 | ROE |
| 105 | ROA |
| 107 | Thị phần môi giới HOSE |
| 160 | Thị phần môi giới HNX |
| 161 | Thị phần môi giới UPCOM |
| 108 | Dư nợ margin |
| 109 | Margin/Vốn CSH |

---

### 5.15 Thực phẩm & Đồ uống (`/sector/food-beverage`)

**DN niêm yết**: VNM, SAB, BHN, MCM, QNS, KDC  
**Findicator sector prefix**: `food-and-beverage`

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Giá đường RS An Khê | macroItemId=35 | 685 |
| Giá đường ICE | macroItemId=35 | 97 |
| Giá lúa mỳ CBOT | macroItemId=35 | 88 |
| Giá ngô CBOT | macroItemId=35 | 108 |
| Giá đậu nành | macroItemId=35 | 87 |
| Giá dầu cọ Malaysia | macroItemId=35 | 90 |
| Giá đường TQ | macroItemId=35 | 220 |
| Backup WiChart đường | key=hanghoa, name=duong | — |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Tiêu thụ bia theo sản phẩm/kênh (SAB/BHN/HABECO) | `food-and-beverage/overview/beer-data` ✅ verified |
| Thị phần sữa (Vinamilk 40% — static 2022) | `food-and-beverage/overview/milk-data` ✅ verified |
| Giá hàng hoá F&B VN (đường/gạo) | `food-and-beverage/values?repo=macro_comdty_vn` ✅ verified |
| Bán lẻ VN (proxy tiêu dùng nội địa) | macroItemId=23 |

**Gap**: Không có per-DN time-series từ Findicator → hoàn toàn dựa BCTC.

---

### 5.16 Điện (`/sector/electricity`)

**DN niêm yết (xác nhận từ HAR findicator.vn5)**: POW, NT2, PC1, REE, HND, GEG, QTP, HDG, ASM  
**DN bổ sung có data trong sector**: TBC, CHP, TMP, VSH (trong `lake-name` và `electric-output-plant`)  
**Findicator sector prefix**: `electricity`

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId/note |
|---|---|---|
| Giá than đá ICE (USD/T) | macroItemId=35 | 68 |
| Giá than đá TQ (CNY/T) | macroItemId=35 | 196 |
| Giá khí TN Henry Hub | macroItemId=35 | 66 |
| Dầu Brent | macroItemId=35 | 65 |
| Giá đầu vào 12 tháng gần nhất | `electricity/input-price-trend?nameId={id}` | Gọi per nameId (bảng dưới) |
| Giá đầu vào mới nhất | `electricity/latest-input-price?nameId={id}` | Gọi per nameId (bảng dưới) |

**Bảng nameId cho input-price-trend / latest-input-price**:

| nameId | Chỉ số | Unit |
|---|---|---|
| 1 | Giá than nhập khẩu | VNĐ/kg (~12-15k) |
| 2 | Dầu FO (fuel oil) | VNĐ/lít (~25-29k) |
| 3 | Dầu DO / Than VN nội địa | VNĐ/lít (~26-32k) |
| 4 | Khí TN pool SE | USD/MMBTU |
| 5 | Khí TN Nam Côn Sơn | USD/MMBTU |
| 6 | Khí TN Cửu Long | USD/MMBTU |
| 7 | Khí TN pool khác | USD/MMBTU |
| 15 | Than quốc tế NK | USD/tấn |
| 16 | Giá than Richard Bay | USD/GJ (~8.5) |
| 17 | Giá bán điện bình quân | VNĐ/kWh |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Sản lượng 36 nhà máy điện monthly | `electricity/electric-output-plant` ✅ verified |
| Sản lượng per loại nguồn (Tỷ kWh tuyệt đối) | `electricity/output-resource-by-value?resourceId={id}` ✅ — gọi per resourceId: **1=Thủy, 2=Than, 3=Khí, 5=Gió, 6=Mặt trời, 7=NK&Khác, 8=Tổng** |
| Tỷ lệ % cơ cấu nguồn (stacked 100%) | `electricity/output-resource-by-proportion?year=5Y|10Y|All` ✅ verified |
| Cơ cấu nguồn điện % (Than/Thủy/Khí/Gió/Mặt trời/NK) | `electricity/electric-description-structure` ✅ verified |
| Sản lượng per-DN by year (HND/NT2/CHP/VSH/**GEG/HDG/PC1/ASM/REE/TBC/TMP**) | `electricity/electric_description_manufacturing?ticket=HND` ✅ verified — gọi per ticker |
| Mực nước hồ thủy điện per hồ | `electricity/lake-level?lakeId={id}` ✅ — gọi per lakeId (5,10,12,24,28,30,45...) |
| Danh sách hồ: id/tên/tỉnh/ticker | `electricity/lake-name` ✅ — lấy danh sách lakeId trước |
| Dự báo ENSO per tháng | `electricity/enso-forecast?date=YYYY-MM-DD` ✅ verified |
| Dự báo ENSO ngày gần nhất | `electricity/enso-nearest-date` ✅ verified |
| Lịch sử chỉ số ENSO (1Y/3Y/5Y) | `electricity/enso-history` ✅ verified |
| IIP điện VN (YoY) | macroItemId=7, **nameId=25** ✅ (verify 2026-05-24: 12 rows, dimTable=macro_vn_dim_prd_iip) |
| Sản lượng điện TQ | macroItemId=119, nameId=15 |

#### Khối C — Giá bán (giá điện)

| Chỉ số | API/Source |
|---|---|
| Giá bán điện bình quân monthly | `electricity/output-price` ✅ verified |
| Giá FiT điện tái tạo (solar/wind) | `electricity/policy-renewable` ✅ verified (tĩnh chính sách) |
| Quy hoạch công suất by loại nguồn | `electricity/policy-resource` ✅ verified |
| DT per-DN từ BCTC | INCOME_STATEMENT accountId=24 |

#### Thêm — Điện tái tạo & thủy văn

| Chỉ số | API |
|---|---|
| Công suất ĐMTMB (điện mặt trời mái nhà) by year | `electricity/electric_description_solar` ✅ verified |
| Tên 7 loại nguồn điện (legend) | `electricity/output-resource-name` ✅ verified |

**Lưu ý ENSO**: El Niño → khô hạn → thủy điện giảm công suất → than tăng → NVL đầu vào tăng. Phải hiển thị ENSO cùng mực nước hồ để phân tích.

---

---

### 5.17 Nhựa tổng hợp (`/sector/plastics`)

**DN niêm yết**: AAA, NTP, BMP, DNP, RDP  
**Findicator sector prefix**: không có sector dashboard — dùng COMDTY + BCTC  
**COMDTY shortcut**: `SECTOR_COMDTY['nhua'] = ['pet_tq','pp_tq','pvc_tq','wti','khi_tn_hh']`

#### Khối A — Giá đầu vào (nguyên liệu nhựa TQ)

| Chỉ số | API | nameId |
|---|---|---|
| PET TQ (CNY/T) | macroItemId=35 | 170 |
| PP TQ (CNY/T) | macroItemId=35 | 183 |
| PVC TQ (CNY/T) | macroItemId=35 | 231 |
| LDPE TQ (CNY/T) | macroItemId=35 | 203 |
| HDPE TQ (CNY/T) | macroItemId=35 | 204 |
| LLDPE TQ (CNY/T) | macroItemId=35 | 232 |
| Dầu WTI (feedstock naphtha) | macroItemId=35 | 67 |
| Khí TN Henry Hub (feedstock ethane) | macroItemId=35 | 66 |
| Tỷ giá CNY/VND | `steel/exchange-rate` → `cnyExchangeRate` | — |
| Tỷ giá USD/VND | macroItemId=52 | 1 |

> **Lưu ý CNY/VND**: macroItemId=53 chỉ có data đến 31/12/2025. Dùng `steel/exchange-rate` làm fallback real-time.

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| NK nguyên liệu nhựa VN (Tr USD) | macroItemId=26, nameId=22 (chất dẻo nguyên liệu) + nameId=23 (SP từ chất dẻo) |
| NK nhựa YoY | `overview/overview-data?tabId=7` nameId=29 (chất dẻo) + nameId=30 (SP chất dẻo) |
| IIP cao su + nhựa tổng hợp VN (YoY) | macroItemId=7, **nameId=16** ✅ (verify 2026-05-24: 12 rows, tên="Cao su và plastic") |
| FDI vào ngành nhựa | macroItemId=15 (chưa có nameId riêng cho nhựa — dùng tổng) |
| Bán lẻ hàng hoá VN (proxy tiêu dùng nội địa) | macroItemId=23, **nameId=2** ✅ (Bán lẻ HH, không gộp dịch vụ) |

**Gap**: Không có sector dashboard riêng trên Findicator. Không có per-DN data → hoàn toàn dựa BCTC + giá NVL global làm proxy margin.

#### Khối C — Giá bán

Không có giá bán per-DN → dùng DT từ BCTC (accountId=24) / sản lượng làm proxy ASP.

**Giá ống nhựa nội địa** (sstock `chart/general-data-series`, monthly, Nghìn VNĐ/m):

| Series name (exact) | Spec |
|---|---|
| `Hàng hóa trong nước (tháng) - Ống nhựa 27 x 1.8mm` | ống nhỏ (NTP/BMP nội địa) |
| `Hàng hóa trong nước (tháng) - Ống nhựa 60 x 2mm` | ống trung |
| `Hàng hóa trong nước (tháng) - Ống nhựa 90 x 2,9mm` | ống lớn |

Auth sstock required. Series name phải EXACT (phân biệt hoa/thường). **Verify 2026-05-24**: tên đúng lấy từ SSTOCK_SECTOR_SERIES trong stock_collector.py.

#### Khối D — Spread tracker

```
Spread = Biên gộp thực tế BCTC (%) vs Biến động giá NVL (PET/PP/PVC TQ × CNY_VND)
```

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["AAA","NTP","BMP","DNP","RDP"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 39(PE), 40(PB), 35(vốn hóa), **154(PE forward), 155(PB forward), 47(EV/EBITDA)**

---

### 5.18 Bảo hiểm (`/sector/insurance`)

**DN niêm yết**: BVH, BMI, BIC, BLI, MIG, PGI, PRE, PTI, ABI, AIC  
**Findicator sector prefix**: không có sector dashboard  
**Findicator corpType**: **2** (Bảo hiểm) — 14 TRAILING items (accountId 130–145)

#### Khối A — Môi trường lãi suất / chi phí vốn

| Chỉ số | API |
|---|---|
| Lãi suất huy động 12M (lãi suất tái đầu tư) | macroItemId=48 |
| Lợi suất TPCP VN 5Y (danh mục TP) | macroItemId=54, nameId=8 |
| Lợi suất TPCP VN 10Y | macroItemId=54, nameId=9 |
| Lợi suất UST 10Y (benchmark global) | macroItemId=54, nameId=3 |
| FED rate | macroItemId=96, nameId=1 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Doanh thu phí BH gốc per-DN theo quý | `enterprise/insurance-revenue?ticket=BVH&period=quarter&year=5Y` |

> `enterprise/insurance-revenue`: type=1 = phí BH gốc. Tickers: BVH, BMI, BIC, BLI, MIG, PGI, PRE, PTI, ABI, AIC.

#### Khối E/F — Cổ phiếu + BCTC (corpType=2)

**TRAILING corpType=2** (verify 2026-05-24 — 14 items):

| accountId TRAILING | Chỉ số |
|---|---|
| 131 | ROE |
| 132 | ROA |
| 133–137 | Cổ tức các loại |
| 140 | Vốn hóa (Tỷ đồng) |
| 141 | EPS (Đồng) |
| 143 | BVPS (Đồng) |
| 144 | PE |
| 145 | PB |

**INCOME_STATEMENT corpType=2** (verify 2026-05-24 — 38 items):

| accountId | Chỉ số |
|---|---|
| 125 | Doanh thu phí BH gốc (tổng) |
| 126 | Thu phí BH gốc |
| 127 | Thu phí nhận tái BH |
| 132 | Doanh thu phí BH thuần |
| 142 | Doanh thu thuần HĐ KD BH |
| 143 | Tổng chi bồi thường (gross) |
| 194 | Chi bồi thường (net) |
| 146 | Thu bồi thường nhượng tái BH |
| 150 | Tổng chi bồi thường BH |
| 154 | Chi phí khác HĐ KD BH |
| 170 | Lợi nhuận gộp HĐ KD BH |
| 178 | Doanh thu HĐ tài chính |
| 179 | Chi phí HĐ tài chính |
| 176 | Chi phí QLDN |
| 181 | LNTT (LN thuần HĐ KD) |
| 185 | Tổng LNTT |
| 191 | LNST |
| 193 | LNST CT mẹ |

**Loss ratio & Combined ratio** (tính client-side từ IS corpType=2 per quý):

| Tỷ lệ | Công thức (accountId) | Benchmark |
|---|---|---|
| Loss ratio | accountId=143 / accountId=132 | <65% = tốt |
| Expense ratio | accountId=176 / accountId=132 | <35% = tốt |
| Combined ratio | (143+176) / 132 | <100% = có lãi BH gốc |

> Fetch `finance-ticket-data?tableName=INCOME_STATEMENT&corpType=2&ticket=BVH&period=quarter` → tính 3 tỷ lệ trên per quý; overlay với phí BH gốc (IS accountId=125) để hiểu xu hướng bồi thường.

TRAILING corpType=2, tickers=["BVH","BMI","BIC","MIG","PTI"]

---

### 5.19 Dầu khí (`/sector/oilgas`)

**DN niêm yết**: GAS, PVS, PVD, BSR, PLX, PVC, PXS  
**Findicator sector prefix**: không có sector dashboard

#### Khối A — Giá hàng hoá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Dầu Brent (USD/Bbl) | macroItemId=35 | 65 |
| Dầu WTI | macroItemId=35 | 67 |
| Khí TN Henry Hub (USD/MMBtu) | macroItemId=35 | 66 |
| Tỷ giá USD/VND | macroItemId=52 | 1 |

#### Khối B — Thị trường ngành

| Chỉ số | API | nameId |
|---|---|---|
| Gas tanker VLGC (LPG) rate | macroItemId=35 | 312 |
| Gas tanker LGC rate | macroItemId=35 | 313 |
| Gas tanker MGC rate | macroItemId=35 | 314 |
| Gas tanker HDY SR rate | macroItemId=35 | 315 |
| Gas tanker ETH rate | macroItemId=35 | 316 |
| Gas tanker SR rate | macroItemId=35 | 317 |
| Gas tanker COASTER Asia | macroItemId=35 | 318 |
| Gas tanker COASTER Europe | macroItemId=35 | 319 |
| Tàu dầu MR tanker | macroItemId=35 | 322 |
| Tàu dầu VLCC | macroItemId=35 | 341 |
| BDTI (chỉ số dầu thô) | macroItemId=35 | 679 |
| BCTI (chỉ số dầu sản phẩm) | macroItemId=35 | 680 |
| Sản lượng LPG TQ (signal demand) | macroItemId=119, nameId=7 | — |
| IIP khai khoáng VN YoY | macroItemId=7 | — |
| XK dầu thô/sản phẩm dầu VN | macroItemId=25 (nameId từ legend) | — |

#### Khối C — Giá bán (xăng dầu nội địa)

| Chỉ số | API | nameId |
|---|---|---|
| Xăng RON95 vùng 1 VN (VNĐ/Lít) | macroItemId=35 | 612 |
| Xăng RON92 vùng 1 VN | macroItemId=35 | 613 |
| Xăng RON95 vùng 2 VN | macroItemId=35 | 614 |
| Dầu DO vùng 1 VN | macroItemId=35 | 618 |
| Dầu hoả vùng 1 VN | macroItemId=35 | 622 |

#### Khối D — Spread tracker

```
Downstream spread (PLX) = Giá xăng RON95 (VNĐ/lít) − Brent × USD_VND / 159
Upstream proxy (PVD/PVS): correlation Brent trend với DT từ BCTC
```

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["GAS","PVS","PVD","BSR","PLX"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 9(ROA), 22(Nợ/Vốn CSH), 39(PE), 40(PB), **154(PE forward), 155(PB forward), 47(EV/EBITDA)**

**Bổ sung per-DN trend:** Dùng `enterprise/manufactoring-revenue?ticket=GAS&year=All&period=quarter` + `enterprise/manufactoring-profit-after-tax?ticket=GAS` để lấy DT/LNST đầy đủ lịch sử per quý (dùng khi `finance_timeseries` chỉ trả 8 quý).

---

### 5.20 Vàng (`/sector/gold`)

**DN niêm yết**: PNJ  
**Findicator sector prefix**: không có sector dashboard

#### Khối A — Giá vàng quốc tế & nội địa

| Chỉ số | API | nameId |
|---|---|---|
| Vàng ICE quốc tế (USD/t.oz) | macroItemId=35 | 78 |
| Vàng thế giới quy đổi (VNĐ/lượng) | macroItemId=35 | 730 |
| Vàng SJC mua vào (VNĐ/lượng) | macroItemId=35 | 584 |
| Vàng SJC bán ra (VNĐ/lượng) | macroItemId=35 | 585 |
| Tỷ giá USD/VND | macroItemId=52 | 1 |
| DXY Index (USD strength — inverse correlation với vàng) | `bank/dxy-index?year=5Y` → sub[0] | — |

#### Khối D — Spread tracker

```
Spread SJC = Giá SJC bán − Giá thế giới quy đổi (ICE × USD_VND / 26.133 lượng/oz)
Premium SJC (%) = Spread / Giá thế giới quy đổi × 100
PNJ gross margin proxy = Biên gộp BCTC (%) vs biến động giá vàng thế giới
```

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| Bán lẻ VN (proxy nhu cầu trang sức) | macroItemId=23 |
| Khách quốc tế đến VN (proxy F&B/luxury demand) | macroItemId=61 |
| DXY trend (ngược chiều giá vàng) | `bank/dxy-index` |

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["PNJ"]  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 11(vòng quay HTK), 13(ngày HTK), 39(PE), 40(PB), 35(vốn hóa)  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)

---

### 5.21 Cà phê (`/sector/coffee`)

**DN niêm yết**: VCF, MCF  
**Findicator sector prefix**: không có sector dashboard

#### Khối A — Giá hàng hoá

| Chỉ số | API | nameId |
|---|---|---|
| Cà phê Arabica ICE (USd/Lbs) | macroItemId=35 | 95 |
| Cà phê hạt VN Robusta (VNĐ/kg) | macroItemId=35 | 687 |
| Tỷ giá USD/VND | macroItemId=52 | 1 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| XK cà phê VN monthly (Tr USD + Nghìn Tấn + USD/Tấn) | macroItemId=25, **nameId=6** (cà phê). **Verify 2026-05-24**: 04/2026 = 822.5 Tr USD / 189.9 kT / 4332 USD/T |
| XK cà phê VN YoY | macroItemId=25, valueType=yoy |
| Bán lẻ VN (proxy tiêu thụ nội địa) | macroItemId=23 |

#### Khối C — Giá bán / ASP

Không có per-DN ASP → dùng DT từ BCTC (accountId=24) / XK total từ macroItemId=25 làm benchmark.

#### Khối D — Spread tracker

```
Spread = Giá XK bình quân (Tr USD / Nghìn tấn XK từ macro) − Giá nguyên liệu hạt VN (VNĐ/kg × USD_VND)
```

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["VCF","MCF"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 39(PE), 40(PB)

---

### 5.22 Gỗ & Nội thất XK (`/sector/wood`)

**DN niêm yết**: GDT, VIF, PTB, ACG, MDF  
**Findicator sector prefix**: không có — dùng macro + enterprise  
**Xác nhận 2026-05-24**: `wood/legend` → null

#### Khối A — Giá đầu vào

| Chỉ số | API | Ghi chú |
|---|---|---|
| Tỷ giá USD/VND | macroItemId=52, nameId=1 | Driver chính vì >90% DT XK |
| Giá gỗ CME (timber) | macroItemId=35, nameId=89 | USD/MBF |
| IIP chế biến gỗ VN (YoY) | macroItemId=7, **nameId=29** ✅ | YoY +32.4% (verify 2026-05-24) |

#### Khối B — Thị trường ngành

| Chỉ số | API | nameId |
|---|---|---|
| XK gỗ và sản phẩm gỗ VN (YoY) | `overview/overview-data?tabId=6` | 19 |
| XK sản phẩm gỗ tinh chế (YoY) | `overview/overview-data?tabId=6` | 20 |
| XK gỗ monthly (Tr USD) | macroItemId=25, **nameId=29** ✅ | 995.5 Tr USD (verify 2026-05-24). Chỉ có `value`, không có volume/price riêng |
| NK gỗ nguyên liệu VN | macroItemId=26, **nameId=28** ✅ | Gỗ và sản phẩm gỗ (verify 2026-05-24) |
| FDI vào ngành gỗ | macroItemId=15, **nameId=6** ✅ | FDI chế biến gỗ/nội thất (verify 2026-05-24) |

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["GDT","VIF","PTB","ACG"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 22(Nợ/Vốn CSH), 39(PE), 40(PB)

---

### 5.23 Dược phẩm & Y tế (`/sector/pharma`)

**DN niêm yết**: DHG, IMP, DMC, TRA, DBD, PME, OPC  
**Findicator sector prefix**: không có — dùng macro + enterprise  
**Xác nhận 2026-05-24**: `pharma/legend` → null

#### Khối A — Giá đầu vào

| Chỉ số | API | Ghi chú |
|---|---|---|
| Tỷ giá USD/VND | macroItemId=52, nameId=1 | Driver vì NK API/hoạt chất |
| CPI Thuốc & DV y tế (YoY) | macroItemId=4, **nameId=16** ✅ | +13.58% YoY (verify 2026-05-24) |
| CPI DV y tế riêng (YoY) | macroItemId=4, **nameId=5** ✅ | +17.65% YoY (verify 2026-05-24) |
| NK dược phẩm VN (Tr USD) | macroItemId=26, **nameId=63** ✅ | 369.2 Tr USD/tháng (verify 2026-05-24) |
| NK NPL dược phẩm VN | macroItemId=26, **nameId=62** ✅ | 42.1 Tr USD/tháng (verify 2026-05-24) |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| NK NPL dược phẩm (dùng nameId=62 bên trên) | macroItemId=26, nameId=62 ✅ |
| FDI vào y tế/dược | macroItemId=15, **nameId=15** ✅ | 1.1 Tr USD/tháng (verify 2026-05-24) |
| IIP sản xuất dược phẩm (YoY) | macroItemId=7, **nameId=15** ✅ | YoY -10.2% (verify 2026-05-24) |
| Bán lẻ hàng hoá VN (proxy tiêu dùng nội địa) | macroItemId=23, **nameId=2** ✅ (Bán lẻ HH thuần) |

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["DHG","IMP","DMC","TRA","DBD"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 9(ROA), 27(thanh toán hiện hành), 39(PE), 40(PB)

---

### 5.24 Logistics & Cảng biển (`/sector/logistics`)

**DN niêm yết**: GMD, HAH, STG, TCO, DVP, VSC, PHP  
**Findicator sector prefix**: không có — dùng freight + enterprise  
**Xác nhận 2026-05-24**: `logistics/legend` → null

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId |
|---|---|---|
| Dầu Brent (chi phí nhiên liệu) | macroItemId=35 | 65 |
| WCI (container tổng hợp) | macroItemId=35 | 688 |
| BDI (hàng rời) | macroItemId=35 | 681 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| XK VN tổng (proxy throughput cảng XK) | macroItemId=25 (month, value/yoy) |
| NK VN tổng (proxy throughput cảng NK) | macroItemId=26 (month, value/yoy) |
| FDI vào logistics/kho vận | macroItemId=15, **nameId=8** ✅ | 366 Tr USD/tháng (verify 2026-05-24) |
| IIP VN (proxy hàng SX nội địa) | macroItemId=7 (month, yoy) |
| PMI VN (leading indicator throughput) | macroItemId=6 (month, value) |
| Container routes Shanghai→LA/NY | macroItemId=35, nameId=691/692 |
| **Luân chuyển hàng hoá VN** (3 phương thức: đường bộ/biển/HK) | macroItemId=32 (month, value/yoy) |
| **Giá vận tải kho bãi VN** (proxy chi phí logistics nội địa) | macroItemId=33 (quarter, value/yoy) |
| XNK TQ (proxy volume container Á-Thái Bình Dương) | macroItemId=127 (month, value/yoy) |
| XNK Mỹ (proxy volume tuyến US) | macroItemId=87 (month, value/yoy) |

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["GMD","HAH","STG","TCO","DVP"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 9(ROA), 22(Nợ/Vốn CSH), 39(PE), 40(PB), **154(PE forward), 155(PB forward)**

---

### 5.25 Lúa gạo (`/sector/rice`)

**DN niêm yết**: LTG, AGM, TAR  
**Findicator sector prefix**: không có — `rice/legend` → null  
**WiChart**: `key=hanghoa, name=lua` (fresh 2026-05-14)

#### Khối A — Giá đầu vào

| Chỉ số | API | nameId/Ghi chú |
|---|---|---|
| Giá lúa gạo VN (nghìn đ/kg) | WiChart key=hanghoa, name=lua | PRIMARY — fresh, daily |
| Tỷ giá USD/VND (driver XK) | macroItemId=52 | 1 |
| Phân bón: Urea Phú Mỹ (chi phí trồng) | macroItemId=35 | 12 |
| Phân bón: Urea Cà Mau | macroItemId=35 | 13 |
| Dầu Brent (chi phí logistics) | macroItemId=35 | 65 |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| XK gạo VN monthly (Tr USD + Nghìn Tấn + USD/Tấn) | macroItemId=25, **nameId=9** (gạo). **Verify 2026-05-24**: 04/2026 = 513.9 Tr USD / 1107 kT / 464 USD/T |
| XK gạo VN YoY | macroItemId=25, valueType=yoy |
| XK gạo overview (tabId=6) | `overview/overview-data?tabId=6` — tìm nameId gạo trong dimOverviewVietNam |
| Bán lẻ VN (proxy tiêu dùng nội địa) | macroItemId=23 |
| PMI TQ (proxy demand gạo từ TQ) | macroItemId=115, nameId=8 |

#### Khối C — Giá bán / ASP

Không có per-DN ASP từ Findicator → dùng DT BCTC (accountId=24) / XK total (macroItemId=25) làm benchmark.

#### Khối D — Spread tracker

```
Spread = Giá XK bình quân (Tr USD / Nghìn tấn × tỷ giá) − Giá lúa nguyên liệu VN (nghìn đ/kg)
```

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["LTG","AGM","TAR"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 9(ROA), 11(vòng quay HTK), 39(PE), 40(PB), **154(PE forward), 155(PB forward)**

---

### 5.26 Hồ tiêu (`/sector/pepper`)

**DN niêm yết**: HAL (và các DN nhỏ chưa niêm yết)  
**Findicator sector prefix**: không có — `pepper/legend` → null  
**WiChart**: `key=hanghoa, name=tieu` (fresh 2026-05-22)

#### Khối A — Giá hàng hoá

| Chỉ số | API | Ghi chú |
|---|---|---|
| Giá hồ tiêu VN (VNĐ/kg) | WiChart key=hanghoa, name=tieu | PRIMARY — fresh daily |
| Tỷ giá USD/VND (driver XK) | macroItemId=52, nameId=1 | |
| Dầu Brent (logistics) | macroItemId=35, nameId=65 | |

#### Khối B — Thị trường ngành

| Chỉ số | API |
|---|---|
| XK hồ tiêu VN monthly (Tr USD + Nghìn Tấn + USD/Tấn) | macroItemId=25, **nameId=8** (hạt tiêu). **Verify 2026-05-24**: 04/2026 = 193.9 Tr USD / 30.9 kT / 6265 USD/T |
| XK hồ tiêu VN YoY | macroItemId=25, valueType=yoy |
| Bán lẻ VN (proxy tiêu dùng nội địa) | macroItemId=23 |

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["HAL"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 39(PE), 40(PB)

**Lưu ý**: Ngành hồ tiêu VN chủ yếu là DN tư nhân chưa niêm yết. HAL là proxy nhỏ. Dashboard chủ yếu phục vụ phân tích macro XK nông sản.

---

### 5.27 Công nghệ & Điện tử (`/sector/technology`)

**DN niêm yết IT/Tech**: FPT, CMG, VGI, ELC  
**Findicator sector prefix**: không có — `technology/legend` → null  
**Lưu ý**: XK điện tử/điện thoại VN chủ yếu là Samsung/Intel (FDI, không niêm yết) → dashboard này phân tích vĩ mô ngành + IT services DN niêm yết.

#### Khối A — Môi trường kinh doanh

| Chỉ số | API | nameId |
|---|---|---|
| Tỷ giá USD/VND (revenue ngoại tệ FPT offshore) | macroItemId=52 | 1 |
| FED rate (proxy IT spend của khách US) | macroItemId=96 | 1 |
| Lãi suất huy động VN (chi phí vốn) | macroItemId=48 | — |
| CPI Mỹ YoY (proxy purchasing power US) | macroItemId=70 | — |

#### Khối B — Thị trường ngành (XK Electronics VN)

> **Đây là 2 ngành hàng XK lớn nhất VN (~40% tổng XK)** — chủ yếu Samsung/Intel (FDI)

| Chỉ số | API | nameId |
|---|---|---|
| XK máy tính, SP điện tử & linh kiện (Tr USD) | macroItemId=25 | 43 — period=month_value |
| XK điện thoại & linh kiện (Tr USD) | macroItemId=25 | 44 — period=month_value |
| XK điện tử YoY | `overview/overview-data?tabId=6` | nameId=25 (máy tính) + 26 (điện thoại) |
| NK linh kiện điện tử VN (đầu vào SX) | macroItemId=26 (nameId=43/44 từ legend) | — |
| FDI vào điện tử/công nghệ | macroItemId=15 (lọc ngành điện tử) | — |
| Bán lẻ Mỹ (proxy IT spending US) | macroItemId=84 | — |
| IIP Mỹ theo ngành (demand signal) | macroItemId=80 (month, value) | — |
| PMI TQ (supply chain risk) | macroItemId=115, nameId=8 | — |
| Bán lẻ TQ (proxy demand châu Á) | macroItemId=126 | — |

#### Khối C — Giá bán / ASP IT Services per-DN

Không có per-DN ASP từ Findicator → dùng DT BCTC (accountId=24) làm proxy revenue growth.

#### Khối E/F — Cổ phiếu + BCTC

TRAILING corpType=4, tickers=["FPT","CMG","VGI","ELC"]  
accountIds INCOME_STATEMENT: 24(DT), 28(LN gộp), 43(LNST)  
accountIds TRAILING: 2(biên gộp%), 8(ROE), 9(ROA), 22(Nợ/Vốn CSH), 39(PE), 40(PB), **154(PE forward), 155(PB forward), 47(EV/EBITDA)**

---

## 6. Trang Macro Dashboard (`/macro`)

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ MACRO DASHBOARD — Tổng quan kinh tế   [66 live prices bar]  │
├──────────────┬───────────────┬──────────────────────────────┤
│ VĨ MÔ VN    │ VĨ MÔ MỸ     │ VĨ MÔ TQ                    │
│ GDP + IIP   │ GDPNow + CPI │ PMI TQ + BĐS TQ              │
│ CPI VN      │ FED rate     │ XNK TQ (XK/NK YoY)          │
│ Tín dụng    │ NFP + Thất ng│ Đầu tư TS cố định YoY       │
│ Dự trữ NHối │ PCE + FED TS │                              │
├──────────────┴───────────────┴──────────────────────────────┤
│ TIỀN TỆ & LÃI SUẤT                                          │
│ USD/VND | DXY | Lãi huy động | OMO NHNN | TPCP VN 10Y      │
│ UST 2Y/10Y | Spread (UST10Y − TPCP10Y)                     │
├─────────────────────────────────────────────────────────────┤
│ HÀNG HOÁ KEY                                                 │
│ Brent | BDI | Đồng LME | HRC | Ngô | Đậu nành | Đường     │
├─────────────────────────────────────────────────────────────┤
│ XNK VIỆT NAM                                                 │
│ Top 10 mặt hàng XK YoY | Top NK YoY | FDI theo ngành       │
└─────────────────────────────────────────────────────────────┘
```

### Data mapping

| Chỉ số | macroItemId | period | valueType |
|---|---|---|---|
| GDP VN (Tỷ VNĐ) | 2 | quarter | value |
| CPI VN (YoY%) | 4 | month | yoy |
| **PPI VN (YoY%)** | **10** | month | **yoy** (⚠ chỉ hỗ trợ qoq/yoy, KHÔNG dùng valueType=value) |
| IIP VN (YoY%) | 7 | month | yoy |
| PMI VN | 6 | month | value |
| **M2 VN (YoY%)** | **46** | **month** | **yoy** (nameId=1 only; 60 rows; latest +7.71% YoY) |
| Tín dụng (Tỷ VNĐ + YoY) | 47 | month | value+yoy |
| FDI đăng ký (Tr USD) | 15 | month | value |
| Tỷ giá USD/VND | 52 | date | value |
| Lãi suất huy động 12M | 48 | date | value |
| Dự trữ ngoại hối VN (Triệu USD) | 55 | month | value |
| OMO NHNN (phát hành/đáo hạn/bơm ròng) | 50 | date | value (8 series) |
| XK hàng hoá YoY | 25 | month | yoy |
| NK hàng hoá YoY | 26 | month | yoy |
| CPI Mỹ (YoY%) | 70 | month | yoy |
| FED rate | 96 | date | value |
| FED Total Assets (weekly) | 97 | week | value |
| PCE Mỹ (YoY%) | 75 | month | yoy |
| NFP Mỹ (Nghìn việc làm) | macroItemId=76, **nameId=3** | date | value (115K = 115,000 jobs) |
| Thất nghiệp Mỹ (%) | macroItemId=76, **nameId=2** | date | value thập phân (0.043=4.3%) |
| Jobless claims hàng tuần | macroItemId=76, **nameId=6** | date | value (1,827K/tuần) |
| ADP employment change | macroItemId=76, **nameId=5** | date | value (43 rows/5Y) |
| GDPNow (tổng, nameId=5) | 139 | date | value |
| PMI TQ (Manufacturing) | 115, nameId=1 | month | value |
| XK TQ (YoY%) | macro/menu-macro-custom → CN Trade | month | yoy |
| NK TQ (YoY%) | macro/menu-macro-custom → CN Trade | month | yoy |
| BĐS TQ đầu tư (YoY) | 125 | month | yoy |
| Lợi suất TPCP VN 5Y/10Y | 54, nameId=VN series | date | value |
| Lợi suất UST 2Y/10Y | 54, nameId=US series | date | value |
| 66 live prices snapshot (header bar) | `overview/legend` → dataInit | realtime | change/pctChange |
| Lãi suất/Lạm phát/PMI global tabs | `overview/overview-data?tabId=1-4` | — | — |
| **PMI SX global per quốc gia** (tabId=4, 371 rows) | `overview/overview-data?tabId=4&repo=overview_global` | — | **nameId mapping** (verify 2026-05-24): 34=China, 35=France, 36=Germany, 37=India, 38=Indonesia, 39=Italy, 40=Japan, 41=Korea, 42=Thailand, 43=UK, 44=US, 45=Vietnam, 49=Euro Area |
| Vĩ mô VN tổng hợp (GDP/FDI/tín dụng/CPI/PMI) | `overview/overview-data?tabId=5` (repo=overview_vietnam) — 15 nameId. nameId=66=Tỷ giá USD/VND YoY, 67=VNIBOR-FFR spread, 68=LS huy động 12M Big4 (5.90%), 69=LS huy động 12M NHTM tư nhân (6.07%). **Verify 2026-05-24** | — | — |
| XK VN YoY theo ngành (thủy sản/gỗ/dệt may/thép/electronics) | `overview/overview-data?tabId=6` (repo=overview_vietnam) — 16 nameId, verify 2026-05-24 | — | — |
| NK VN YoY theo nhóm NL (nhựa/vải/thép/electronics) | `overview/overview-data?tabId=7` (repo=overview_vietnam) — 11 nameId, verify 2026-05-24 | — | — |
| Bán lẻ Mỹ (proxy demand thủy sản/dệt may XK) | macroItemId=84 | month | value |
| XNK Mỹ YoY (proxy vận tải biển) | macroItemId=87 | month | value/yoy |
| Bán lẻ TQ (proxy demand thép/chăn nuôi) | macroItemId=126 | month | value/yoy |
| XNK TQ YoY (vận tải/thủy sản/dệt may) | macroItemId=127 | month | value/yoy |
| PMI TQ đơn hàng XK (nameId=9) | macroItemId=115 | month | value |
| PMI TQ chi phí NVL (nameId=7) | macroItemId=115 | month | value |
| PMI TQ đơn hàng mới (nameId=10) | macroItemId=115 | month | value |
| IIP Mỹ theo ngành (demand signal XK) | macroItemId=80 | month | value |
| Sector index VN — VNCOND/VNCONS/VNDIAMOND/VNENE/HNX30 | macroItemId=134, nameId=7/8/9/10/11, daily, verify 2026-05-24 | — | — |

---

## 7. API Endpoints FastAPI

```
GET /                           → redirect /sector/steel
GET /macro                      → macro.html
GET /sector/{code}              → sector.html (template chung)

GET /api/macro/vn               → cache macro_vn.json
GET /api/macro/us               → cache macro_us.json
GET /api/macro/cn               → cache macro_cn.json
GET /api/macro/commodities      → cache commodities_key.json
GET /api/sector/{code}          → cache sector_{code}.json
GET /api/sector/{code}/stocks   → TRAILING multi-ticker (cache)
GET /api/sector/{code}/bctc     → INCOME_STATEMENT 8Q (cache)
GET /api/stock/{ticker}         → cache stock_{ticker}.json
GET /api/health                 → {status, last_refresh, sectors}
```

---

## 8. Cache schema (sector_steel.json ví dụ)

```json
{
  "meta": {
    "sector": "steel",
    "refreshed_at": "2026-05-24T07:30:00+07:00",
    "tickers": ["HPG", "HSG", "NKG", "TNA"]
  },
  "inputs": {
    "quang_sat_cme":  [{"date": "2026-05-23", "value": 102.5, "unit": "USD/T"}, ...],
    "than_coc_tq":    [...],
    "hrc_tq":         [...],
    "hrc_cme":        [...],
    "usd_vnd":        [...]
  },
  "market": {
    "domestic_market_share": {"HPG": [...], "HSG": [...], "NKG": [...], "TVDUC": [...]},
    "inventory":      [...],
    "import_value":   [...]
  },
  "output_prices": {
    "cb300_d10":  [...],
    "cb400_d10":  [...],
    "cuon_cb240": [...]
  },
  "stocks": {
    "HPG": {"price": 24500, "pe": 12.3, "pb": 1.45, "gpm": 0.18, "roe": 0.12, "mcap_tyvnd": 145000},
    "HSG": {...},
    "NKG": {...}
  },
  "bctc_8q": {
    "HPG": [{"year": 2026, "quarter": 1, "revenue": 38000, "gross_profit": 6840, "net_profit": 3200}, ...],
    "HSG": [...]
  },
  "forward_valuation": {
    "HPG": {"pe_forward": 10.5, "pb_forward": 1.3, "date": "2026-05-24"},
    "HSG": {"pe_forward": 8.2, "pb_forward": 1.1, "date": "2026-05-24"}
  },
  "data_quality": {
    "stale_sources": [
      {"source": "wichart_cao_su", "last_date": "2025-02-10", "stale": true, "reason": "WiChart không cập nhật"},
      {"source": "macro_omo", "last_date": "2025-12-31", "stale": true, "reason": "macroItemId=50 dừng 31/12/2025"},
      {"source": "macro_cn_energy", "last_date": "2024-12-01", "stale": true, "lag_months": 17, "reason": "macroItemId=119 lag ~17 tháng"}
    ],
    "refreshed_at": "2026-05-24T07:30:00+07:00"
  }
}
```

---

## 9. Lịch refresh data

| Nhóm | Collector | Giờ chạy | Freq |
|---|---|---|---|
| Macro VN/US/CN | macro_collector.py | 07:30 | Daily |
| Hàng hoá (107 series) | steel/cement/rubber/... | 07:35 | Daily |
| Sector dashboards (19 ngành có dashboard) | sector-specific | 07:40 | Daily |
| BCTC + TRAILING (multi-ticker) | chung | 08:00 | Weekly (Thứ 2) |
| OHLCV per-ticker | stock | 07:45 | Daily |
| WiChart (12 hàng hoá + 6 vĩ mô) | wichart_collector.py | 07:33 | Daily |

**Lưu ý staleness tự động**: Sau mỗi refresh, collector ghi `data_quality.stale_sources` vào cache JSON (xem §8). Frontend đọc field này để hiển thị badge.

**Nguồn không cần refresh** (đã dừng — giá trị tĩnh):
- macroItemId=50 (OMO): dừng 31/12/2025 → lấy 1 lần, cache vĩnh viễn + badge
- macroItemId=53 (tỷ giá Vietcombank khác): dừng 31/12/2025 → fallback `steel/exchange-rate`

APScheduler config trong `app.py`:
```python
scheduler.add_job(run_all_collectors, 'cron', hour=7, minute=30)
```

---

## 10. Thứ tự triển khai (Phases)

### Phase 1 — Thép pilot (1 tuần)

- [ ] `sector-hub/` init + FastAPI boilerplate
- [ ] Copy/symlink `findicator_api.py`, `wichart_api.py` từ phan-tich-ai
- [ ] `collectors/steel_collector.py` — thu thập 6 khối, lưu `cache/sector_steel.json`
- [ ] `routers/sector.py` — `/api/sector/steel` trả JSON
- [ ] `static/steel.html` — layout 6 khối, Highcharts
- [ ] APScheduler daily refresh
- [ ] Verify: chạy script → mở browser → thấy data đúng

### Phase 2 — Macro + 4 ngành lớn (2 tuần)

- [ ] `macro_collector.py` + `macro.html`
- [ ] `bank_collector.py` + `bank.html` (có thêm bank-specific charts)
- [ ] `pangasius_collector.py` + template
- [ ] `shrimp_collector.py` + template
- [ ] `aviation_collector.py` + template

### Phase 3 — 6 ngành còn thiếu per-DN data (1 tuần)

- [ ] cement, rubber, pig, chemistry, textile, transport
- [ ] Các ngành này chủ yếu dựa BCTC comparison + macro sector

### Phase 4 — 4 ngành phức tạp (1 tuần)

- [ ] industry (KCN) — FDI + land price dashboard
- [ ] realestate — project tracking
- [ ] securities — thị phần môi giới
- [ ] food-beverage — tiêu dùng + đường

### Phase 5 — Polish (1 tuần)

- [ ] Landing page `/` — grid 27 ngành, KPI snapshot mỗi ngành
- [ ] Search / filter cổ phiếu cross-sector (`enterprise/corp-search?corpText=`)
- [ ] `/api/health` + last_refresh indicator + staleness badges
- [ ] Mobile responsive
- [ ] Error handling khi API Findicator lỗi (hiện cache cũ + badge "stale")
- [ ] Per-chart time buttons (1Y/3Y/5Y) với `data-year-options` attribute

### Phase 6 — 5 ngành mới (1 tuần)

- [ ] `plastics_collector.py` — COMDTY nhựa TQ (PET/PP/PVC/LDPE/HDPE/LLDPE) + BCTC AAA/NTP/BMP + forward PE/PB (accountId=154/155)
- [ ] `insurance_collector.py` — corpType=2 TRAILING + insurance-revenue BVH/BMI/BIC + TPCP yield
- [ ] `oilgas_collector.py` — Brent/WTI/LPG + gas tanker rates (312-315) + BCTC GAS/PVS/PVD + `enterprise/manufactoring-revenue?ticket=GAS`
- [ ] `gold_collector.py` — 4 nameIds vàng (78/730/584/585) + SJC spread + BCTC PNJ
- [ ] `coffee_collector.py` — nameId 95/687 + XK cà phê macroItemId=25 + BCTC VCF/MCF
- [ ] Templates HTML cho 5 ngành mới

### Phase 7 — 3 ngành không có Findicator dashboard (1 tuần)

> Không có sector endpoint → dùng BCTC + macro proxy (tabId=6/7) + TRAILING.

- [ ] `wood_collector.py` — XK gỗ tabId=6 nameId=19/20 + macroItemId=25 (nameId gỗ) + BCTC GDT/VIF/PTB (TRAILING corpType=4) + forward PE/PB
- [ ] `pharma_collector.py` — CPI nhóm thuốc (macroItemId=4) + macroItemId=26 (NK dược phẩm) + BCTC DHG/IMP/DMC/TRA/DBD (TRAILING corpType=4)
- [ ] `logistics_collector.py` — freight BDI/WCI (nameId=681/688) + macroItemId=32/33 (luân chuyển/giá vận tải) + macroItemId=87/127 (XNK Mỹ/TQ) + BCTC GMD/HAH/STG/TCO/DVP
- [ ] Templates HTML cho 3 ngành mới

**Landing page bổ sung (Phase 7)**:
- [ ] Sector indices panel: VNCOND/VNCONS/VNENE/VNDIAMOND YTD% — macroItemId=134 nameId=7-10

### Phase 8 — 3 ngành mới bổ sung (1 tuần)

> Ngành XK nông sản + Công nghệ — không có Findicator sector dashboard, dùng WiChart + macro.

- [ ] `rice_collector.py` — WiChart `lua` (lúa gạo VN) + macroItemId=25 **nameId=9** (XK gạo, verified) + BCTC LTG/AGM/TAR
- [ ] `pepper_collector.py` — WiChart `tieu` (hồ tiêu VN) + macroItemId=25 **nameId=8** (XK tiêu, verified) + BCTC HAL
- [ ] `technology_collector.py` — macroItemId=25 nameId=43/44 (XK điện tử/điện thoại) + macroItemId=26 (NK linh kiện) + BCTC FPT/CMG/VGI + tabId=6 nameId=25/26
- [ ] Templates HTML cho 3 ngành mới
- [ ] Cập nhật `data_quality.stale_sources` checker vào mọi collector

---

## 11. Gaps đã biết và cách xử lý

| Ngành | Gap | Xử lý |
|---|---|---|
| Xi măng | Không có per-DN market share | Dùng BCTC DT per-DN làm proxy |
| Cao su | Không có per-DN (DPR/PHR) | Chỉ có giá JPX/Singapore + BCTC |
| Phân bón | Không có per-DN time-series | Giá NVL tổng ngành + BCTC |
| Chăn nuôi | Không có per-DN (DBC/BAF) | Giá heo hơi + giá vốn nuôi + BCTC |
| Vận tải biển | Không có per-DN VN | Freight index global + BCTC |
| Dệt may | Chỉ có XK tổng VN (đã có textileExportCountry) | BCTC per-DN + textile/overview |
| F&B | Thị phần sữa static 2022 | BCTC per-DN + beer-data/milk-data verified |
| Điện | Giá điện EVN tĩnh (có output-price endpoint) | `electricity/output-price` + IIP điện |
| Hàng không | Không có Jet Fuel nameId riêng — JetA-1 ≈ dầu hoả | **nameId=623** (Dầu hỏa vùng 1 VN, VNĐ/Lít) + Brent(65) + sstock "Nhập khẩu xăng dầu" proxy |
| BĐS | Không có supply-demand endpoint (không tồn tại trên Findicator) | BCTC DT per-DN + lãi suất proxy |
| Macro | NFP/thất nghiệp/XNK TQ cần verify nameId từ menu-macro-custom | Gọi `macro/menu-macro-custom` lần đầu để map |
| **CNY/VND 2026** | macroItemId=53 (tỷ giá Vietcombank) dừng 31/12/2025 — không có data 2026 | Fallback: `steel/exchange-rate` → `cnyExchangeRate` (PUBLIC, real-time) |
| **OMO 2026** | macroItemId=50 (OMO NHNN) dừng 31/12/2025 — không có data 2026 | Hiển thị badge "Data đến 12/2025" trong dashboard ngân hàng |
| **TPCP filter MAX** | macroItemId=54 không hỗ trợ `filter=MAX` | Dùng filter=5Y tối đa; loop thủ công nếu cần lịch sử dài hơn |
| **pig/pig_farming_global** | Chỉ hỗ trợ `year=1Y` — `year=5Y/MAX` trả 400 | Luôn gọi với year=1Y, update daily |
| **rubber/values period** | `period=quarter_value` trả 400 | Chỉ dùng `date_value` hoặc `month_value` |
| **rubber/transport/aviation year=MAX** | `year=MAX` trả null cho rubber/values, transport/values, aviation/flight-company-data | Dùng tối đa `year=5Y`. **Verify 2026-05-24** |
| **electricity year param** | `electricity/output-resource-by-value` + `electricity/electric-output-plant` KHÔNG hỗ trợ year param — luôn trả full dataset | Không thêm nút year cho 2 chart này; fetch once và frontend slice |
| **macroItemId=25 nameIds confirmed** (cà phê/tiêu/gạo) | nameId=6=cà phê, nameId=8=hạt tiêu, nameId=9=gạo. Response có thêm field `volume` (kT) + `price` (USD/T). **Verify 2026-05-24** | Thêm volume/price vào chart tooltip |
| **sstock thị phần giao dịch** | sstock `general-data-series` với exact name `"Thị phần giao dịch - {TICKER}"` → quarterly time-series 25 pts (2020-Q1→2026-Q1), không cần đoán từ snapshot | Ưu tiên dùng thay vì Findicator snapshot cho CK sector |
| **sstock ống nhựa VN** | Series name exact: `"Hàng hóa trong nước (tháng) - Ống nhựa 27 x 1.8mm/60 x 2mm/90 x 2,9mm"`. **Verify 2026-05-24** (tên đúng từ SSTOCK_SECTOR_SERIES) | Dùng cho Nhựa Khối C giá bán nội địa |
| **sstock đường/robusta/jet fuel** | Các tên series generic ("Đường mía Hoa Kỳ Future"/ "Cà phê Robusta ICE Future"/"Xăng máy bay") KHÔNG match trong general-data-series | Dùng exact string từ SSTOCK_SECTOR_SERIES dict (xem stock_collector.py line ~1315): `"Hàng hóa thế giới - Đường mía Hoa Kỳ (Future)"` ✅, `"Số liệu sản phẩm công nghiệp - Đường kính"` ✅ |
| **sstock NH dư nợ per ngành/loại KH** | `chart/bank/loan-structure-by-sector` + `loan-structure-by-type` → annual only, ~18/13 rows, 2024 data | Wire vào bank_collector.py annual refresh (không cần daily/weekly) |
| Nhựa | Không có sector dashboard, không có per-DN XK/sản lượng | COMDTY global NVL TQ + BCTC per-DN. Spread = biên gộp BCTC vs giá NVL |
| Bảo hiểm | Chỉ có phí BH gốc (type=1), không có tỷ lệ bồi thường | BCTC full IS + TRAILING corpType=2 |
| Dầu khí | Không có per-DN revenue/margin từ sector endpoint | Gas tanker global + giá xăng nội địa + BCTC per-DN |
| Vàng | Không có volume dữ liệu per-DN | SJC spread track được từ nameId 584/585; margin PNJ từ BCTC |
| Cà phê | Chỉ 2 DN nhỏ, XK total từ macro | BCTC per-DN + macroItemId=25 làm benchmark ngành |
| **Ngân hàng — VNIBOR** | macroItemId=49 xác nhận 0 rows (verify 2026-05-24) | **WiChart `lslnh`** là primary — 3 series daily (qua đêm/1W/2W) |
| **Sector indices** — VNFIN/VNMAT/VNHEAL/VNREAL/VNUTIL | macroItemId=134 scan nameId 1-50 (verify 2026-05-24): chỉ có VNCOND(7)/VNCONS(8)/VNDIAMOND(9)/VNENE(10)/HNX30(11). Không có VNFIN/VNMAT/VNHEAL/VNREAL/VNUTIL | Chỉ hiển thị 4 sector index có sẵn trên dashboard |
| **Bank TRAILING accountIds** — bug fix | Các accountId trong plan cũ sai cho corpType=1: ROE=131 sai (đúng=67), PE=144 sai (đúng=89), PB=145 sai (đúng=90). **Đã fix 2026-05-24** | Dùng đúng accountId: ROE=67, ROA=68, PE=89, PB=90 cho corpType=1 |
| **Gas tanker 316-319** | Trước đây chỉ có 312-315. **Verify 2026-05-24**: 316-319 đều có data. 316=ETH(1.1M)/317=SR(630K)/318=COASTER Asia(550K)/319=COASTER Europe(280K) USD/tháng | **Đã bổ sung 2026-05-24** vào §5.13 transport và §5.19 oilgas |
| **macroItemId=76 US Labor nameIds** | Trước đây chưa có mapping. **Verify 2026-05-24**: nameId=2=Thất nghiệp%(0.043=4.3%), nameId=3=NFP(115K), nameId=5=ADP, nameId=6=Jobless claims(1.827M) | **Đã bổ sung 2026-05-24** vào §6 macro dashboard |
| **tabId=5 nameId=66-69** | Mô tả cũ "NHNN policy rates" sai — thực tế: 66=Tỷ giá USD/VND YoY, 67=VNIBOR-FFR spread, 68=LS huy động 12M Big4 (5.90%), 69=LS huy động 12M NHTM tư nhân (6.07%). **Verify 2026-05-24** | **Đã fix 2026-05-24** §6 data mapping |
| **macroItemId=107 (CPI TQ) lag ~13 tháng** | Data cuối = 04/2025 tính đến 2026-05-24 (lag ~13M). **Verify 2026-05-24** | Hiển thị badge "Lag ~13M" trong §5.9 hoá chất, §5.1 thép |
| **macroItemId=112 (PPI TQ) lag ~5 tháng** | Data cuối = 12/2025 tính đến 2026-05-24 (lag ~5M). **Verify 2026-05-24** | Hiển thị badge "Lag ~5M" |
| **macroItemId=9/10 yoy-only constraint** | Cả hai macroItemId chỉ hỗ trợ `valueType=qoq/yoy`, KHÔNG hỗ trợ `valueType=value`. **Verify 2026-05-24** | Nút 1Y/3Y/5Y chỉ hiển thị yoy; ẩn nút "Absolute value" |
| **MR tanker (nameId=322) + VLCC (341)** | Cả hai trả 0 rows từ `transport/values`. **Verify 2026-05-24** | Đã xoá khỏi transport/values API call string §5.13 |
| **Aframax (339) + Suezmax (340)** | **Verify 2026-05-24**: cả hai có data. 339=~$28,500/ngày (254 rows/5Y), 340=~$37,500/ngày (256 rows/5Y), cập nhật 2026-05-20 | **Đã bổ sung 2026-05-24** vào §5.13 transport; đã xoá note "cần test live" |
| **sstock NaOH TQ Spot** | Tên chính xác: `"Hàng hóa thế giới - Xút (NaOH) Trung Quốc (Spot)"` (1716 rows, 620 CNY/T). **Verify 2026-05-24** | **Đã bổ sung 2026-05-24** vào §5.9 hoá chất Khối A |
| **enterprise/bank-profit-after-tax** | Chưa có trong §5.2 và §13. **Verify 2026-05-24**: 20 rows, VCB Q1/2026=9.46T VNĐ | **Đã bổ sung 2026-05-24** vào §5.2 + §13 |
| **loan-structure-by-quality response key** | Key là `balanceSheetInfo` (không phải `data` như loan-by-sector). **Verify 2026-05-24**: 42 rows | **Đã note 2026-05-24** vào §5.2 và §13 |
| **M2 VN (macroItemId=46)** | Chưa có trong §6. Period=month, nameId=1 only, 60 rows, latest +7.71% YoY. **Verify 2026-05-24** | **Đã bổ sung 2026-05-24** vào §6 Macro Dashboard |
| **PPI VN (macroItemId=10)** | Chưa có trong §6. Chỉ hỗ trợ yoy (constraint chung macroItemId=9/10). **Verify 2026-05-24** | **Đã bổ sung 2026-05-24** vào §6 Macro Dashboard |
| **PMI global tabId=4 nameIds** | Trước đây chưa có mapping quốc gia. **Verify 2026-05-24**: 34=CN, 35=FR, 36=DE, 37=IN, 38=ID, 39=IT, 40=JP, 41=KR, 42=TH, 43=UK, 44=US, 45=VN, 49=Euro | **Đã bổ sung 2026-05-24** vào §5.10 dệt may, §5.11 KCN, §5.13 vận tải, §6 macro |
| **IS corpType=2 Bảo hiểm** — 38 items | Trước đây chưa có mapping. **Verify 2026-05-24**: đã xác định đủ 38 accountIds từ 125 đến 193 | **Đã bổ sung 2026-05-24** vào §5.18 |
| **steel/demand-export-status** | Chưa được wire. **Verify 2026-05-24**: 4 series name_id=18-21, 60 rows, Nghìn tấn | **Đã bổ sung 2026-05-24** vào §5.1 Khối B |
| **steel/enterprise-domestic-market-share** | Chưa được wire. **Verify 2026-05-24**: 180 rows per-DN, name_id={18,20,21} | **Đã bổ sung 2026-05-24** vào §5.1 Khối B |
| **enterprise/bank-debt** | Chưa có trong plan. **Verify 2026-05-24**: 100 rows, type 1-5, VND tuyệt đối | **Đã bổ sung 2026-05-24** vào §5.2 và §13 |
| **CASH_FLOW_DIRECT/INDIRECT** | Labels xác nhận (28/39 items corpType=4, 47 items corpType=1). Tuy nhiên data Q1/2026 HPG = empty → có thể DN dùng phương pháp gián tiếp hoặc data chưa available | Xem §13 cho label table |
| **WiChart cao_su** | Data stale — cuối cùng 2025-02-10 (~15 tháng) | Dùng Findicator nameId=51 (JPX) + 93 (TSR20) làm primary |
| **WiChart xi_mang** | Data stale — cuối cùng 2025-02-04 (~15 tháng) | Dùng `cement/internal-cement-price` (nameId=57) làm primary |
| **Ngành không có Findicator dashboard** | logistics/pharma/retail/wood/rice/pepper/technology/khai khoáng (xác nhận 2026-05-24) | BCTC per-DN + macro proxy (tabId=6/7 cho XK) + WiChart + TRAILING |
| **industry/filter-company** | Trả `{result: [...]}` không phải list | Giải nén `r['result']` trước khi xử lý |
| **Ngân hàng — nợ xấu chi tiết** | `bank-bad-debt-ratio/loan-over-time/client-debt` chưa có trong Phase 2 plan | Wire vào bank_collector.py Phase 2 — thêm 3 endpoint per NH |
| **Forward PE/PB** | `overview-valuation?accountIds=154,155` không hỗ trợ corpType=2/3 (NH/CK/BH) | Chỉ dùng cho corpType=4 (SX/BĐS) |
| **macroItemId=119 China energy** | Lag ~17 tháng (data đến 12/2024) | Hiển thị badge "Lag ~17 tháng", dùng làm reference dài hạn, không làm realtime signal |
| **Lúa gạo/hồ tiêu nameId** | nameId XK từ macroItemId=25 cần verify qua `menu-macro` → legend dim_macro_vn_exim_excomdty | Gọi `macro/get-label-v2?dimTable=macro_vn_dim_exim_excomdty` để lấy đúng nameId |
| **retail sector** | Findicator không có retail dashboard (tất cả endpoint 404) | Không build sector/retail — chỉ dùng macroItemId=23 (bán lẻ VN) làm indicator trong các ngành B2C |
| **Dệt may — per-DN data** | Không có `textileExportCountry` per-DN breakdown, chỉ có tổng VN | Dùng macroItemId=80/84 (IIP Mỹ / bán lẻ Mỹ) + BCTC per-DN làm proxy |
| **Cá tra/tôm — Mỹ là TT XK chính** | Bán lẻ Mỹ (macroItemId=84) chưa được wire | **Đã bổ sung 2026-05-24**: macroItemId=84 nameId=14 (thực phẩm Mỹ) vào pangasius/shrimp Khối B. Dim tree đầy đủ đã verify |

---

## 12. Nguồn dữ liệu — Tóm tắt

| Nguồn | Auth | Coverage | Client |
|---|---|---|---|
| Findicator — Macro | JWT Bearer | 107 hàng hoá + 100+ vĩ mô series (macroItemId=35/47-55/96/97/115/119/125/134/139) | `findicator_api.py` |
| Findicator — Macro Custom | JWT Bearer | 55 items US/Global: PPI/PCE/NFP/Thất nghiệp/XNK TQ/Bond | `findicator_api.py` |
| Findicator — Macro Bond | JWT Bearer | macroItemId=54: 22 series yield TPCP VN+US+EU+Asia | `findicator_api.py` |
| Findicator — Macro OMO | JWT Bearer | macroItemId=50: 8 series OMO NHNN | `findicator_api.py` |
| Findicator — Macro FX Reserves | JWT Bearer | macroItemId=55: dự trữ ngoại hối VN monthly | `findicator_api.py` |
| Findicator — Sector | Public | 19 ngành có dashboard; 8 ngành không có dashboard (nhựa/BH/dầu khí/vàng/cà phê/gỗ/dược/logistics/lúa gạo/hồ tiêu/công nghệ) dùng COMDTY + enterprise + WiChart | `findicator_api.py` |
| Findicator — Enterprise | Mixed | BCTC 5 bảng, OHLCV, valuation, analyst reports, waterfall | `findicator_api.py` |
| Findicator — Bank | Public | Credit growth, CASA/NPL, cấu trúc TS/TN, deposit rate | `findicator_api.py` |
| Findicator — Overview | Public | 66 live prices snapshot + 7 tabs global macro | `findicator_api.py` |
| WiChart | Public | 12 giá hàng hoá (thép/vàng/cà phê/**lua/tieu**/cao_su stale/xi_mang stale/heo hơi/phân urê/đường/xăng dầu) + 6 macro (**lslnh** PRIMARY cho VNIBOR, gdp/cpi/iip/fdi/dhtg). Không có filter time — frontend tự cắt theo timestamp_ms | `wichart_api.py` |
| FireAnt | — | Tin tức per-ticker | `fireant_api.py` |

---

## 13. Enterprise endpoints dùng chung cho mọi ngành

| Endpoint | Dữ liệu | Dùng ở đâu |
|---|---|---|
| `enterprise/report-analysis?ticket=` | Analyst reports: recommend/upside/targetPrice (99+ bản/ticker) | Khối E mọi ngành |
| `enterprise/manufactoring-revenue-to-profit-ratio` | Waterfall DT→LNST 11 bước per quý | Thay thế/bổ sung Khối F |
| `enterprise/manufactoring-revenue?year=All&ticket=&period=quarter` | Doanh thu per quý per-DN (series đơn giản) ✅ HAR confirmed | Khối F chart DT |
| `enterprise/manufactoring-profit-after-tax?year=All&ticket=&period=quarter` | LNST per quý per-DN ✅ HAR confirmed | Khối F chart LNST |
| `enterprise/corp-list` | Toàn bộ DN niêm yết VN (~930KB) ✅ HAR confirmed | Lookup ticker/corpType |
| `enterprise/corp-search?corpText=` | Tìm kiếm DN theo tên ✅ HAR confirmed | Search feature Phase 5 |
| `enterprise/stock-ohlc?symbol=` | OHLCV daily từ 2007 | Khối E giá + volume |
| `enterprise/overview-valuation?ticket=` | PE/PB daily từ 2015 (accountIds=39,40,154,155) | Khối E valuation chart |
| `enterprise/report-data-prediction?ticket=` | OHLCV 3 năm + dự báo `{minPrice, maxPrice, averagePrice}` (VNĐ). ✅ verify 2026-05-24 | Khối E price forecast range |
| `enterprise/overview-dividend?year=All&ticket=` | Lịch sử cổ tức `{year, type, value}`. type=1=tiền mặt(%), type=2=cổ phiếu(%). ✅ verify 2026-05-24 | Khối E dividend history |
| `enterprise/overview-shareholder?ticket=` | Cổ đông lớn `{name, created_date, ratio%}`. ✅ verify 2026-05-24 | Khối E ownership |
| `enterprise/corp-profile?ticket=` | Snapshot realtime + mô tả DN: `{closePrice, pe, pb, marketCap, evEbitda, eps, bvps, overview, website}`. PUBLIC. ✅ verify 2026-05-24 | Khối E KPI card |
| `enterprise/stock-revenue?ticket=&period=quarter&year=` | DT CTCK: type 1=môi giới/2=tự doanh/3=TPDN/4=phái sinh/5=dịch vụ. ✅ verify 2026-05-24 | Chứng khoán Khối C |
| `overview/legend` | 66 live prices (currency/bond/comdty/stock/crypto) với %change | Header bar macro dashboard |
| `overview/overview-data?tabId=1` | Lãi suất global (7 tabs: lãi suất/lạm phát/thất nghiệp/PMI...) | Macro dashboard tabs |
| `overview/overview-data?tabId=5` | Vĩ mô VN: GDP/FDI/tín dụng/CPI/PMI/lãi suất NHNN (nameId 1-11, 66-69). ✅ verify 2026-05-24 | Macro dashboard VN tab |
| `overview/overview-data?tabId=6` | XK VN YoY per ngành: thủy sản/xi măng/hóa chất/phân bón/cao su/gỗ/dệt may/thép/electronics (16 nameIds). ✅ verify 2026-05-24 | Mỗi ngành XK |
| `overview/overview-data?tabId=7` | NK VN YoY per nhóm: hóa chất/nhựa/vải/thép/electronics (11 nameIds). ✅ verify 2026-05-24 | Ngành nhựa/dệt may/thép |
| `enterprise/bank-profit-after-tax?ticket=&period=quarter&year=5Y` | LNST per quý per-NH (20 rows, VCB Q1/2026=9.46T VNĐ). **Verify 2026-05-24** | Ngân hàng — Khối F chart LNST |
| `enterprise/bank-bad-debt-ratio?ticket=&period=quarter&year=5Y` | Nợ xấu nhóm 1 vs nhóm 2+ time series per quý | Ngân hàng — Khối F nâng cao |
| `enterprise/bank-loan-over-time?ticket=&period=quarter&year=5Y` | Phân kỳ hạn vay (ngắn/trung/dài) per quý | Ngân hàng — Khối F nâng cao |
| `enterprise/bank-client-debt?ticket=&period=quarter&year=5Y` | Phân loại dư nợ khách hàng per quý | Ngân hàng — Khác F nâng cao |
| `enterprise/bank-debt?ticket=&period=quarter&year=5Y` | Cấu trúc nợ phải trả (type 1-5), 100 rows, VND tuyệt đối. **Verify 2026-05-24** | Ngân hàng — Khối F nâng cao |
| `enterprise/overview-valuation?ticket=&accountIds=154,155` | PE/PB forward (consensus analyst) — **corpType=4 only** | Khối E ngành SX/BĐS/logistics/công nghệ/lúa gạo |
| **TRAILING accountId=48** (tiền mặt ròng) | `finance-ticket-data?tableName=TRAILING` accountId=48. **Verify 2026-05-24**: HPG=-54,894 tỷ / GAS=+36,893 tỷ / KBC=-15,796 tỷ / PVS=+14,691 tỷ VNĐ | Khối E mọi ngành SX — net cash position |
| **CASH_FLOW_DIRECT** corpType=4 (28 items) | `finance-label?corpType=4&tableName=CASH_FLOW_DIRECT`. Key: 53=Tiền thu bán hàng, 54=Chi NCC, 55=Chi lương, 56=Lãi vay đã trả, 57=Thuế TNDN nộp, 61=**Net OCF**. **Verify 2026-05-24** | Khối F thép/BĐS/KCN |
| **CASH_FLOW_INDIRECT** corpType=4 (39 items) | `finance-label?corpType=4&tableName=CASH_FLOW_INDIRECT`. Key: 2=LNTT, 4=Khấu hao, 61=Net OCF. **Verify 2026-05-24** | Khối F ngành SX |
| **CASH_FLOW_DIRECT** corpType=1 (47 items) | `finance-label?corpType=1&tableName=CASH_FLOW_DIRECT`. Key: 2=Thu lãi nhận được, 3=Chi lãi đã trả, 4=DT dịch vụ, 5=KD ngoại tệ/CK. **Verify 2026-05-24** | Khối F ngân hàng |
| `stock/vn-interest-value?macroIds={g}-{n}&year=5Y` | Lãi suất huy động per-NH (15 entries từ metadata) | Ngân hàng — Khối C nâng cao |
| `stock/enterprise-stock-asset?ticket=SSI&year=5Y` | Cơ cấu tài sản per-CTCK | Chứng khoán Khối C |
| `stock/enterprise-stock-debt?ticket=SSI&year=5Y` | Cơ cấu nguồn vốn per-CTCK | Chứng khoán Khối C |
| `stock/money-flow?nameId=1\|2&period=month_value&year=1Y` | Dòng tiền ròng TTCK (nameId≥3 → empty) | Chứng khoán Khối B |
| **sstock** `chart/bank/loan-structure-by-quality?mack=VCB` | Cơ cấu dư nợ theo chất lượng (42 rows). ⚠ Response key = **`balanceSheetInfo`** (khác `data` của loan-by-sector). **Verify 2026-05-24** | Ngân hàng — Khối F chất lượng tín dụng |
| **sstock** `chart/stock/stock-comparison?macks=VCB,BID&period=1D` | So sánh giá cổ phiếu theo period (1D/1W/1M/3M/6M/1Y/3Y). **Verify 2026-05-24** | Khối E so sánh peer |
| **sstock** `financial-report/event-adj?mack=VCB&limit=10` | Lịch sử sự kiện điều chỉnh giá (chia cổ tức/tách CP). **Verify 2026-05-24** | Khối E giá điều chỉnh |
| **sstock** `sectors/list` | Danh sách ngành + tickers per ngành (JSON flat). **Verify 2026-05-24** | Lookup ticker → ngành cho corp-list |

---

*Tài liệu cập nhật lần cuối: 2026-05-24 (v1.4) — test API thực tế, 23 bổ sung + 1 bug fix:*

**v1.3 (earlier 2026-05-24):**
- *BUG FIX: Bank TRAILING accountIds sai (ROE 131→67, ROA 132→68, PE 144→89, PB 145→90)*
- *Gas tanker 316-319 (ETH/SR/COASTER Asia/Europe) xác nhận có data*
- *steel/demand-export-status + enterprise-domestic-market-share wire vào §5.1*
- *enterprise/bank-debt (type 1-5) + bank/bank-list wire vào §5.2 và §13*
- *IS corpType=2 Bảo hiểm đầy đủ 38 items (accountId 125-193) wire vào §5.18*
- *PMI global tabId=4 nameId mapping (34=CN/36=DE/44=US/45=VN/49=Euro) wire vào §5.10/§5.11/§5.13/§6*
- *macroItemId=76 US Labor nameIds (2=thất nghiệp%/3=NFP/5=ADP/6=jobless claims) wire vào §6*
- *TRAILING accountId=48 net cash confirm (HPG=-54,894/GAS=+36,893/KBC=-15,796 tỷ) vào §13*
- *CASH_FLOW_DIRECT/INDIRECT label tables (28/39/47 items) vào §13*
- *Xác nhận không có VNFIN/VNMAT/VNHEAL/VNREAL/VNUTIL trên Findicator*
- *macroItemId=134 dim table đầy đủ 13 items*

**v1.4 (2026-05-24 — đợt 2):**
- *§4b Working Capital KPIs: TRAILING accountId 13/14/16/17/24/49/50/164-167 table + HPG Q1/2026 sample*
- *§4b Per-chart time buttons: macroItemId=9/10 (yoy-only), 107/112 (lag badges), 30 (vận tải), sstock*
- *§4b Data staleness badges: macroItemId=107 (lag 13M), 112 (lag 5M), nameId=322/341 (0 rows❌)*
- *§5.2 Ngân hàng Khối B: M2 VN nameId=1/period=month/yoy; cán cân thanh toán nameId=1+40*
- *§5.2 Bank charts: loan-structure-by-quality (key=balanceSheetInfo, 42 rows) + bank-profit-after-tax (20 rows)*
- *§5.9 Hoá chất Khối A: NaOH TQ Spot sstock exact name + 1716 rows*
- *§5.12 BĐS: lãi suất macroItemId=48 nameId=6(12M)/9(24M)/10(36M⚠data→08/2024); dedup BĐS TQ rows*
- *§5.13 Vận tải: MR/VLCC 0 rows → xoá khỏi API string; Handysize(311) thêm; Aframax(339)/Suezmax(340) xác nhận có data (verify 2026-05-24)*
- *§5.18 Bảo hiểm: loss ratio / expense ratio / combined ratio table (accountId=143/132/176)*
- *§6 Macro: PPI VN (macroItemId=10, yoy-only) + M2 VN (macroItemId=46, nameId=1)*
- *§6 Macro: tabId=5 nameId=66-69 fix (LS huy động/VNIBOR-FFR, không phải NHNN policy rates)*
- *§11 Gaps: 12 entries mới (MR/VLCC/Aframax/NaOH/bank-profit-after-tax/loan-quality-key/tabId=5/M2/PPI...)*
- *§13 Enterprise: bank-profit-after-tax + sstock (loan-quality/stock-comparison/event-adj/sectors/list)*
