# Tài liệu API sstock.vn (Reverse-engineered)

> Cập nhật: 2026-05-16  
> Nguồn: https://sstock.vn/phan-tich-nhanh-co-phieu/VCB?tab=phan-tich-co-ban&sub=dong-luc-tang-truong

## 1. Tổng quan

sstock.vn dùng **Next.js App Router + Turbopack**, backend framework **Hono RPC**.

| Thành phần | Giá trị |
|---|---|
| Base URL | `https://api-feature.sstock.vn` |
| Prefix | `/api/v1` |
| Auth | `better-auth` session cookie (`credentials: "include"`) |
| Client factory | `honoClient(path)` → `https://api-feature.sstock.vn/api/v1{path}` |

**Auth endpoint thực sự:** `https://api-feature.sstock.vn/api/v1/better-auth` (không phải `/api/auth` mặc định của `better-auth`)

**⚠️ Quirk quan trọng:** Tham số năm PHẢI đảo ngược — `startYear` > `endYear`. Ví dụ: `startYear=2026&endYear=2020` mới trả về dữ liệu. Dùng đúng thứ tự (start < end) → trả về mảng rỗng.

**Đăng nhập bằng Python:**
```python
import requests

session = requests.Session()
session.post(
    "https://api-feature.sstock.vn/api/v1/better-auth/sign-in/username",
    json={"username": "Trum_Cung", "password": "trieuphu123"},
    headers={"Origin": "https://sstock.vn"}
)
# Sau đó session.cookies đã có đủ __Secure-better-auth.session_token
```

---

## 2. Danh sách client và base path

| Client name | honoClient path | Full base URL |
|---|---|---|
| `financialReportClient` | `/financial-report` | `https://api-feature.sstock.vn/api/v1/financial-report` |
| `financialIndicatorClient` | `/indicators` | `https://api-feature.sstock.vn/api/v1/indicators` |
| `companyClient` | `/company` | `https://api-feature.sstock.vn/api/v1/company` |
| `marketClient` | `/market` | `https://api-feature.sstock.vn/api/v1/market` |
| `priceClient` | `/prices` | `https://api-feature.sstock.vn/api/v1/prices` |
| `sectorClient` | `/sectors` | `https://api-feature.sstock.vn/api/v1/sectors` |
| `watchlistClient` | `/watchlist` | `https://api-feature.sstock.vn/api/v1/watchlist` |
| `settingClient` | `/settings` | `https://api-feature.sstock.vn/api/v1/settings` |
| `tradingViewClient` | `/trading-view` | `https://api-feature.sstock.vn/api/v1/trading-view` |
| `analysisReportClient` | `/analysis-report` | `https://api-feature.sstock.vn/api/v1/analysis-report` |
| `chartClient` | `/chart` | `https://api-feature.sstock.vn/api/v1/chart` |
| `eventClient` | `/event` | `https://api-feature.sstock.vn/api/v1/event` |
| `eventAdjClient` | `/event-adj` | `https://api-feature.sstock.vn/api/v1/event-adj` |
| `stockmapClient` | `/stockmap` | `https://api-feature.sstock.vn/api/v1/stockmap` |

---

## 3. Endpoints bank chart — `chartClient`

> **Tất cả endpoint chart/bank/* đều yêu cầu: `startYear=CURRENT_YEAR&endYear=EARLIEST_YEAR` (ngược chiều)**  
> Schema mỗi record: `{mackCompany, year, quarter, value, category, row}`

### 3.1 NPL / Nợ xấu — `/api/v1/chart/bank/rate-bad-debt`

```
GET /api/v1/chart/bank/rate-bad-debt?mack={TICKER}&startYear=2026&endYear=2020&quarter={0-4}
```

Array key: `presentationInfo`

| Row | Tên chỉ tiêu | Dùng để tính |
|---|---|---|
| 27 | Dư nợ theo chất lượng nợ cho vay (tổng) | Mẫu số NPL |
| 28 | Nợ cần chú ý (Watch loans) | — |
| 30 | Nợ dưới tiêu chuẩn | NPL nhóm 3 |
| 31 | Nợ nghi ngờ | NPL nhóm 4 |
| 32 | Nợ xấu có khả năng mất vốn | NPL nhóm 5 |
| 16 | Dự phòng rủi ro (LLR) | — |

**Công thức:** `NPL ratio = (row30 + row31 + row32) / row27`

### 3.2 CASA — `/api/v1/chart/bank/deposit-structure`

```
GET /api/v1/chart/bank/deposit-structure?mack={TICKER}&startYear=2026&endYear=2020&quarter={0-4}
```

Array key: `data`

| Row | Tên chỉ tiêu |
|---|---|
| 113 | Tiền gửi không kỳ hạn (CASA — demand deposits) |
| 114 | Tiền gửi tiết kiệm và có kỳ hạn |
| 115 | Tiền gửi vốn chuyên dùng (nếu có) |
| 116 | Tiền gửi ký quỹ (nếu có) |

**Công thức:** `CASA ratio = row113 / (row113 + row114 + row115 + row116)`

### 3.3 NIM — `/api/v1/chart/bank/profitability`

```
GET /api/v1/chart/bank/profitability?mack={TICKER}&startYear=2026&endYear=2020&quarter={0-4}
```

Array keys: `businessResultsInfo` (P&L) + `balanceSheetInfo` (bảng cân đối)

| Row | Tên chỉ tiêu |
|---|---|
| 3 | Thu nhập lãi và các khoản tương đương |
| 4 | Chi phí lãi và các khoản tương đương |
| 5 | I. Thu nhập lãi thuần (= row3 - row4) |
| 6 | Tiền gửi tại NHNN và các TCTD (earning asset) |
| 11 | Chứng khoán kinh doanh (earning asset) |
| 15 | Cho vay khách hàng (earning asset) |
| 17 | Chứng khoán đầu tư (earning asset) |

**Công thức:** `NIM = row5 / (row6 + row11 + row15 + row17)` — annualize nếu dữ liệu quý

### 3.4 CIR — `/api/v1/chart/bank/cost-structure`

```
GET /api/v1/chart/bank/cost-structure?mack={TICKER}&startYear=2026&endYear=2020&quarter={0-4}
```

Array key: `data`

| Row | Tên chỉ tiêu |
|---|---|
| 16 | VIII. Tổng thu nhập hoạt động |
| 17 | IX. Chi phí hoạt động (giá trị âm) |
| 19 | XI. Chi phí dự phòng rủi ro tín dụng |

**Công thức:** `CIR = abs(row17) / row16`

### 3.5 Các endpoint khác

| Endpoint | Array key | Nội dung chính |
|---|---|---|
| `/chart/bank/loan-structure` | `presentationInfo` | Cho vay ngắn/trung/dài hạn (row 35/36/37) |
| `/chart/bank/loan-structure-by-quality` | `data` | Phân loại nợ theo chất lượng (thêm Nợ đủ tiêu chuẩn row 28) |
| `/chart/bank/loan-structure-by-sector` | `data` | Dư nợ theo ngành kinh tế (annual only, cần `&year=2025`). **Verify 2026-05-24**: VCB 2024 → 18 rows: CN chế biến=338,807 tỷ / Bán buôn-lẻ / BĐS / Nông lâm / v.v. Key=`data`. Quirk: `startYear > endYear` |
| `/chart/bank/loan-structure-by-type` | `presentationInfo` | Dư nợ theo loại KH (annual only). **Verify 2026-05-24**: VCB 2024 → 13 rows: Cá nhân+HKD=640,003 tỷ / CTCP/TNHH=224,940 tỷ / DN FDI=147,778 tỷ / DNNN=96,605 tỷ. Key=`presentationInfo` (khác `data`!). |
| `/chart/bank/asset` | `data` | Tổng tài sản và phân bổ (row 3 = total) |
| `/chart/bank/capital` | `data` | Vốn CSH (row 60), vốn điều lệ (row 62) |
| `/chart/bank/business-results` | `data` | Tổng thu nhập HĐ (row 16), LNST (row 26) |
| `/chart/bank/profit-performance` | `businessResultsInfo` + `balanceSheetInfo` | ROA/ROE source: row 24 (LNST), row 3 (TTS), row 60 (VCSH) |

**Lưu ý:** `loan-structure-by-sector` và `loan-structure-by-type` là annual-only, không có dữ liệu quý. Cần thêm `&year=2025` (năm gần nhất có dữ liệu).

### 3.6 Chứng khoán & Bảo hiểm — KHÔNG có endpoint tỷ lệ tính sẵn (dò 2026-05-22)

Đã dò toàn bộ family `chart/securities|security|sec|broker|brokerage/*` → **404 hết**. Family **`chart/stock/*`** (CK) và **`chart/insurance/*`** (BH) CÓ tồn tại nhưng chỉ trả 4 endpoint `business-results / asset / capital / profit-performance` — **chỉ là dòng CĐKT/KQKD thô**, KHÔNG tính sẵn tỷ lệ như `chart/bank/*` (NPL/CASA/NIM/CIR).

→ **Kết luận: 2 family này gần như vô dụng** vì `/financial-report/*` (BCTC chuẩn) đã trả đầy đủ và chi tiết hơn cùng định dạng ngành:
- **CK (VND/SSI)**: BCTC chuẩn có sẵn `Các khoản cho vay` (margin), `FVTPL`, `HTM`, `AFS`, doanh thu môi giới/lãi margin/tự doanh/lưu ký/IB.
- **BH (BVH/BMI)**: BCTC chuẩn có sẵn `Doanh thu phí bảo hiểm` gốc/thuần, `Dự phòng nghiệp vụ Bảo Hiểm`, `Chi bồi thường`, `Lợi nhuận hoạt động tài chính`, danh mục đầu tư.

→ KPI chuyên ngành CK/BH được **tự tính từ BCTC chuẩn** trong `stock_collector.py` (`compute_securities_kpis` / `compute_insurance_kpis` → Mục 11). Dòng chi phí BCTC lưu **giá trị âm** → loss ratio/combined ratio phải `abs()`.

---

### 3.7 Dữ liệu ngành (Tác động ngành) — `/chart/general-data-series` (auth-gated, 2026-05-22)

```
GET /api/v1/chart/general-data-series?dataSeriesNames=<name1>&dataSeriesNames=<name2>...
```

**Auth:** Bắt buộc session cookie (`better-auth`). Gọi không có cookie → trả `dataSeriesValuesInfo: {}` rỗng.

**Response:**
```json
{
  "dataSeriesInfo": [
    {"id": 11721, "name": "Hàng hóa thế giới - Thép HRC Trung Quốc (Spot)",
     "dateUnit": "Date", "dataUnit": "CNY/tấn"}
  ],
  "dataSeriesValuesInfo": {
    "Hàng hóa thế giới - Thép HRC Trung Quốc (Spot)": [
      {"id": 44928681, "date": "2026-05-22", "value": 3414, "idDataSeries": 11721},
      ...
    ]
  }
}
```

- **Lấy nhiều series 1 request:** pass nhiều `dataSeriesNames` → 1 call
- **Dữ liệu:** sorted newest-first; daily series ~2.000–2.800 pts (~7–8 năm); weekly ~400–500 pts; monthly ~160–210 pts
- **Tham số tên:** EXACT string, phân biệt hoa/thường, có dấu

**Discovery tool:** `collector/sector_har_discovery.py` — tự động extract series names từ HAR file:
```
py -3.12 collector/sector_har_discovery.py parse <file.har> --sector <slug>
py -3.12 collector/sector_har_discovery.py list-sectors   # 42 ngành
py -3.12 collector/sector_har_discovery.py verify <slug>  # live test
```

**Pool đầy đủ — 60 series confirm từ JS bundle `0ukpj.o32z-qy.js` (2026-05-22):**

| Sector slug | Series name | Đơn vị | Tần suất |
|---|---|---|---|
| **steel** (10) | Thép HRC TQ (Spot) / Quặng sắt TQ / Than cốc TQ / Thép CB300 D10 (nội địa) / Thép cán / Sắt thép thô / Thép thanh thép góc / XK sắt thép / XK SP sắt thép / Giá XK sắt thép | CNY–VND–USD | daily/monthly |
| **fertilizer** (10) | Ure TQ Spot/Future / Ure TĐ Future / DAP Hoa Kỳ Future / Kali clorua TQ / Ure Phú Mỹ/Cà Mau (nội địa) / DAP ĐV xanh (nội địa) / XK phân bón / Giá XK phân bón | CNY–USD–VND | daily/weekly/monthly |
| **textile** (8) | XK xơ sợi / XK hàng dệt may / Sợi cotton TQ Future / Polyester FDY/DTY/POY TQ / NK bông / NK vải | CNY–USD | daily/monthly |
| **van_tai_bien** (9) | WCI container / Giá thuê tàu container / BDI hàng rời / BDTI dầu thô / BCTI dầu TP / Aframax / Supramax / VLGC / WTI | Index–USD | daily/weekly |
| **seafood** (4) | Tôm thẻ 50c/kg Cà Mau / Tôm sú 20c/kg Cà Mau / Cá tra / XK thủy sản | VND–USD | daily/monthly |
| **hoa_chat** (4) | NaOH TQ Spot / Phốt pho vàng TQ / XK hoá chất / XK SP hoá chất | CNY–USD | daily/monthly |
| **nhua** (6) | `Hàng hóa trong nước (tháng) - Ống nhựa 27 x 1.8mm` / `Ống nhựa 60 x 2mm` / `Ống nhựa 90 x 2,9mm` (Nghìn VNĐ/m, monthly) + PET TQ Spot / Khí TN HK Future / Dầu WTI | VND–CNY–USD | monthly/daily |
| **duong** (2) | `Hàng hóa thế giới - Đường mía Hoa Kỳ (Future)` (US¢/lb, weekly) + `Số liệu sản phẩm công nghiệp - Đường kính` (Nghìn tấn, monthly) | US¢–kT | weekly/monthly |
| **chan_nuoi** (4) | `Hàng hóa trong nước (ngày) - Heo hơi` (Nghìn VNĐ/kg) + Ngô TQ Spot + Đậu nành TQ Spot + Khí TN HK | VND–CNY–USD | daily |
| **aviation** (1 proxy) | `Nhập khẩu theo mặt hàng - Xăng dầu các loại - Tổng nhập khẩu các quốc gia` (Triệu USD, monthly) — proxy chi phí nhiên liệu bay | USD | monthly |
| **cao_su** (3) | XK cao su / XK SP từ cao su / Giá XK cao su | USD | monthly |
| Tất cả ngành còn lại | xem `SSTOCK_SECTOR_SERIES` trong `collector/stock_collector.py` (~line 1225) | — | — |

**Endpoint này cũng dùng cho thị phần giao dịch CK:**
```
GET /chart/general-data-series?dataSeriesNames=Thị phần giao dịch - {TICKER}
```
→ trả thị phần theo quý cho top-10 CTCK (SSI/VPS/TCBS/VCI/HCM/MBS/VND/MAS/KIS/FTS).

**Cập nhật "không tìm được" (2026-05-22):** XK thủy sản ✅ tìm được. Phân urê nội địa ✅ tìm được. Cước container/BDI ✅ tìm được.

**Verify 2026-05-24 — Tên series phải EXACT (phân biệt hoa/thường, có dấu):**
- Ống nhựa VN ✅: `"Hàng hóa trong nước (tháng) - Ống nhựa 27 x 1.8mm"` (tên ngắn "Ống nhựa 27mm" → NOT FOUND)
- Đường mía ✅: `"Hàng hóa thế giới - Đường mía Hoa Kỳ (Future)"` (tên ngắn "Đường mía Hoa Kỳ Future" → NOT FOUND)
- Cà phê Robusta ICE Future ❌: không có series nào (Findicator nameId=95 Arabica + nameId=687 VN spot là nguồn tốt hơn)
- Jet Fuel / Xăng máy bay ❌: không có — dùng nameId=623 `Dầu hỏa vùng 1 VN` (Findicator) + sstock proxy `"Nhập khẩu - Xăng dầu các loại"`
- Thị phần giao dịch ✅: `"Thị phần giao dịch - SSI"` (quarterly, 25 pts, 2020-Q1→2026-Q1) — xem §3.7 Khối Thị Phần dưới
- Còn lại không có API trực tiếp: giá xăng A95 VN (→ WiChart `xang_dau`), GDP/IIP/FDI (→ WiChart key=tien_te)
- Ngành ngan_hang/chung_khoan/bao_hiem dùng auth-endpoint riêng (§3.5/§3.6), không phải general-data-series.

---

## 4. Endpoints tài chính — `financialReportClient`

> **CẬP NHẬT 2026-05-16:** DB ĐÃ CÓ DỮ LIỆU. Endpoint giờ trả về đầy đủ — đây là nguồn BCTC chính, thay thế Vnstock.

```
GET /api/v1/financial-report/business-result
    ?mack={TICKER}&startYear={YYYY}&endYear={YYYY}&quarter={1-4|0}

GET /api/v1/financial-report/balance-sheet
    ?mack={TICKER}&startYear={YYYY}&endYear={YYYY}&quarter={1-4|0}

GET /api/v1/financial-report/cash-flow-statement
    ?mack={TICKER}&startYear={YYYY}&endYear={YYYY}&quarter={1-4|0}
```

Tham số:
- `mack`: mã cổ phiếu (vd `FPT`, `VCB`)
- `startYear` / `endYear`: **vẫn quirk đảo ngược** — `startYear > endYear` (vd `startYear=2026&endYear=2020`)
- `quarter`: `0` = số liệu cả năm, `1`–`4` = số liệu quý

Response:
```json
{
  "status": 1, "message": "Ok",
  "data": [
    {"mackCompany": "FPT", "year": 2025, "quarter": 0,
     "value": 70207688945000,
     "category": "1. Doanh thu bán hàng và cung cấp dịch vụ (đồng) (Y)",
     "row": 3},
    ...
  ]
}
```

Mỗi record gắn 1 chỉ tiêu × 1 kỳ. Khi pivot thành DataFrame: `index=category`, `columns=period`, `values=value`. Giá trị **VND gốc** (chia `1e9` ra tỷ). Pivot helper tham khảo `_pivot_financial()` trong `collector/stock_collector.py`.

### 4.1 Cấu trúc category

- KQKD (`business-result`): ~25 dòng, đánh số "1.", "2." trong tên category
- CĐKT (`balance-sheet`): ~66–113 dòng tùy ngành (bank ngắn hơn), nhóm theo A/B/I/II/III…
- LCTT (`cash-flow-statement`): ~43–46 dòng

Suffix `(Y)` trong category = số liệu năm (yearly); với quarter > 0 thì suffix là `(Q1)`/`(Q2)`/...

---

## 4.5 Company profile + cổ đông + ban lãnh đạo + công ty con — `companyClient`

> Phát hiện 2026-05-16. **MỘT** request trả về thông tin DN đầy đủ + 78+ cổ đông lớn + 16+ ban lãnh đạo + danh sách công ty con.

```
GET /api/v1/company/company-profile?symbol={TICKER}
```

Response: `{"companyProfile": { ... }}` với các trường:

**Thông tin DN cơ bản:**
- `aboutCompany` (giới thiệu dài), `businessLine`, `businessProspect`, `history` (HTML)
- `address`, `tel`, `fax`, `email`, `website`
- `foundingDate`, `listedDate`, `initialExchange` (HSX/HNX/UPCoM)
- `charterCapital` (VND), `listingVolume` (CP), `initialPrice`, `firstDayPrice`, `initialVolume`
- `numberOfEmployees`, `numberOfBranches`, `numberOfSubCompanies`
- `legalRepresentative` (người đại diện pháp luật / CEO)
- `taxCode`, `icbCode`, `compTypeCode` (Bank/Securities/General/…)
- `lastIssuedDate`

**Cơ cấu sở hữu:**
- `foreignmentOwnership_Ratio`, `govermentOwnership_Ratio`, `otherOwnership_Ratio` (giá trị 0-1)

**`majorShareHolders[]`** (~78 records cho VCB):
```json
{"name": "Ngân hàng Nhà nước Việt Nam", "ownership": 0.7480,
 "shares": 6250338579, "isIndividual": false, "isForeign": false,
 "updatedDate": "2025-12-31T00:00:00", "avatar": "...", "id": ...}
```

**`leaderships[]`** (~16 records):
```json
{"name": "...", "position": "Chủ tịch HĐQT", "positionEn": "Chairman",
 "age": 56, "gender": "Male", "dateOfBirth": "...",
 "homeTown": "...", "educationStr": "...", "bio": "...", "avatar": "...", "id": ...}
```

**`subCompanies[]`**: danh sách công ty con (fields tùy ngành).

### Tham số `symbol` (không phải `mack`)

```python
data = session.get(
    f"{BASE}/api/v1/company/company-profile",
    params={"symbol": "FPT"},
).json()["companyProfile"]
shareholders = data["majorShareHolders"]
leaders      = data["leaderships"]
subs         = data["subCompanies"]
```

---

## 4.6 Sự kiện DN — `eventClient`

```
GET /api/v1/event?symbol={TICKER}
```

Response: `{"items": [...], "totalCount": N, "message": "..."}`. Mỗi item có `actionTypeName`, `publicDate`, `exDate`, `content`, `rate`, `attachment`...

## 4.7 Sự kiện điều chỉnh giá (cổ tức, chia tách) — `eventAdjClient`

```
GET /api/v1/event-adj?symbol={TICKER}&typeIds=1,2,3,4,5
```

Tham số `typeIds` BẮT BUỘC. Response giống `eventClient`. Dùng để dựng lịch sử cổ tức/chia tách (phục vụ "lịch sử tăng vốn").

## 4.8 Báo cáo phân tích & tin tức — `analysisReportClient`

```
GET /api/v1/analysis-report?symbol={TICKER}
```

Response: `{"items": [...]}` — báo cáo phân tích CTCK. Fields thực (verified 2026-05-16):

| Field | Mô tả |
|---|---|
| `id` | ID nội bộ |
| `symbol` | Mã CK |
| `reportDate` | Ngày phát hành báo cáo (ISO datetime) |
| `reporter` | Tên CTCK (vd "PHS", "SSV", "NHSV", "VPS", "VFS", "VikkiBankS"…) |
| `title` | Tiêu đề báo cáo — thường chứa khuyến nghị + giá mục tiêu |
| `content` | Tóm tắt nội dung (text/HTML) — chứa **giá mục tiêu + khuyến nghị + giả định định giá** |
| `attachment` | Link PDF (cdn.fialda.com) |
| `type` | Loại: `4` = báo cáo full, các giá trị khác = TA / cập nhật ngắn |
| `lastModificationTime` | Lần update gần nhất |

> **KHÔNG có field `targetPrice`/`rating`/`source`/`summary`/`publishedDate` riêng** — phải parse từ `title + content`:
> - Giá mục tiêu: regex `giá (mục tiêu|hợp lý)\s*[:=]?\s*([\d.,]+)`
> - Khuyến nghị: keyword `MUA / TĂNG TỶ TRỌNG / TÍCH LŨY / NẮM GIỮ / GIẢM / BÁN`
> - Loại bỏ TA: keyword "Phân tích kỹ thuật / RSI / MA / phân kỳ" trong title

## 4.9 Lịch sử giá OHLCV — `priceClient`

```
GET /api/v1/prices/history?symbol={TICKER}&from=YYYY-MM-DD&to=YYYY-MM-DD
```

Tham số ngày dùng định dạng `YYYY-MM-DD` (đã thử unix timestamp → 500). Response là **list trực tiếp** (không có wrapper `data`), mỗi phần tử:
```json
{"id": ..., "symbol": "FPT", "time": ..., "open": ..., "high": ..., "low": ..., "close": ..., "volume": ...}
```

## 4.10 Hiệu suất giá (% thay đổi) — `companyClient["stock-comparison"]`

```
GET /api/v1/company/stock-comparison?symbol={TICKER}
```

Response: `{"stockComparison": {"symbol": ..., "currentPrice": ..., "changes": {"1D": ..., "1W": ..., "1M": ..., "3M": ..., "6M": ..., "1Y": ..., "3Y": ...}}}`. **CHỈ trả về của CHÍNH mã đang query** — không phải peer comparison.

## 4.11 Danh sách sector — `sectorClient`

```
GET /api/v1/sectors/list?mack={TICKER}
```

Response: `{"sectors": [{"sectorName": ..., "sectorId": ..., "sectorUrlShort": ..., "stockCount": ...}]}` — toàn bộ ngành. Tham số `mack` chấp nhận nhưng không lọc theo mã (vẫn trả tất cả).

---

## 5. Chỉ số tổng hợp — `financialIndicatorClient`

```
GET /api/v1/indicators/single?mackCompany={TICKER}
```

**Trả về:**

```json
{
  "data": {
    "mackCompany": "VCB",
    "pe": 14.11,
    "pb": 2.19,
    "eps": 4301.03,
    "sharesOutstanding": 8355675094,
    "ps": 4.09,
    "roe": 16.38,
    "roa": 1.54,
    "car": 0.1139,
    "currentRoom": 835014660,
    "auditFirm": "EY",
    "refPrice": 61,
    "marketCap": 507189478206,
    "updatedAt": "2026-05-15 16:35:28"
  }
}
```

**Điểm độc đáo:** Có trường `car` (CAR — hệ số an toàn vốn) và `auditFirm` không có ở Vnstock free.

### 5.1 Chi tiết trường `auditFirm` — Đơn vị Kiểm toán

Trả về tên công ty kiểm toán, dùng cho mục "Thông tin kiểm toán (Big4 / ngoại trừ)" trong phân tích FA.

```python
resp = session.get(
    "https://api-feature.sstock.vn/api/v1/indicators/single",
    params={"mackCompany": ticker},
)
audit_firm = resp.json()["data"].get("auditFirm")  # VD: "EY", "PwC", "Deloitte", "KPMG"
```

**Phân loại Big4:**
```python
BIG4 = {"Deloitte", "PwC", "EY", "KPMG", "Ernst & Young", "PricewaterhouseCoopers"}
is_big4 = any(b.lower() in (audit_firm or "").lower() for b in BIG4)
```

**Lưu ý `ngoại trừ` (qualified opinion):** Không có trường này trong API. Cần kiểm tra thủ công từ BCTC (báo cáo kiểm toán đính kèm). Nếu kiểm toán viên đưa ra ý kiến có ngoại trừ, sẽ ghi trong phần mở đầu của báo cáo kiểm toán độc lập (thường có chữ "ngoại trừ" / "except for" trong tiêu đề ý kiến).

| Giá trị `auditFirm` phổ biến | Big4? |
|---|---|
| EY / Ernst & Young | ✅ Big4 |
| PwC / PricewaterhouseCoopers | ✅ Big4 |
| Deloitte | ✅ Big4 |
| KPMG | ✅ Big4 |
| AASC / A&C / UHY / BDO / Grant Thornton | ❌ Non-Big4 |

---

## 6. Auth flow

```python
import requests

session = requests.Session()
resp = session.post(
    "https://api-feature.sstock.vn/api/v1/better-auth/sign-in/username",
    json={"username": "Trum_Cung", "password": "trieuphu123"},
    headers={"Origin": "https://sstock.vn"}
)
# resp.status_code == 200 → session.cookies đã có __Secure-better-auth.session_token

# Gọi API bình thường sau đó:
data = session.get(
    "https://api-feature.sstock.vn/api/v1/chart/bank/rate-bad-debt",
    params={"mack": "VCB", "startYear": 2026, "endYear": 2020, "quarter": 0}
).json()
```

---

## 7. So sánh nguồn dữ liệu tổng hợp

> **CẬP NHẬT 2026-05-16:** Đã loại bỏ Vnstock khỏi pipeline (rate limit nặng, ~17 req). Stack hiện tại: **sstock + VDSC**.

| Dữ liệu | sstock.vn | VDSC | Ghi chú |
|---|---|---|---|
| BCTC năm (DT, LNST, CĐKT, LCTT) | ✅ `financial-report/*` quarter=0 | ✅ `/data/financeinfo` | sstock đã có DB |
| BCTC quý | ✅ `financial-report/*` quarter=1-4 | ✅ | sstock đã có DB |
| Chỉ số P/E, P/B, EPS, ROE, ROA | ✅ `indicators/single` | ✅ CSTC | |
| CAR, Audit firm | ✅ `indicators/single` | ❌ | sstock unique |
| NIM, CIR | ✅ `chart/bank/*` | ✅ CSTC | |
| NPL/nợ xấu | ✅ `chart/bank/rate-bad-debt` | ❌ | |
| CASA | ✅ `chart/bank/deposit-structure` | ❌ | |
| KPI chuyên ngành CK (margin, FVTPL, cơ cấu DT) | ⚠️ KHÔNG có endpoint tỷ lệ sẵn | ❌ | Tự tính từ BCTC `/financial-report/*` → §3.6 |
| KPI chuyên ngành BH (loss/combined ratio, DP nghiệp vụ) | ⚠️ KHÔNG có endpoint tỷ lệ sẵn | ❌ | Tự tính từ BCTC `/financial-report/*` → §3.6 |
| Thông tin DN (vốn ĐL, NV, đ/c, CEO, history…) | ✅ `company/company-profile` | ❌ | sstock all-in-one |
| Cổ đông lớn | ✅ companyProfile.majorShareHolders (~78 records) | ❌ | |
| Ban lãnh đạo | ✅ companyProfile.leaderships (~16 records) | ❌ | |
| Công ty con | ✅ companyProfile.subCompanies | ❌ | |
| Sự kiện DN | ✅ `event?symbol=` | ❌ | |
| Sự kiện điều chỉnh giá (cổ tức, split) | ✅ `event-adj?symbol=&typeIds=` | ❌ | |
| Tin tức / báo cáo phân tích CTCK | ✅ `analysis-report?symbol=` | ❌ | |
| Lịch sử giá OHLCV | ✅ `prices/history?symbol=&from=&to=` | ❌ | |
| Hiệu suất giá 1D/1W/1M/3M/6M/1Y/3Y | ✅ `company/stock-comparison?symbol=` | ❌ | KHÔNG phải peer |
| Kế hoạch ĐHCĐ (CTKH) | ❌ | ✅ `/data/financeinfo` CTKH | |
| CSTC ratios (EV/EBITDA, ROCE, days…) | ❌ | ✅ `/data/financeinfo` CSTC | |
| FOL (% NN sở hữu, room) | ⚠️ `currentRoom` (số CP) | ✅ `/data/gettradingresult` | VDSC chính xác hơn |
| ADTV 1M/1Q/1Y | ❌ | ✅ `/data/StatisticByPeriod` | |
| Insider trading | ❌ | ❌ | Cần kiểm tra HOSE/HNX thủ công |
| Peer comparison | ❌ | ❌ | sstock `stock-comparison` chỉ trả của mã đang query |
| ADTV (KLGD/Ngày 1 tháng) | ❌ | ✅ (`StatisticByPeriod` type=M) | ❌ |
| Interest coverage | ❌ | ✅ (CSTC: "Khả năng TT lãi vay") | ❌ |
| Inventory days | ❌ | ✅ (CSTC: "Thời gian tồn kho") | ❌ |
| Receivables days | ❌ | ✅ (CSTC: "Thời gian thu tiền") | ❌ |
| EV/EBITDA | ❌ | ✅ (CSTC BussinessType=1) | ❌ |
| ROCE (proxy ROIC) | ❌ | ✅ (CSTC: "ROCE") | ❌ |
