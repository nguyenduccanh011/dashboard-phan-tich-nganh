# Tài liệu API VDSC (data.vdsc.com.vn) — Dữ liệu tài chính bổ sung

> Bóc tách từ source code trang data.vdsc.com.vn ngày 2026-05-16.  
> Dữ liệu nguồn từ Vietstock, phục vụ bổ sung phần thiếu của Vnstock (kế hoạch ĐHCĐ, chỉ số ngân hàng).

---

## 1. Tổng quan

| Thông tin | Giá trị |
|---|---|
| Base URL | `https://data.vdsc.com.vn` |
| Kiểu request | **POST** (form-urlencoded) |
| Authentication | Session cookie + CSRF token (bắt buộc) |
| Format dữ liệu | JSON |
| Endpoint chính | `POST /data/financeinfo` |

---

## 2. Authentication — Bắt buộc

VDSC yêu cầu 2 điều kiện trước khi gọi API:

### Bước 1: Khởi tạo session

```python
import requests

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "X-Requested-With": "XMLHttpRequest",
})

# GET trang cổ phiếu để lấy cookie session và CSRF token
session.get("https://data.vdsc.com.vn/{SYMBOL}/tai-chinh.htm")
```

### Bước 2: Lấy CSRF token từ cookie

```python
csrf_token = session.cookies.get("__RequestVerificationToken")
```

### Cookies cần có (tự động sau khi GET)

| Cookie | Ý nghĩa |
|---|---|
| `ASP.NET_SessionId` | Session ID |
| `__RequestVerificationToken` | CSRF token (gửi kèm mỗi POST body) |
| `language` | `vi-VN` |

---

## 3. Endpoint chính: `/data/financeinfo`

### 3.1 Thông tin request

```
POST https://data.vdsc.com.vn/data/financeinfo
Content-Type: application/x-www-form-urlencoded
```

### 3.2 Tham số POST body

| Tham số | Bắt buộc | Giá trị | Ý nghĩa |
|---|---|---|---|
| `Code` | ✅ | `NLG`, `VCB`, `FPT`... | Mã cổ phiếu |
| `ReportType` | ✅ | Xem bảng tab codes | Loại báo cáo / tab |
| `ReportTermType` | ✅ | `1` = năm, `2` = quý | Kỳ báo cáo |
| `BussinessType` | ✅ | `1`/`3`/`4`/`5` | Loại hình doanh nghiệp |
| `Unit` | ✅ | `1` | Đơn vị (mặc định 1 = VND gốc) |
| `Page` | ✅ | `1` | Trang (bắt đầu từ 1) |
| `PageSize` | ✅ | `50` | Số rows/trang (khuyến nghị 50) |
| `__RequestVerificationToken` | ✅ | CSRF từ cookie | Chống CSRF |

### 3.3 Tab codes (ReportType)

| Tab | Tên tiếng Việt | Ghi chú |
|---|---|---|
| `BCTT` | Bảng cân đối tổng hợp (Summary) | Tóm tắt toàn bộ |
| `CDKT` | Cân đối kế toán (Balance Sheet) | ~77–143 rows |
| `KQKD` | Kết quả kinh doanh (Income Statement) | ~24–25 rows |
| `LC` | Lưu chuyển tiền tệ (Cash Flow) | ~50 rows |
| `CSTC` | Chỉ số tài chính (Financial Ratios) | ~32–74 rows |
| `CTKH` | Kế hoạch kinh doanh (Financial Plan / ĐHCĐ) | 6 rows |

### 3.4 BussinessType mapping

| Giá trị | Loại doanh nghiệp |
|---|---|
| `1` | Doanh nghiệp thông thường (sản xuất, bán lẻ, BĐS...) |
| `2` | Chứng khoán (CTCK) |
| `3` | Ngân hàng (Bank) |
| `4` | Quỹ đầu tư (Fund) |
| `5` | Bảo hiểm (Insurance) |

**Cách auto-detect BussinessType:** Gọi `financeinfo` với `BussinessType=1` trước. Server trả về `BusinessType` đúng trong `response[0][0].BusinessType`. Nếu khác 1, gọi lại với đúng giá trị.

---

## 4. Cấu trúc Response

### 4.1 Doanh nghiệp thông thường (BussinessType=1)

```json
[
  [                          // array[0]: Danh sách kỳ báo cáo
    {
      "YearPeriod": 2025,
      "TermCode": "N",       // "N"=năm, "Q1"/"Q2"/"Q3"/"Q4"=quý
      "TotalRow": 25,
      "BusinessType": 1
    },
    ...
  ],
  [                          // array[1]: Rows dữ liệu (plain array)
    {
      "Name": "Doanh thu thuần",
      "Value1": 7630000000000,   // Giá trị kỳ mới nhất (cột 1)
      "Value2": 6794000000000,   // Kỳ 2
      "Value3": 6657000000000,   // Kỳ 3
      "Value4": 4836000000000,   // Kỳ 4
      "Padding": "Padding1",     // Indent level
      "CssStyle": "Bold"         // Highlight nếu là tổng
    },
    ...
  ]
]
```

### 4.2 Ngân hàng (BussinessType=3)

```json
[
  [ ...periods... ],          // array[0]: giống trên
  {                           // array[1]: Dict nhóm rows (KHÁC với loại 1)
    "Kết quả kinh doanh": [
      { "Name": "Thu nhập lãi thuần", "Value1": ..., "Value2": ..., "Value3": ..., "Value4": ... },
      ...
    ],
    "Chi phí hoạt động": [ ... ],
    "Lợi nhuận": [ ... ]
  }
]
```

### 4.3 Map kỳ với Value columns

```
periods[0] → YearPeriod=2025 → Value1
periods[1] → YearPeriod=2024 → Value2
periods[2] → YearPeriod=2023 → Value3
periods[3] → YearPeriod=2022 → Value4
```

(Mới nhất = Value1, cũ nhất = Value4)

---

## 5. Ví dụ: Kế hoạch ĐHCĐ (CTKH)

### Request

```python
resp = session.post(
    "https://data.vdsc.com.vn/data/financeinfo",
    data={
        "Code": "NLG",
        "ReportType": "CTKH",
        "ReportTermType": "1",
        "BussinessType": "1",
        "Unit": "1",
        "Page": "1",
        "PageSize": "50",
        "__RequestVerificationToken": csrf_token,
    }
)
```

### Response (NLG 2026–2023)

| Chỉ tiêu | 2026 | 2025 | 2024 | 2023 |
|---|---|---|---|---|
| Doanh thu kế hoạch | 7,630 tỷ | 6,794 tỷ | 6,657 tỷ | 4,836 tỷ |
| Lợi nhuận trước thuế kế hoạch | 0 | 0 | 0 | 0 |
| Lợi nhuận sau thuế kế hoạch | 0 | 0 | 821 tỷ | 919 tỷ |
| Tỷ lệ cổ tức bằng tiền (% VĐL) | 0 | 0 | 0 | 0 |
| Tỷ lệ cổ tức bằng CP (% VĐL) | 0 | 0 | 0 | 0 |
| Tỷ lệ cổ tức (%) | 0 | 0 | 0 | 0 |

> Lưu ý: Giá trị 0 = chưa có hoặc chưa công bố kế hoạch cụ thể.

---

## 6. Ví dụ: Chỉ số ngân hàng (CSTC — VCB)

### Request

```python
resp = session.post(
    "https://data.vdsc.com.vn/data/financeinfo",
    data={
        "Code": "VCB",
        "ReportType": "CSTC",
        "ReportTermType": "1",
        "BussinessType": "3",
        "Unit": "1",
        "Page": "1",
        "PageSize": "50",
        "__RequestVerificationToken": csrf_token,
    }
)
```

### Các chỉ số bank trả về (thực tế từ VCB)

**Nhóm Định giá:**

| Chỉ số | 2025 | 2024 | 2023 | 2022 |
|---|---|---|---|---|
| EPS (4 quý gần nhất) | 6,334 | 6,507 | 6,053 | 4,542 |
| BVPS | 28,663 | 29,524 | 35,106 | 26,875 |
| P/E | 12.63 | 12.34 | 15.07 | 12.66 |
| P/B | 2.79 | 2.72 | 2.60 | 2.14 |
| Tỷ suất cổ tức | 1% | 0% | 0% | 0% |
| Beta | 0.84 | 0.75 | 0.65 | 0.67 |

**Nhóm Sinh lợi:**

| Chỉ số | 2025 | 2024 | 2023 | 2022 |
|---|---|---|---|---|
| ROEA (ROE) | 24.42% | 21.97% | 18.73% | 16.72% |
| ROAA (ROA) | 1.85% | 1.81% | 1.72% | 1.55% |
| NIM | 3.39% | 3.00% | 2.86% | 2.64% |
| CIR | 31.21% | 32.36% | 33.58% | 34.84% |

**Nhóm Tăng trưởng:**

| Chỉ số | 2025 | 2024 | 2023 | 2022 |
|---|---|---|---|---|
| Tăng trưởng LNTT | 35.95% | 10.37% | 2.41% | 4.22% |
| Tăng trưởng tổng tài sản | 28.19% | 1.42% | 13.39% | 17.09% |
| Tăng trưởng dư nợ cho vay | 19.18% | 10.94% | 14.08% | 15.48% |

**Nhóm Thanh khoản:**

| Chỉ số | 2025 | 2024 | 2023 | 2022 |
|---|---|---|---|---|
| LDR (Cho vay/Huy động) | 73.00% | 77.88% | 78.27% | 76.73% |

**Nhóm Chất lượng tài sản:**

| Chỉ số | 2025 | 2024 | 2023 | 2022 |
|---|---|---|---|---|
| Dự phòng RRTD/Tổng dư nợ | -2% | -2% | -2% | -2% |

> Lưu ý: Nợ xấu (NPL), CASA, CAR **không có** trong CSTC VDSC.  
> Nguồn bổ sung: NHNN.gov.vn, FiinPro, báo cáo thường niên của ngân hàng.

---

## 7. Endpoint bổ sung: `/data/financeinfochart`

Dữ liệu chart tổng hợp, ít rows hơn nhưng có dữ liệu theo quý.

```python
resp = session.post(
    "https://data.vdsc.com.vn/data/financeinfochart",
    data={
        "code": "VCB",
        "typeID": "1",   # 1=year, 2=quarter
        "unit": "1",
        "__RequestVerificationToken": csrf_token,
    }
)
```

### Mapping Value fields cho ngân hàng (Type=3)

| Field | Ý nghĩa | Đơn vị |
|---|---|---|
| `Value1` | Thu nhập lãi thuần (NII) | VND |
| `Value2` | Lợi nhuận trước thuế (LNTT) | VND |
| `Value3` | Tổng tài sản | VND |
| `Value4` | Tiền gửi khách hàng (Huy động) | VND |
| `Value5` | Dư nợ cho vay | VND |
| `Value6` | Vốn chủ sở hữu | VND |
| `Value7` | NIM | % |
| `Value8` | ROE | % |
| `Value9` | ROA | % |

---

## 8. Python implementation

```python
import requests
import json

BASE_URL = "https://data.vdsc.com.vn"

BUSINESS_TYPE = {
    1: "regular",   # Sản xuất, BĐS, bán lẻ...
    2: "securities", # Chứng khoán
    3: "bank",      # Ngân hàng
    4: "fund",      # Quỹ đầu tư
    5: "insurance", # Bảo hiểm
}

TABS = ["BCTT", "CDKT", "KQKD", "LC", "CSTC", "CTKH"]


def get_vdsc_session(symbol: str) -> tuple[requests.Session, str]:
    """Khởi tạo session và lấy CSRF token."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "X-Requested-With": "XMLHttpRequest",
    })
    session.get(f"{BASE_URL}/{symbol}/tai-chinh.htm", timeout=15)
    csrf = session.cookies.get("__RequestVerificationToken", "")
    return session, csrf


def get_business_type(session: requests.Session, symbol: str, csrf: str) -> int:
    """Auto-detect BussinessType từ server response."""
    resp = session.post(
        f"{BASE_URL}/data/financeinfo",
        data={
            "Code": symbol,
            "ReportType": "KQKD",
            "ReportTermType": "1",
            "BussinessType": "1",  # Gửi 1 trước
            "Unit": "1",
            "Page": "1",
            "PageSize": "5",
            "__RequestVerificationToken": csrf,
        },
        timeout=15,
    )
    data = resp.json()
    if data and data[0]:
        return data[0][0].get("BusinessType", 1)
    return 1


def fetch_tab(session: requests.Session, symbol: str, tab: str,
              period: int, bus_type: int, csrf: str) -> dict:
    """
    Fetch một tab cụ thể.
    period: 1=năm, 2=quý
    Trả về dict: { "periods": [...], "rows": [...] hoặc {...groups} }
    """
    resp = session.post(
        f"{BASE_URL}/data/financeinfo",
        data={
            "Code": symbol,
            "ReportType": tab,
            "ReportTermType": str(period),
            "BussinessType": str(bus_type),
            "Unit": "1",
            "Page": "1",
            "PageSize": "50",
            "__RequestVerificationToken": csrf,
        },
        timeout=15,
    )
    data = resp.json()
    return {
        "periods": data[0] if data else [],
        "rows": data[1] if len(data) > 1 else [],
    }


def fetch_all_vdsc(symbol: str) -> dict:
    """
    Thu thập toàn bộ dữ liệu từ VDSC cho một mã cổ phiếu.
    Trả về dict với tất cả tabs (năm + quý).
    """
    print(f"[VDSC] Khởi tạo session cho {symbol}...")
    session, csrf = get_vdsc_session(symbol)

    print("[VDSC] Phát hiện loại hình doanh nghiệp...")
    bus_type = get_business_type(session, symbol, csrf)
    sector_name = BUSINESS_TYPE.get(bus_type, "unknown")
    print(f"[VDSC] BussinessType = {bus_type} ({sector_name})")

    result = {
        "symbol": symbol,
        "business_type": bus_type,
        "sector": sector_name,
        "year": {},
        "quarter": {},
    }

    # Lấy tất cả tabs theo năm và quý
    for tab in TABS:
        print(f"[VDSC]   Lấy {tab} (năm)...")
        try:
            result["year"][tab] = fetch_tab(session, symbol, tab, 1, bus_type, csrf)
        except Exception as e:
            print(f"[VDSC]   WARN {tab} năm: {e}")
            result["year"][tab] = {"periods": [], "rows": []}

        # Không lấy quý cho CTKH (không có dữ liệu quý kế hoạch)
        if tab not in ("CTKH", "CSTC"):
            print(f"[VDSC]   Lấy {tab} (quý)...")
            try:
                result["quarter"][tab] = fetch_tab(session, symbol, tab, 2, bus_type, csrf)
            except Exception as e:
                print(f"[VDSC]   WARN {tab} quý: {e}")
                result["quarter"][tab] = {"periods": [], "rows": []}

    return result


def parse_rows(tab_data: dict) -> list[dict]:
    """
    Chuẩn hóa rows từ response (xử lý cả 2 format: array và dict groups).
    Trả về list các dict: {"name": str, "values": {year: value}}.
    """
    periods = tab_data.get("periods", [])
    rows_raw = tab_data.get("rows", [])

    # Map period ID → year
    period_map = {i + 1: p.get("YearPeriod", p.get("TermCode", f"P{i+1}"))
                  for i, p in enumerate(periods)}

    all_rows = []

    if isinstance(rows_raw, list):
        # Format thông thường (doanh nghiệp loại 1)
        flat = rows_raw
    elif isinstance(rows_raw, dict):
        # Format ngân hàng (nhóm rows)
        flat = []
        for group_name, group_rows in rows_raw.items():
            for row in group_rows:
                row["_group"] = group_name
                flat.append(row)
    else:
        return []

    for row in flat:
        entry = {
            "name": row.get("Name", ""),
            "group": row.get("_group", ""),
            "style": row.get("CssStyle", ""),
            "values": {},
        }
        for i, year in period_map.items():
            val_key = f"Value{i}"
            entry["values"][year] = row.get(val_key)
        all_rows.append(entry)

    return all_rows


def rows_to_markdown_table(rows: list[dict], periods: list) -> str:
    """Chuyển rows thành bảng Markdown."""
    if not rows or not periods:
        return "_Không có dữ liệu_\n"

    years = [p.get("YearPeriod", p.get("TermCode", "?")) for p in periods]
    header = "| Chỉ tiêu | " + " | ".join(str(y) for y in years) + " |"
    sep    = "|---| " + " | ".join("---" for _ in years) + " |"
    lines  = [header, sep]

    for row in rows:
        vals = []
        for y in years:
            v = row["values"].get(y)
            if v is None:
                vals.append("N/A")
            elif isinstance(v, float) and abs(v) >= 1e9:
                vals.append(f"{v/1e9:,.0f}tỷ")
            elif isinstance(v, float):
                vals.append(f"{v:.2f}")
            else:
                vals.append(str(v))
        lines.append(f"| {row['name']} | " + " | ".join(vals) + " |")

    return "\n".join(lines) + "\n"
```

---

## 9. Endpoint: Dữ liệu giao dịch & FOL — `/data/gettradingresult`

> Bóc tách ngày 2026-05-16. Trả về lịch sử giao dịch theo phiên, bao gồm tỷ lệ sở hữu nước ngoài.

### Request

```python
POST https://data.vdsc.com.vn/data/gettradingresult
Content-Type: application/x-www-form-urlencoded

code=VCB&__RequestVerificationToken={csrf}
```

### Response (trích record đầu tiên)

```json
{
  "TradingDate": "/Date(1776272400000)/",
  "StockCode": "VCB",
  "KLCPLH": 8355675094,          // Cổ phiếu lưu hành
  "KLCPNY": 8355675094,          // Cổ phiếu niêm yết
  "ClosePrice": 59400,
  "TotalVol": 4286500,
  "TotalVal": 255559840000,
  "MarketCapital": 496327100583600,
  "OwnedRatio": 20.2143,         // % NN đang sở hữu (FOL hiện tại)
  "TotalRoom": 2506702528,       // Tổng room ngoại (cổ phiếu)
  "CurrRoom": 817659484,         // Room ngoại còn lại (cổ phiếu)
  "RemainRoom": 9.79,            // % room ngoại còn lại
  "ForeignBuyVol": 1129200,      // KL ngoại mua
  "ForeignSellVol": 1063700,     // KL ngoại bán
  "ForeignDiffBuySellVol": 65500, // Mua ròng ngoại
  "EPS": 4301.0,
  "PE": 13.93,
  "PB": 2.12,
  "BVPS": 28009.0,
  "Beta": 0.82
}
```

**FOL tối đa (%) = OwnedRatio + RemainRoom** (VD: VCB = 20.21 + 9.79 = 30.0%)

### Python

```python
resp = session.post(
    "https://data.vdsc.com.vn/data/gettradingresult",
    data={"code": symbol, "__RequestVerificationToken": csrf},
    timeout=15,
)
records = resp.json().get("Data", [])
latest = records[0] if records else {}
fol_pct      = latest.get("OwnedRatio")    # % ngoại đang sở hữu
fol_limit    = (latest.get("OwnedRatio", 0) + latest.get("RemainRoom", 0))  # FOL tối đa %
curr_room    = latest.get("CurrRoom")      # Room còn lại (cổ phiếu)
remain_room  = latest.get("RemainRoom")    # Room còn lại (%)
```

---

## 10. Endpoint: ADTV (KLGD/Ngày) — `/data/StatisticByPeriod`

> Bóc tách ngày 2026-05-16. Trả về thống kê giao dịch theo kỳ, bao gồm khối lượng giao dịch bình quân ngày (ADTV).

### Request

```python
POST https://data.vdsc.com.vn/data/StatisticByPeriod
Content-Type: application/x-www-form-urlencoded

code=VCB&type=M&__RequestVerificationToken={csrf}
```

### Tham số `type`

| type | Kỳ |
|---|---|
| `M` | Tháng hiện tại |
| `Q` | Quý hiện tại |
| `Y` | Năm hiện tại |
| `1` đến `6` | Mặc định giống `M` |

### Response (type=M — tháng)

```json
[
  {
    "AvgVol": 8207011,           // ADTV — KLGD bình quân/ngày (tháng)
    "NoTr": 19,                  // Số phiên giao dịch
    "MaxVol": 35200000,          // KL cao nhất
    "MinVol": 3011000,           // KL thấp nhất
    "MaxPrice": 62800.0,
    "MinPrice": 57700.0,
    "F_LastPrice": 58100.0,      // Giá đầu kỳ
    "T_LastPrice": 59800.0,      // Giá cuối kỳ
    "Change": 1700,
    "PerChange": 2.93
  }
]
```

**ADTV 1 tháng = `AvgVol` (cổ phiếu/ngày)**  
Giá trị theo VND = `AvgVol × AvgPrice` (tự tính)

### Cũng có: `/data/statisticmqy` — thống kê theo năm

```python
resp = session.post("https://data.vdsc.com.vn/data/statisticmqy", data={"code": symbol, ...})
# Trả về TotalVol, TotalVal, NoTr theo từng năm (từ 2019 đến nay)
# ADTV năm = TotalVol / NoTr
```

---

## 11. Endpoint: CSTC doanh nghiệp thông thường — Các chỉ số phái sinh quan trọng

> Bóc tách ngày 2026-05-16. CSTC của VDSC có sẵn hầu hết chỉ số FA cần thiết.

### Cách gọi (BussinessType=1 cho doanh nghiệp thông thường)

```python
resp = session.post(
    "https://data.vdsc.com.vn/data/financeinfo",
    data={
        "Code": symbol,
        "ReportType": "CSTC",
        "ReportTermType": "1",     # 1=năm
        "BussinessType": "1",
        "Unit": "1",
        "Page": "1",
        "PageSize": "50",
        "__RequestVerificationToken": csrf,
    },
)
# Response[1] là dict nhóm (giống ngân hàng)
```

### Map chỉ số → tên row trong CSTC (BussinessType=1)

| Chỉ số | Tên row | Nhóm |
|---|---|---|
| **Interest coverage** | `Khả năng thanh toán lãi vay` | Nhóm chỉ số Thanh khoản |
| **Inventory days** | `Thời gian tồn kho bình quân` | Nhóm chỉ số Hiệu quả hoạt động |
| **Receivables days** | `Thời gian thu tiền khách hàng bình quân` | Nhóm chỉ số Hiệu quả hoạt động |
| **Payables days** | `Thời gian trả tiền khách hàng bình quân` | Nhóm chỉ số Hiệu quả hoạt động |
| **EV/EBITDA** | `Giá trị doanh nghiệp trên lợi nhuận trước thuế, khấu hao và lãi vay (EV/EBITDA)` | Nhóm chỉ số Định giá |
| **EV/EBIT** | `Giá trị doanh nghiệp trên lợi nhuận trước thuế và lãi vay (EV/EBIT)` | Nhóm chỉ số Định giá |
| **ROCE** ≈ ROIC | `Tỷ suất sinh lợi trên vốn dài hạn bình quân (ROCE)` | Nhóm chỉ số Sinh lợi |
| **CFO/Revenue** | `Tỷ số dòng tiền HĐKD trên doanh thu thuần` | Nhóm chỉ số Dòng tiền |
| **P/S** | `Chỉ số giá thị trường trên doanh thu thuần (P/S)` | Nhóm chỉ số Định giá |
| **Beta** | `Beta` | Nhóm chỉ số Định giá |

### Lưu ý về ROIC

**ROIC không có field riêng trong VDSC CSTC.** Nguồn thay thế:
- **ROCE** = EBIT / (Equity + LT Debt) → gần với ROIC, dùng làm proxy
- **Tự tính**: ROIC = EBIT × (1 - 20%) / (Equity + Debt - Cash) từ CDKT + KQKD

```python
def calc_roic(ebit, equity, total_debt, cash, tax_rate=0.20):
    nopat = ebit * (1 - tax_rate)
    invested_capital = equity + total_debt - cash
    return nopat / invested_capital if invested_capital else None
```

---

## 12. Checklist dữ liệu bổ sung từ VDSC

### Sau khi tích hợp VDSC (cập nhật 2026-05-16)

| Dữ liệu | VDSC có? | Endpoint | Ghi chú |
|---|---|---|---|
| **Kế hoạch DT / LNST năm** (CTKH) | ✅ Có | `financeinfo` CTKH | 4 năm gần nhất |
| **Kế hoạch cổ tức** | ✅ Có | `financeinfo` CTKH | Tỷ lệ % VĐL |
| **Chỉ số bank: NIM, CIR, ROE, ROA, LDR** | ✅ Có | `financeinfo` CSTC BT=3 | Đầy đủ |
| **P/E, P/B, EPS, BVPS** | ✅ Có | `financeinfo` CSTC | Đầy đủ cả ngân hàng và DN |
| **FOL (% NN sở hữu, room)** | ✅ Có | `gettradingresult` | OwnedRatio, TotalRoom, CurrRoom, RemainRoom |
| **ADTV (KLGD/Ngày 1 tháng)** | ✅ Có | `StatisticByPeriod` type=M | AvgVol |
| **Interest coverage (EBIT/Lãi vay)** | ✅ Có | `financeinfo` CSTC BT=1 | Row: "Khả năng thanh toán lãi vay" |
| **Inventory days** | ✅ Có | `financeinfo` CSTC BT=1 | Row: "Thời gian tồn kho bình quân" |
| **Receivables days** | ✅ Có | `financeinfo` CSTC BT=1 | Row: "Thời gian thu tiền khách hàng bình quân" |
| **EV/EBITDA** | ✅ Có | `financeinfo` CSTC BT=1 | Row: "EV/EBITDA" |
| **ROCE** (proxy ROIC) | ✅ Có | `financeinfo` CSTC BT=1 | Row: "ROCE" |
| **ROIC** (chính xác) | ⚠️ Tính toán | CDKT + KQKD | Tự tính: NOPAT / Invested Capital |
| **Nợ xấu (NPL)** | ❌ Không có | — | Nguồn: NHNN, báo cáo thường niên |
| **CASA ratio** | ❌ Không có | — | Nguồn: báo cáo thường niên ngân hàng |
| **CAR (Hệ số an toàn vốn)** | ❌ Không có | — | Nguồn: NHNN, sstock.vn indicators/single |
| **Quỹ đất, backlog BĐS** | ❌ Không có | — | Nguồn: IR deck, báo cáo thường niên |
| **Dư nợ margin CTCK** | ❌ Không có | — | Nguồn: HNX, VSD |

---

## 13. Lưu ý quan trọng

1. **Session expires**: Cookie session hết sau ~20–30 phút. Cần re-authenticate nếu script chạy lâu.
2. **Rate limiting**: Nên thêm `time.sleep(0.5)` giữa mỗi request để tránh bị block.
3. **Giá trị 0 vs None**: Giá trị `0` trong CTKH có nghĩa là chưa công bố kế hoạch, KHÔNG phải là kế hoạch = 0.
4. **Đơn vị**: Tất cả giá trị tiền tệ trả về theo VND gốc (chia 1e9 để ra tỷ đồng).
5. **PageSize**: Dùng 50 để đảm bảo lấy đủ rows (một số tab có tới 143 rows, cần Page=1 + Page=2).
6. **Ngân hàng format**: `rows` là dict (nhóm), không phải array — cần xử lý riêng.
7. **gettradingresult**: Trả về dict với key `Data` là array, `Header` là metadata. Mỗi record là 1 phiên giao dịch.
8. **StatisticByPeriod**: Trả về array (không có wrapper). `type=M` = tháng hiện tại, không phải 1 tháng trước.
9. **CSTC BussinessType=1**: Response[1] là **dict** nhóm (không phải list) — xử lý giống định dạng ngân hàng.
