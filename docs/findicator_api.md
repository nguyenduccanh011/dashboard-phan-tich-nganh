# findicator.vn API — Tài liệu đầy đủ

> Verify: 2026-05-23 (initial) · 2026-05-24 (HAR electricity + test API gaps) · 2026-05-24 v4 (gap scan: IIP/CPI/NK/FDI sub-nameId · Aframax/Suezmax · sstock sugar/ong-nhua · macroItemId=8/23 sub-nameId). Auth: JWT Bearer (email+password, expire ~72h).
> v4 additions (2026-05-24): **Aframax(339)+Suezmax(340) CÓ data** (254/256 rows, 5Y) · **IIP sub-nameId đầy đủ** (điện=25/cao su+nhựa=16/dược=15/gỗ=29/hóa chất=14/thép=18/điện tử=20/dệt=10/may=11) · **CPI thuốc&y tế=16/DV y tế=5** · **NK dược NPL=62/Dược phẩm=63** · **FDI 8 ngành nameId đủ** · macroItemId=8 industrial product sub-nameId · sstock sugar+ong-nhua confirm.
> v3 additions (2026-05-24): rubber/transport/aviation MAX→null confirm · electricity no-year-param confirm · macroItemId=25 nameId=6/8/9 (cà phê/tiêu/gạo) confirm · bank deposit-rate/asset-structure 1Y/3Y/5Y confirm · Jet Fuel proxy: nameId=623 (Dầu hỏa vùng 1 VN).
> v2 additions: IS corpType=2 (38 items) · Gas tanker 316-319 · PMI global nameIds · US Labor nameIds · CASH_FLOW labels · Bank TRAILING accountId fix (ROE=67/ROA=68/PE=89/PB=90) · bank-debt endpoint · TRAILING accountId=48 net cash verified.
> Tất cả response bọc trong `{"hashCode":"U2FsdGVkX1..."}` — AES Salted__ (CryptoJS).
> Client: `collector/findicator_api.py` → `FindicatorClient(auto_login=True)`.

---

## 1. Authentication

### 1.1 Login flow
```
POST /api/auth/login-user
Body: {
  "email": "nduccanh2k3@gmail.com",
  "password": "37553876",
  "token": "<UUID cố định từ creds file>",   ← phải giống HAR, server giới hạn device
  "deviceId": "<UUID cố định từ creds file>",
  "deviceInfo": JSON.stringify({userAgent, platform, vendor})
}
→ Response (plaintext): {"statusCode":200,"code":"LOGIN_SUCCESSFULLY","data":{"accessToken":"eyJ..."}}
```

**Lưu ý quan trọng**: `token` (CSRF UUID) và `deviceId` phải **nhất quán** — server giới hạn số device per account. Dùng sai UUID mới → `LIMIT_NUMBER_EMPLOYEES_USER_ERROR`. Creds cố định trong `data/secrets/findicator_creds.json`.

JWT expire: ~72h. Cache tại `data/secrets/findicator_token.txt`.  
Client tự refresh khi hết hạn: `FindicatorClient(auto_login=True)`.

### 1.2 Device Check (phát hiện HAR 2026-05-23)
```
POST /api/auth/device/check
Authorization: Bearer <token>
Body: {
  "deviceId": "<UUID từ creds file>",
  "deviceInfo": JSON.stringify({userAgent, platform, vendor})
}
→ HTTP 201, Response: {"statusCode":200,"code":"LOGIN_SUCCESSFULLY","data":true}
```
Endpoint này yêu cầu auth (401 nếu thiếu). Được gọi sau login để đăng ký/xác nhận device session.

### 1.3 Sử dụng token
```
Authorization: Bearer eyJ...
```

### 1.4 Ranh giới PUBLIC vs AUTH
- **PUBLIC** (không cần token): sector dashboard (steel/bank/cement/rubber..., **electricity**), corp-list, corp-search, corp-profile, overview-valuation, overview-dividend, report-data-prediction.
- **AUTH required** (decrypt hashCode): `/api/macro/metric-data` (giá hàng hoá + vĩ mô), enterprise/* BCTC per-DN, manufactoring-revenue, manufactoring-profit-after-tax.
- **Lưu ý**: endpoint PUBLIC vẫn trả response dạng hashCode encrypted — cần SECRET key để decrypt. Khác với login response (plaintext).

---

## 2. Giải mã response (AES CryptoJS)

```python
SECRET = b"b6efdbe6b92fa5221531e85082aa015f3fe407538b7ed1b2f68d70519028a9d5"
# KDF: OpenSSL EVP_BytesToKey, MD5, AES-256-CBC, PKCS7
# Format: "Salted__" (8 bytes) + salt (8 bytes) + ciphertext
```

Login response KHÔNG mã hoá — trả plaintext JSON trực tiếp.

---

## 3. Macro/Metric Data

### 3.1 Endpoint

```
GET /api/macro/metric-data
```

Params:

| Param | Giá trị | Ghi chú |
|---|---|---|
| `extendID` | `{factTable}-{nameId}-{period}-{valueType}-null-` | Key param, xem §3.3 |
| `macroItemId` | integer | ID nhóm chỉ số (§3.4) |
| `nameId` | integer | ID chuỗi cụ thể (§3.4) |
| `period` | `date` / `month` / `quarter` | Tần suất dữ liệu |
| `valueType` | `value` / `yoy` / `mom` / `qoq` | Xem §3.2 |
| `filter` | `1Y` / `5Y` / `MAX` | Độ dài lịch sử |
| `ticket` | `""` | Để trống cho macro (dùng cho per-DN) |
| `isSamePeriod` | `"false"` | Luôn false |

Response: `list[{id, period, date, name_id, unit, value}]`  
Date format: `"MM/DD/YYYY"` (findicator dùng MM/DD, KHÔNG phải ISO).

### 3.2 valueType hợp lệ

Tra `metric` field trong `/api/macro/menu-macro` để biết combination nào hợp lệ:

| Pattern | Ví dụ indicator | Giải thích |
|---|---|---|
| `{'date': ['value']}` | Hàng hoá, TTCK, Tỷ giá, Lãi suất | Chỉ có giá trị tuyệt đối |
| `{'month': ['yoy','mom']}` | CPI VN, IIP | Chỉ có tốc độ tăng trưởng, **không có** `value` |
| `{'month': ['value','yoy','mom']}` | CPI US, Tín dụng, Dự trữ ngoại hối | Cả tuyệt đối và tốc độ |
| `{'month': ['value','yoy','mom'], 'quarter': ['value','yoy','qoq'], 'year': ['value','yoy']}` | Bán lẻ, XK, Khách QT, FDI, Vận tải | Đa period + đa valueType |
| `{'month': ['value']}` | PMI VN, PMI CN | Chỉ index tuyệt đối |
| `{'quarter': ['value','qoq','yoy'], 'year': ['value','yoy']}` | GDP | Quarterly + annual |

**Giá trị YoY/MoM trả về dạng thập phân**: 0.0349 = 3.49%, không phải 3.49.

### 3.3 extendID format

```python
extend_id = f"{factTable}-{nameId}-{period}-{valueType}-null-"
```

`factTable` lấy từ `/api/macro/menu-macro` field `factTable` của mỗi macroItemId.

Ví dụ:
```python
# Brent crude (macroItemId=35, nameId=65, daily)
extendID = "comdty-65-date-value-null-"

# CPI VN YoY tổng (macroItemId=4, nameId=3, monthly)
extendID = "macro_vn_cpi-3-month-yoy-null-"

# XK điện thoại quarterly (macroItemId=25, nameId=44)
extendID = "macro_vn_exim_excomdty-44-quarter-value-null-"
```

### 3.4 Danh mục macroItemId

#### Hàng hoá (macroItemId=35) — 107 chuỗi, daily
factTable: `comdty` | dimTable: `dim_comdty`

Xem `COMDTY` dict trong `collector/findicator_api.py` (70+ key có tên).

**Năng lượng** (nameId):
- 65: Dầu Brent (USD/Bbl) | 67: Dầu WTI | 66: Khí TN Henry Hub (USD/MMBtu)
- 196: Than đá TQ (CNY/T) | 68: Than đá ICE (USD/T) | 158: Than cốc TQ | 153: Than cốc SGX
- 612–628: Xăng RON 95/92, dầu DO/dầu hoả/mazut vùng 1 & 2 (VNĐ/Lít)

**Kim loại**:
- 80: Đồng LME (USD/Lbs) | 53: Nhôm | 114: Nickel | 111: Chì
- 82: Quặng sắt CME (USD/T) | 243: Quặng sắt TQ (CNY/T)
- 61: Thép phế LME | 86: HRC CME | 161: HRC TQ | 60: Thép thanh LME | 171: Thép thanh TQ

**Thép VN** (Hoà Phát): 10: CB300-D10 | 593: CB400-D10 | 595: Cuộn CB240-D6 | 596: Cuộn CB240-D8

**Vàng**: 78: ICE (USD/t.oz) | 730: Thế giới (VNĐ/lượng) | 584: SJC mua | 585: SJC bán

**Nông nghiệp**:
- 95: Cà phê ICE (USd/Lbs) | 687: Cà phê hạt VN (VNĐ/kg)
- 87: Đậu nành CBOT (USd/Bu) | 160: Bã đậu nành TQ
- 108: Ngô CBOT | 88: Lúa mỳ CBOT | 90: Dầu cọ Malaysia (MYR/T) | 89: Gỗ CME

**Đường**: 97: ICE (USd/Lbs) | 220: TQ (CNY/T) | 685: RS An Khê (VNĐ/kg) | 729: RE An Khê

**Tôm VN nguyên liệu** (VNĐ/kg): 21–26 (size 20/30/40/50/80/100 con/kg)
**Cá tra VN**: 2: Giống | 3: Nguyên liệu (VNĐ/kg)
**Heo**: 9: Heo hơi VN | 254: Heo hơi TQ (VNĐ/kg)

**Phân bón**: 50: Urea CME | 190: Urea TQ | 12: Urea Phú Mỹ | 13: Urea Cà Mau | 156: DAP TQ | 29: DAP Đình Vũ | 30: Kali Phú Mỹ

**Hóa chất**: 165: Xút TQ | 213: Phốt pho vàng TQ | 182: Lưu Huỳnh TQ | 253: Axit Sulfuric TQ

**Nhựa TQ** (CNY/T): 170: PET | 183: PP | 231: PVC | 203: LDPE | 204: HDPE | 232: LLDPE

**Cao su**: 51: JPX (JPY/Kg) | 93: Singapore TSR20 (USD Cents/Kg)

**Dệt may**: 98: Bông CBOT | 168: Xơ bông TQ | 185: Sợi cotton TQ | 163/186/207/208: Sợi Polyester DTY/POY/FDY TQ

**Vận tải — freight index**: 679: BDTI (dầu thô) | 680: BCTI (dầu sản phẩm) | 681: BDI (hàng rời) | 688: WCI (container tổng hợp)

**Tàu hàng rời** (USD/ngày): 308: Supramax | 309: Capesize | 310: Panamax | 311: Handysize

**Tàu dầu** (USD/ngày): 322: MR (**0 rows — không có data**) | **339: Aframax** (**254 rows/5Y, latest=2026-05-20, $28,500/ngày — verify 2026-05-24**) | **340: Suezmax** (**256 rows/5Y, latest=2026-05-20, $37,500/ngày — verify 2026-05-24**) | 341: VLCC (**0 rows — không có data**)

**Container routes USD/40ft** (transport legend, 8 routes):
- 689: Shanghai→Rotterdam | 690: Shanghai→Genoa | 691: Shanghai→LA | 692: Shanghai→NY
- 693: Rotterdam→Shanghai | 694: LA→Shanghai | 695: NY→Rotterdam | 696: Rotterdam→NY

> Các routes 689-696 xuất hiện trong `transport/legends` (nhóm `macroDimComdty`), accessible qua macroItemId=35.

---

#### Vĩ mô Việt Nam

| macroItemId | Tên | factTable | period | valueType | Nội dung |
|---|---|---|---|---|---|
| 2 | GDP danh nghĩa | `macro_vn_gdp_nominal` | quarter | value (yoy/qoq chỉ ở leaf nameId) | Tỷ đồng, ~10 ngành |
| 3 | GDP so sánh | `macro_vn_gdp_real` | quarter | value | Tỷ đồng |
| **4** | **CPI** | `macro_vn_cpi` | month | **yoy/mom only** | 11 nhóm hàng hoá. **Sub-nameId (verify 2026-05-24)**: 3=Tổng(parent) / 10=Hàng ăn&DV ăn uống(parent) / 11=Lương thực / 15=Thực phẩm / 7=Đồ uống&thuốc lá / 12=May mặc / 13=Nhà ở&VLXD / **16=Thuốc&DV y tế** (latest YoY +13.58%) / **5=DV y tế** (+17.65%) / 9=Giao thông / 17=Văn hóa&du lịch / 6=Hàng hoá&DV khác |
| 6 | PMI | `macro_vn_prd_pmi` | month | value | Index |
| **7** | **IIP** | `macro_vn_prd_iip` | month | **yoy/mom only** | Khai khoáng, CN chế biến, điện. **Sub-nameId (verify 2026-05-24)**: xem bảng IIP Sub-nameId bên dưới |
| 8 | Sản phẩm CN | `macro_vn_prd_industrialproduct` | month | value/yoy/mom | **Sub-nameId (verify 2026-05-24)**: xem bảng §3.4b |
| 9 | Chỉ số giá NVL | `macro_vn_prd_materialpriceindex` | quarter | value/yoy | |

#### IIP Sub-nameId (macroItemId=7, verify 2026-05-24 — 12 rows/1Y, period=month, valueType=yoy/mom)

> **Cách gọi**: `extendID = "macro_vn_prd_iip-{nameId}-month-yoy-null-"`, `macroItemId=7`

| nameId | Ngành | Sector Hub áp dụng | Giá trị mẫu (05/2025 YoY) |
|---|---|---|---|
| 1 | Tổng IIP | Macro | — |
| **2** | Khai khoáng (tổng) | Dầu khí, khai thác | — |
| 3 | Khai thác than cứng | Điện (than) | — |
| **4** | Khai thác dầu thô & khí | Dầu khí | — |
| **6** | CN chế biến, chế tạo (tổng) | Macro | — |
| **7** | SX chế biến lương thực | F&B (thực phẩm) | +9.4% |
| **8** | SX đồ uống | F&B (bia/nước giải khát) | +6.2% |
| **10** | Dệt | Dệt may (dệt) | +10.1% |
| **11** | SX trang phục | Dệt may (may) | +18.1% |
| **14** | SX hóa chất & sản phẩm hóa chất | Phân bón / Hóa chất | +9.1% |
| **15** | SX thuốc, hóa dược & dược liệu | **Dược phẩm** | **−10.2%** |
| **16** | SX sản phẩm từ cao su và plastic | Cao su + Nhựa | +17.2% |
| **18** | SX kim loại | Thép | +19.9% |
| **19** | SX sản phẩm từ kim loại đúc sẵn | Thép (downstream) | — |
| **20** | SX sản phẩm điện tử, máy vi tính | Công nghệ / Điện tử | +9.4% |
| **25** | SX và phân phối điện | **Điện** | +3.3% |
| **29** | Chế biến gỗ & sản phẩm gỗ | **Gỗ** | +32.4% |
| 33 | SX than cốc, sản phẩm dầu mỏ tinh chế | Dầu khí (refinery) | — |

#### §3.4b Sản phẩm CN Sub-nameId (macroItemId=8, verify 2026-05-24 — 12 rows/1Y, period=month, valueType=value)

> **Cách gọi**: `extendID = "macro_vn_prd_industrialproduct-{nameId}-month-value-null-"`, `macroItemId=8`

| nameId | Sản phẩm | Unit | Sector Hub | Giá trị mẫu (04/2025) |
|---|---|---|---|---|
| 17 | Đường kính | Nghìn tấn | F&B/Đường | 222.5 |
| 26 | Phân Urea | Nghìn tấn | Phân bón | 244.9 |
| 27 | Phân hỗn hợp NPK | Nghìn tấn | Phân bón | 299.4 |
| 29 | Xi măng | Triệu tấn | Xi măng | 16.8 |
| 30 | Sắt, thép thô | Nghìn tấn | Thép | 1,845 |
| 31 | Thép cán | Nghìn tấn | Thép | 1,332 |
| 32 | Thép thanh, thép góc | Nghìn tấn | Thép | 1,252 |
| 2 | Bia | Triệu lít | F&B | 387.2 |
| 37 | Điện sản xuất | Tỷ kWh | Điện | 28.1 |
| 33 | Điện thoại di động | Triệu cái | Công nghệ | 15.3 |
| 10 | PPI | `macro_vn_prd_ppi` | quarter | value/yoy | |
| 12 | Chỉ số tiêu thụ | `macro_vn_dim_index_consumption` | quarter | value/yoy | |
| 13 | Chỉ số tồn kho | `macro_vn_dim_index_inventory` | quarter | value/yoy | |
| 15 | FDI theo ngành | `macro_vn_fdi_sector` | month | value/yoy/mom/qoq | 19 ngành, Triệu USD. **Sub-nameId (verify 2026-05-24, latest=04/2024)**: **1=CN chế biến chế tạo** (2,227 Tr USD) / **2=Điện/khí/nước** / **3=BĐS** (149) / **6=Nông lâm thuỷ sản** (gỗ/café, 7.7) / **7=KHCN** (tech, 95) / **8=Logistics&vận tải kho bãi** (366) / **9=TTCN/ICT** (21.7) / **15=Y tế&dược** (1.1) / 16=Khai khoáng (0) |
| 16 | FDI theo quốc gia | `macro_vn_fdi_country` | month | value/yoy/mom/qoq | |
| 17 | FDI theo địa phương | `macro_vn_fdi_province` | month | value/yoy/mom/qoq | |
| 18 | FDI vốn thực hiện | `macro_vn_fdi_realized` | month | value/yoy/mom/qoq | |
| 20 | Vốn đầu tư NSNN | `macro_vn_capital_understate` | month | value/yoy | |
| 21 | Vốn đầu tư xã hội | `macro_vn_capital_social` | quarter | value/yoy | |
| **23** | **Bán lẻ** | `macro_vn_retailsales` | month/quarter/year | value/yoy/mom/qoq | 4 loại, Tỷ đồng. **Sub-nameId (verify 2026-05-24, latest=05/2025)**: **1=Tổng** (571,214 Tỷ đ) / **2=Bán lẻ HH** (434,053) / **3=DV lưu trú ăn uống** (70,465) / **4=DV lữ hành** (8,078) / **5=DV khác** (58,618) |
| **25** | **XK hàng hoá** | `macro_vn_exim_excomdty` | month/quarter/year | value/yoy/mom/qoq | 46 mặt hàng, Triệu USD |
| **26** | NK hàng hoá | `macro_vn_exim_imcomdty` | month/quarter/year | value/yoy/mom/qoq | Triệu USD. **Sub-nameId dược (verify 2026-05-24)**: **62=Nguyên phụ liệu dược phẩm** (42.1 Tr USD/tháng) / **63=Dược phẩm** (369.2 Tr USD/tháng). Ngoài ra: 22=Chất dẻo NL / 23=SP chất dẻo / 28=Gỗ&SP gỗ (301 Tr USD) / 43=Điện tử linh kiện / 62+63=Dược phẩm (pharma dashboard) |
| 27 | XNK dịch vụ | `macro_vn_exim_service` | quarter | value/yoy | |
| 29 | Vận chuyển HK | `macro_vn_trans_carriedpassenger` | month/quarter/year | value/yoy/mom/qoq | |
| 30 | Vận chuyển hàng hoá | `macro_vn_trans_carriedfreight` | month/quarter/year | value/yoy/mom/qoq | |
| 31 | Luân chuyển hành khách | `macro_vn_trans_trafficpassenger` | month | value/yoy/mom | 3 phương thức |
| 32 | Luân chuyển hàng hoá | `macro_vn_trans_trafficfreight` | month | value/yoy/mom | 3 phương thức |
| 33 | Giá vận tải kho bãi | `macro_vn_trans_warehouse` | quarter | value/yoy | |
| **47** | **Tín dụng** | `macro_vn_credit_growth` | month | value/yoy/mom | 6 ngành KT, Tỷ đồng |
| 46 | Tổng PTTT | `macro_vn_liquidity` | month | value/yoy/mom | Tỷ đồng |
| **48** | **Lãi suất huy động** | `macro_vn_interestrate_commercialbank` | date | value | 10 kỳ hạn (KKH, 1M→36M) |
| 49 | Lãi suất TT2 (liên NH / VNIBOR) | `macro_vn_interestrate_centralbank` | date | value | **Xác nhận 0 rows** (verify 2026-05-24) — endpoint tồn tại nhưng không có data. **Primary**: WiChart `key=tien_te, name=lslnh` → 3 series daily: qua đêm(5.52%)/1 tuần(5.97%)/2 tuần(6.65%), 497 điểm |
| 50 | OMO | `macro_vn_omo` | date | value | 8 series: bơm/hút/lưu hành, đến 31/12/2025 |
| **52** | **Tỷ giá USD/VND** | `macro_vn_exchangerate_usd` | date | value | 12 variants (mua/bán/liên NH/tự do/trần/sàn...) |
| 53 | Tỷ giá khác Vietcombank | `macro_vn_exchangerate_others` | date | value | 11 đồng tiền, data đến 31/12/2025 |
| **54** | **Trái phiếu** | factTable: `macro_global_bond` / dimTable: `macro_global_dim_bond` | date | value | 22 series, 8 quốc gia/khu vực |
| **55** | **Dự trữ ngoại hối** | `macro_vn_reserves` | month | value/yoy/mom | Triệu USD |
| 56 | Cán cân thanh toán | `macro_vn_balance_payment` | quarter | value/yoy | |
| 58–60 | Ngân sách NN | `macro_vn_statebudget*` | quarter | value/yoy | Thu/chi/cân đối |
| **61** | **Khách quốc tế** | `macro_vn_internationalvisitor` | month/quarter/year | value/yoy/mom/qoq | 35 nước, 3 phương tiện |
| 135/136 | XK/NK theo tỉnh | `macro_vn_exim_province` | month | value/yoy/mom | |
| 140 | Cán cân TM hàng hoá | `macro_vn_exim_comdty_net` | month | value | |
| **134** | **TTCK VN** | `macro_vn_stock` | date | value | VNINDEX/VN30/HNX/UPCOM + breadth SMA + valuation PE/PB/EV |

**OMO nameIds** (macroItemId=50, đến 31/12/2025):
- 1: Khối lượng phát hành mới | 2: Khối lượng cũ đáo hạn | 3: Bơm (hút) ròng trong ngày
- 4: OMO lưu hành lũy kế | 5: Bill lưu hành lũy kế | 6: Lưu hành lũy kế (ròng)
- 7: OMO ròng trong ngày | 8: Bill ròng trong ngày

**Tỷ giá khác nameIds** (macroItemId=53, Vietcombank):
- 1: AUD | 2: CAD | 3: CHF | 4: CNY | 5: EUR | 6: GBP | 7: HKD | 8: JPY | 9: KRW | 10: MYR | 11: RUB
- Data đến 31/12/2025 (không có data 2026, khác với USD/VND)
- **Fallback CNY/VND real-time**: dùng `steel/exchange-rate` → field `cnyExchangeRate` (PUBLIC, không cần auth, luôn cập nhật)

**Trái phiếu nameIds** (macroItemId=54, `filter=1Y` hoặc `5Y` — MAX không hỗ trợ, data đến 31/12/2025):
- Mỹ: 1=3M | 2=1Y | 5=2Y | 4=5Y | 3=10Y
- Việt Nam: 6=1Y | 7=3Y | 8=5Y | 9=10Y | 10=20Y
- Châu Âu: 11=Đức | 14=UK | 15=Hà Lan | 19=Pháp | 20=Ý | 27=Tây Ban Nha
- Châu Á: 13=Nhật | 25=TQ | 33=Singapore | 34=Korea | 35=Thailand | 36=Indonesia | 37=HK

**TTCK VN nameIds** (macroItemId=134 — verify 2026-05-24, scan 1-50):

> **Dim table** `macro_vn_dim_stock` (verify 2026-05-24): **13 items** — KHÔNG có VNFIN/VNMAT/VNHEAL/VNREAL/VNUTIL. Findicator chỉ có 4 sector index.

Index chính (daily, filter=1Y → 247-250 rows):
- 1=HNX | 2=VN30 | 3=VNINDEX | 4=UPCOM | 5=VN100 | 6=VNALL | 11=HNX30

Sector index (daily, 247 rows) — **CHỈ CÓ 4**:
- 7=VNCOND | 8=VNCONS | 9=VNDIAMOND | 10=VNENE
- nameId=12 → **empty** (parent group "Độ rộng thị trường" — không phải data)
- **KHÔNG có**: VNFIN, VNMAT, VNHEAL, VNREAL, VNUTIL (scan 1-50 xác nhận, tất cả empty)

Breadth SMA (daily, 249 rows — ratio 0-1):
- 13=%CP>SMA20 | 14=%CP<SMA20
- 15=%CP>SMA50 | 16=%CP<SMA50
- 17=%CP>SMA100 | 18=%CP<SMA100
- 19=%CP>SMA200 | 20=%CP<SMA200
- nameId=21 → **empty**

Breadth valuation (daily, 246 rows — ratio 0-1):
- 22=%CP>PE_median_5Y | 23=%CP<PE_median_5Y
- 24=%CP>PB_median_5Y | 25=%CP<PB_median_5Y
- 26=%CP>EV/EBITDA_median_5Y | 27=%CP<EV/EBITDA_median_5Y

> **Lưu ý**: Không có global stock index data (endpoint `macro_global_dim_stock` không active).

---

#### Vĩ mô Mỹ (macro_us_*)

| macroItemId | Tên | factTable | period | valueType |
|---|---|---|---|---|
| 70 | CPI Mỹ | `macro_us_cpi` | month | value/yoy/mom |
| 71 | PPI Mỹ | `macro_us_ppi` | month | value/yoy/mom |
| 72 | GDP thực (phương pháp chi tiêu) | `macro_us_gdp_method` | quarter | value/yoy/qoq |
| 73 | GDP thực (theo ngành) | `macro_us_gdp_industry` | quarter | value/yoy/qoq |
| 75 | PCE | `macro_us_pce` | month | value/yoy/mom |
| 76 | Lao động | `macro_us_labor` | date | value | **nameIds (verify 2026-05-24)**: 2=Thất nghiệp%(0.043=4.3%), 3=NFP(115K/tháng), 5=ADP employment(209K), 6=Jobless claims hàng tuần(1,827K) |
| 78 | PMI Mỹ | `macro_us_prd_pmi` | month | value |
| 79 | IIP theo sản phẩm | `macro_us_prd_iip_product` | month | value/yoy |
| 74 | GDP Mỹ theo tiểu bang | `macro_us_gdp_state` | quarter | value | 60 states |
| 80 | IIP Mỹ theo ngành | `macro_us_prd_iip_industry` | month | value | 4 nhóm |
| 81 | Production Index Mỹ | `macro_us_prd_index` | month | value | 5 chỉ số |
| 84 | Doanh số bán lẻ Mỹ | `macro_us_retailsales_sales` | month | value | **nameIds (verify 2026-05-24, 12 rows/1Y)**: **1=Tổng DT bán lẻ (752,063 Tr USD)**, 7=Xe ô tô (139,627), 10=Nội thất (11,301), 11=Điện tử, 12=Vật liệu XD, 14=Thực phẩm/đồ uống, 17=Sức khỏe, **20=Quần áo & phụ kiện** (proxy demand dệt may XK), 19=Xăng dầu, 24=Tổng hợp. Tồn kho: 33=tổng, 34=ô tô |
| 87 | XNK Mỹ | `macro_us_exim_excomdty` | month | value/yoy |
| 99 | Tài chính công Mỹ | `macro_us_fiscal` | quarter | value | 6 series |
| 100 | Tồn kho bán lẻ Mỹ | `macro_us_retailsales_inventory` | month | value | |
| 103 | Cán cân TT Mỹ | `macro_us_balance_payment` | quarter | value | 5 series |
| 104 | Dòng vốn ngoại Mỹ | `macro_us_financial_flow` | month | value | 12 series (mua/bán CK) |
| 138 | US Treasury Fiscal | `macro_us_fiscal_treasury` | month | value | 2 series |
| **139** | **GDPNow Fed Atlanta** | `macro_us_gdp_forecast` | date | value | **5 series: C/I/G/X-M/tổng, up-to-date** |
| **96** | **Lãi suất FED** | `macro_us_interestrate` | date | value | Fed Funds + cho vay NH lớn + mortgage 30Y |
| 97 | Tổng TS FED | `macro_us_fed_asset` | date | value | **1 series weekly, up-to-date** (20/05/2026) |
| 98 | CĐKT NHTM Mỹ | `macro_us_commercialbank_balancesheet` | date | value | 3 series: tổng TS/nợ/vốn CSH |
| 95 | Cung tiền Mỹ | `macro_us_money_supply` | month | value/yoy |

**Lãi suất FED nameIds** (macroItemId=96):
- 1: Fed Funds Rate | 11: Lãi suất cho vay NH lớn ngắn hạn | 39: Mortgage 30Y cố định

**FED Total Assets** (macroItemId=97): nameId=1, weekly, đến 20/05/2026 = 6,713,640 tỷ USD.

**US CB BS nameIds** (macroItemId=98): 33=Tổng tài sản | 40=Nợ phải trả | 41=Vốn CSH

---

#### Vĩ mô Trung Quốc (macro_cn_*)

| macroItemId | Tên | factTable | period | valueType |
|---|---|---|---|---|
| 107 | CPI toàn quốc | `macro_cn_cpi` | month | value/yoy/mom |
| 108 | CPI thành thị | `macro_cn_cpi_urban` | month | value/yoy/mom |
| 109 | CPI nông thôn | `macro_cn_cpi_rural` | month | value/yoy/mom |
| 110 | PPI NXS CN | `macro_cn_prd_purchasing_price_index` | month | value/yoy |
| 112 | PPI CN | `macro_cn_prd_ppi` | month | value/yoy |
| **115** | **PMI TQ** | `macro_cn_prd_pmi` | **month** | value | 28 chuỗi: 1=Tổng hợp, 8=SX (15 sub), 25=Phi SX (11 sub) |
| 116 | Sản phẩm CN | `macro_cn_prd_industrialproduct` | month | value/yoy |
| 119 | Sản lượng năng lượng | `macro_cn_prd_energyproduct` | **month** | value/yoy | 16 series, data đến 12/2024 (lag ~17 tháng) |
| 121 | BĐS phát triển/đầu tư | `macro_cn_realestate_development` | month | value/yoy |
| 122 | BĐS diện tích sàn | `macro_cn_realestate_floorspace` | month | value/yoy |
| 123 | BĐS doanh thu | `macro_cn_realestate_sales` | month | value/yoy |
| 125 | Đầu tư TS cố định | `macro_cn_investment_fixedassets` | month | value/yoy |
| 126 | Bán lẻ TQ | `macro_cn_retailsales` | month | value/yoy |
| 127 | XNK TQ | `macro_cn_exim` | month | value/yoy |
| 131 | Tài khóa TQ | `macro_cn_fiscal` | month | value/yoy |
| 132 | Cung tiền TQ | `macro_cn_money_supply` | month | value/yoy |

**China PMI nameIds** (macroItemId=115, period=month):
- 1=Tổng hợp | 8=Sản xuất (NBS) | 25=Phi sản xuất
- Sub SX (Caixin+NBS): 2=Lao động | 3=Đơn hàng | 4=Tồn kho TP | 5=Tồn kho NVL | 6=Thời gian giao hàng | 7=Chi phí NVL | 9=Đơn hàng XK | 10=Đơn hàng mới | 11=Giá NVL | 14=Tồn kho TP | v.v.
- Sub phi SX: Xây dựng + Dịch vụ (thương mại, tài chính, logistics...)

**China Energy nameIds** (macroItemId=119, period=month, data đến 12/2024):
- 1=Than đá (10k tấn) | 2=Dầu thô | 3=Khí TN (100Tr m³) | 4=Than cốc | 5=Xăng | 6=Dầu diesel | 7=LPG | 8=Nhựa đường | 10=Naphtha | 15=Điện (100Tr kWh)

---

## 4. Sector Dashboards (PUBLIC)

Không cần auth. Client: `c.call("{sector}/legend")`, `c.call("{sector}/overview/{sector}-data")`.

| Sector prefix | Dữ liệu chính |
|---|---|
| `steel` | **Per-DN**: thị phần nội địa (HPG/HSG/NKG/TVDUC, name_id=18/20/21), sản lượng nội địa/XK. **Tổng ngành**: thị phần 11 DN, tồn kho, giá NVL |
| `cement` | Giá xi măng nội địa, than đầu vào, giá XK clinker. **Gap**: không có per-DN market share |
| `electricity` | Sản lượng 36 nhà máy monthly. Per-DN qua `electric_description_manufacturing?ticket=HND`. Giá đầu vào (than/dầu/khí), mực nước hồ, ENSO |
| `pig` | Giá heo hơi VN/TQ, ngô, đậu nành. **Gap**: không có per-DN (DBC/BAF/MML) |
| `aviation` | **Per-DN**: số chuyến bay monthly (VJC/HVN/BAV). `flight-company-data?period=month_value&tickets=VJC&year=5Y` |
| `chemistry` | Giá phân bón (Urea/DAP/Kali) + cơ cấu chi phí SX. **Gap**: không có per-DN (DPM/DCM/LAS) |
| `bank` | **Per-NH**: tăng trưởng tín dụng vs trần NHNN, CASA/CoF/NPL snapshot, cấu trúc TS/TN/vốn quarterly, lãi suất huy động daily |
| `industry` | KCN: 12 DN (BCM/IDC/KBC/LHG...), company-land, FDI by province/sector, IIP, PMI, giá thuê nhà máy |
| `textile` | XK dệt may monthly (MacroVnEximExcomdty) + NK nguyên liệu. `textileExportCountry` (Mỹ/EU/TQ). **Gap**: không có per-DN (TCM/TNG/MSH) |
| `food-and-beverage` | Bia: tiêu thụ theo SP/quốc gia/kênh, cơ cấu CP. Sữa: thị phần static 2022 (Vinamilk 40%). **Gap**: không có per-DN time series |
| `rubber` | Cơ cấu ứng dụng, diện tích trồng. `values?repo=macro_comdty&macroIds=41,51,91`. **Gap**: không có per-DN (DPR/PHR/TRC) |
| `stock` | **Per-CTCK**: thị phần môi giới quarterly (HOSE/HNX/UPCOM), tài sản/nợ/doanh thu per quý. 35 CTCK snapshot thị phần |
| `real-estate` | **Per-DN**: danh sách dự án (`company-project?tickets=VHM`), định giá (`core-index-valuation?tickets=VHM`). Laws từ 2006-2026. **Note**: `supply-demand` endpoint KHÔNG tồn tại (confirmed) |
| `transport` | 28 freight index (charter rates tàu bulk/dầu/container/khí). **Gap**: không có per-DN (GMD/HAH/PVT) |
| `shrimp` | **Per-DN** (CMX/FMC/MPC): XK tôm thẻ(28)/tôm sú(29) monthly + ASP per thị trường × 4 nước |
| `pangasius` | **Per-DN** (ABT/ACL/ANV/IDI/VHC): `export-status?ticket=ANV` (turnover/quantity monthly), `export-price-to-markets?ticket=ANV` (ASP × 4 nước), `export-status-to-markets?ticket=ANV` (breakout thị trường) |

### Pangasius — Per-DN export endpoints (verify 2026-05-23)

**Corp list**: ABT, ACL, ANV, IDI, VHC (`pangasius/corp-name`)

> Lưu ý: endpoints dùng trực tiếp dạng `pangasius/{endpoint}?ticket=ANV` — **không** có prefix `enterprise-`

| Endpoint | Params | Data |
|---|---|---|
| `pangasius/export-status` | `ticket` | 5 năm × monthly `{date, turnover, quantity}` — tổng XK per-DN |
| `pangasius/export-price-to-markets` | `ticket, year` | list[4] `{country_id, country_name, data:[{date, price}]}` — ASP (USD/kg) per-DN × 4 thị trường |
| `pangasius/export-status-to-markets` | `ticket` | list[4] `{country_id, country_name, data:[{turnover, quantity}]}` — XK per-DN per-thị trường |
| `pangasius/export-quantity-to-markets` | `year` | list[4] — tổng ngành theo thị trường |
| `pangasius/export-year-over-year` | — | list[3] năm YoY toàn ngành |

### Gap analysis — Sector nào thiếu per-DN data

| Sector | Nguyên nhân thiếu | DN tiêu biểu bị ảnh hưởng |
|---|---|---|
| cement | Backend không có per-DN endpoint | BCC, HT1, BTS, SCJ, BCC |
| rubber | Chỉ có macro giá cao su global | DPR, PHR, TRC |
| chemistry/fertilizer | Giá + CP tổng ngành, không có per-DN | DPM, DCM, LAS |
| pig/livestock | Giá heo macro, không có per-DN | DBC, BAF, MML, HAG |
| transport/shipping | Freight index global, không có per-DN VN | GMD, HAH, PVT, VSC |
| textile | XK tổng VN, không breakdown per-DN | TCM, TNG, MSH, VGT |
| food-and-beverage | Snapshot market share 2022 (static), không time-series per-DN | SAB, BHN, VNM, MCM |

> Để bù đắp gap: dùng `/api/enterprise/*` (finance comparison BCTC) + `finance_timeseries()` cho IS/BS/CF per-DN.

---

## 5. Enterprise Endpoints (AUTH required)

```
GET /api/enterprise/{endpoint}?ticket={TICKER}&period=quarter&year=5Y
```

| Endpoint | Ngành | Params | Data |
|---|---|---|---|
| `corp-list` | Tất cả | — | **Toàn bộ DN niêm yết VN** (~930KB, HOSE+HNX+UPCOM). HAR confirmed 2026-05-24. Cache local, không gọi mỗi request |
| `corp-search?corpText=` | Tất cả | corpText | Danh bạ ~1817 mã (floor, ICB, market cap). corpText= trống → trả tất cả |
| `corp-profile` | Tất cả | ticket | Hồ sơ DN — **verify 2026-05-24**: fields `{id, tradingDate, ticket, closePrice, priceChange, perPriceChange, marketCap, totalTradedVol, listedShare, pe, pb, evEbitda, eps, bvps, ebitda, overview(text mô tả DN), website, updatedAt}`. Dùng cho Khối E snapshot realtime |
| `overview-shareholder` | Tất cả | ticket | Cổ đông lớn — **verify 2026-05-24**: `list[{name, created_date, ratio(%)}]`. VCB: NHNN(74.8%), Mizuho(15%), Khác(10.2%) |
| `overview-dividend` | Tất cả | ticket, year | Cổ tức — **verify 2026-05-24**: `list[{year, type, value}]`. type=1=cổ tức tiền mặt (ratio, VD 0.05=5%), type=2=cổ tức cổ phiếu. year=All → toàn bộ lịch sử |
| `overview-valuation` | Tất cả | ticket, year, accountIds | Định giá (public, cần accountIds) |
| `report-data-prediction` | Tất cả | ticket | **PUBLIC.** Trả `{realData: list[749] OHLCV 3 năm gần nhất, predictData: {minPrice,maxPrice,averagePrice}}`. `realData` fields: open/high/low/close/volume/value daily. **verify 2026-05-24**: VCB predict {64251, 84541, 72266} VNĐ |
| `report-analysis` | Tất cả | ticket | Báo cáo phân tích broker: id, title, recommend, source, upside, minPrice/maxPrice/avgPrice, targetPrice, reportPath, issuedDate |
| `stock-ohlc` | Tất cả | **symbol** (không phải ticket) | OHLC daily từ ~2007 đến nay (HPG: 4613 rows). Fields: id, symbol, market, date, open, high, low, close, volume, value |
| `manufactoring-revenue` | Sản xuất | ticket, period, year | DT quý/năm per-DN. HAR: `year=All&period=quarter` → tất cả quý lịch sử |
| `manufactoring-profit-after-tax` | Sản xuất | ticket, period, year | LNST quý/năm per-DN. HAR confirmed 2026-05-24. Cùng format với manufactoring-revenue |
| `stock-revenue` | Chứng khoán | ticket, period, year | DT per-CTCK — **verify 2026-05-24**: `list[{year,quarter,type,value,date}]`. type: 1=môi giới, 2=tự doanh, 3=TPDN, 4=phái sinh, 5=dịch vụ. SSI 3Y = 60 rows |
| `bank-revenue` | Ngân hàng | ticket, period, year | list[325] VCB all. Fields: {year,quarter,date,**type**,value}. type 1-5 = loại thu nhập (lãi/phi lãi/DV/FX/khác) |
| `bank-asset` | Ngân hàng | ticket, period, year | list[325]. type 1-5 = phân loại tài sản |
| `bank-bad-debt-ratio` | Ngân hàng | ticket, period, year | list[90]. type 1-2 = nợ xấu nhóm 1 vs nhóm 2+ |
| `bank-client-debt` | Ngân hàng | ticket, period, year | list[22]. type 1-2 = phân loại dư nợ KH |
| `bank-debt` | Ngân hàng | ticket, period, year | list[305]. type 1-5 |
| `bank-debt-by-bond-issuer` | Ngân hàng | ticket, period, year | list[90]. type 1-2 = dư nợ TPDN |
| `bank-loan-over-time` | Ngân hàng | ticket, period, year | list[90]. type 1-2 = phân kỳ hạn vay |
| `bank-debt` | Ngân hàng | ticket, period, year | list[100]. type 1-5 = cấu trúc nợ phải trả. **Verify 2026-05-24**: VCB 100 rows, VND tuyệt đối |
| `bank-profit-after-tax` | Ngân hàng | ticket, period, year | list[65]. type 1 = LNST |
| `stock-revenue` | CK | ticket, period, year | Môi giới/tự doanh/TPDN/phái sinh theo quý |
| `insurance-revenue` | Bảo hiểm | ticket, period, year | Phí BH gốc theo quý (BVH, BMI, BIC, MIG...) |
| `manufactoring-revenue-to-profit-ratio` | Sản xuất | ticket, period, year(int), quarter(int) | Waterfall DT→LNST: 11 type (1=DT, 2=-GVHB, 3=LN gộp, 4=-CFtài chính, 5=LNTT, 6=-thuế, 7=LNST, 8=-LNST thiểu số, 9=LNST CT mẹ, 10-11=điều chỉnh). VND tuyệt đối |
| `manufactoring-revenue-to-profit-ratio-metadata` | Sản xuất | ticket | Dict {yearList:[2025..2004], quarterList:[{year,quarter:[1,2,3,4]}...]} |

### Stock sector — per-DN endpoints (verify 2026-05-23)

| Endpoint | Params | Chỉ dùng cho | Data |
|---|---|---|---|
| `stock/brokerage-market-share-companies` | — | Tất cả CK | list[35] `{ticket, corp_name, value(%)}` — thị phần môi giới toàn thị trường |
| `stock/gross-profit-structure` | `tickets=SSI` | CK | list[5] `{year, quarter, type, value, date, ticket}` — cơ cấu LN gộp |
| `stock/enterprise-stock-asset` | `ticket=SSI, year=5Y` | CK | `{year, quarter, date, type, value}` — cơ cấu tài sản |
| `stock/enterprise-stock-debt` | `ticket=SSI, year=5Y` | CK | — cơ cấu nguồn vốn |
| `stock/enterprise-stock-revenue` | `ticket=SSI, year=5Y` | CK | list[100] `{year, quarter, type, value, date}` — cơ cấu doanh thu |
| `stock/money-flow` | `nameId=1\|2, period=month_value, year=1Y` | — | list[13] `{name_id, month, start_date, value}` — dòng tiền ròng (âm/dương). nameId≥3 trả empty |

> Lưu ý: `stock/enterprise-*` chỉ có data cho CK tickers (SSI/MBS/HCM/VND). Banking/SX → `[]`.

### Shrimp — enterprise + global market endpoints (verify 2026-05-23)

**Enterprise tickers**: CMX, FMC, MPC (`shrimp/enterprise-corp-name`).

| Endpoint | Params | Data |
|---|---|---|
| `shrimp/enterprise-export-status` | `ticket, macroIds=28\|29, year, period=month_value` | `[{date, turnover, quantity}]` monthly per-DN. macroIds: **28=tôm thẻ**, **29=tôm sú** |
| `shrimp/enterprise-export-price-to-markets` | `ticket, macroIds=28\|29, year` | list[4] `{country_id, country_name, data:[{date, price}]}` — giá XK per-DN per-thị trường |
| `shrimp/export-price-by-product` | `year=1Y` | list[144] `{period, date, name_id, exported_country_id, imported_country_id, value, volume, price, *_unit}` |
| `shrimp/global-market-export-price` | `macroId=28\|29, year` | list[186/81] — giá XK thị trường toàn cầu |
| `shrimp/global-market-export-price-by-product` | `macroId, countryId, action=export, year` | list[52] — per-sản phẩm per-quốc gia |
| `shrimp/global-market-export-price-timeseries` | `macroId=28, countryId=1, action=export, year` | list[3] `{countryId, data:[{date, turnover, quantity}]}` |
| `shrimp/global-market-export-price-comparison` | `macroId=28, countryId=1, action=export, year` | `{currentPrice, lastYearPrice, latestDate, changedPercentage}` |
| `shrimp/global-market-export-price-year-over-year` | `macroId=28, countryId=1, action=export, year=3Y` | list[3] nested lists 12 tháng |

**country_id mapping**: 1=Mỹ, 2=TQ, 3=EU, 4=ĐNÁ, 5=Nam Mỹ (từ `shrimp/legends.countries`).

---

## 5b. Finance Comparison Endpoints (PUBLIC — phát hiện 2026-05-23)

Không cần auth. Trả BCTC per-ticker, hỗ trợ nhiều ticker cùng lúc.

### Endpoints

```
GET /api/enterprise/finance-label?corpType={1|4}&tableName={tableName}
GET /api/enterprise/v2/finance-data-range?ticket=...&period=quarter&tableName={tableName}
GET /api/enterprise/v2/finance-ticket-data?period=quarter&ticket=[JSON]&date=MM/DD/YYYY&tableName={tableName}
GET /api/enterprise/custom-tickets-same-period?ticket=...
```

### tableName enum (verify từ HAR 2026-05-23)

| tableName | finance-label items | Nội dung |
|---|---|---|
| `TRAILING` | 54 (corpType=4) / 43 (corpType=1) / 14 (corpType=2) / 29 (corpType=3) | **Chỉ số tài chính trailing**: margins, ROE/ROA, vòng quay, đòn bẩy, thanh khoản, PE/PB/PS/EV, cổ tức, tăng trưởng YoY |
| `INCOME_STATEMENT` | 21 (corpType=4) / bank (23 items) / **38 (corpType=2) / 69 (corpType=3)** | Kết quả kinh doanh |
| `BALANCE_SHEET` | 117 | Bảng cân đối kế toán |
| `CASH_FLOW_DIRECT` | **28 (corpType=4) / 47 (corpType=1)** | Lưu chuyển tiền tệ (phương pháp trực tiếp). Key corpType=4: 53=Thu bán hàng, 54=Chi NCC, 55=Chi lương, 56=Lãi vay đã trả, 57=Thuế TNDN nộp, **61=Net OCF**. Key corpType=1: 2=Thu lãi nhận, 3=Chi lãi đã trả, 4=DT dịch vụ. **Verify 2026-05-24**: labels xác nhận nhưng data HPG Q1/2026 = empty (có thể DN dùng phương pháp gián tiếp) |
| `CASH_FLOW_INDIRECT` | **39 (corpType=4)** | Lưu chuyển tiền tệ (phương pháp gián tiếp). Key: 2=LNTT, 4=Khấu hao TSCĐ, 5=Dự phòng, 13=CP lãi vay, **61=Net OCF**. **Verify 2026-05-24** |

> Trước đây ghi "CASH_FLOW không hỗ trợ" — SAI. `CASH_FLOW_DIRECT` và `CASH_FLOW_INDIRECT` đều hoạt động. Tuy nhiên cần kiểm tra per-DN vì một số công ty báo cáo theo phương pháp gián tiếp (data DIRECT = empty).

### TRAILING — 54 chỉ số tài chính (corpType=4, verify 2026-05-23)

| accountId | Chỉ số | Unit | Tần suất |
|---|---|---|---|
| 2 | Biên lãi gộp | % | Quarterly/Yearly |
| 3 | Biên lãi EBIT | % | Quarterly/Yearly |
| 4 | Biên lãi EBITDA | % | Quarterly/Yearly |
| 5 | Biên lãi EBT | % | Quarterly/Yearly |
| 6 | Biên lợi nhuận sau thuế | % | Quarterly/Yearly |
| 8 | ROE | % | Quarterly(T+A)/Yearly |
| 9 | ROA | % | Quarterly(T+A)/Yearly |
| 11 | Vòng quay hàng tồn kho | — | Quarterly(T+A)/Yearly |
| 12 | Vòng quay khoản phải thu | — | Quarterly(T+A)/Yearly |
| 13 | Số ngày tồn kho | Ngày | Quarterly(T+A)/Yearly |
| 14 | Số ngày phải thu | Ngày | Quarterly(T+A)/Yearly |
| 15 | Vòng quay khoản phải trả | — | Quarterly/Yearly |
| 16 | Số ngày phải trả | Ngày | Quarterly/Yearly |
| 17 | Số ngày luân chuyển tiền mặt | Ngày | Quarterly(T+A)/Yearly |
| 18 | Vòng quay tổng tài sản | — | Quarterly(T+A)/Yearly |
| 19 | Vòng quay tài sản cố định | — | Quarterly(T+A)/Yearly |
| 21 | Đòn bẩy hoạt động | — | Yearly/Quarterly |
| 22 | Nợ vay / vốn chủ | % | Yearly/Quarterly |
| 23 | Nợ vay / tổng nguồn vốn | % | Yearly/Quarterly |
| 24 | Khả năng TT chi phí tài chính | — | Yearly/Quarterly |
| 25 | Thanh toán tiền mặt | — | Yearly/Quarterly |
| 26 | Thanh toán nhanh | — | Yearly/Quarterly |
| 27 | Thanh toán hiện hành | — | Yearly/Quarterly |
| 29 | Tỷ lệ cổ tức tiền mặt thực trả | % | Yearly |
| 30 | Tỷ lệ cổ tức cổ phiếu thực trả | % | Yearly |
| 31 | Tỷ lệ tổng cổ tức thực trả | % | Yearly |
| 32 | Tỷ suất cổ tức tiền mặt | % | Daily (Year) |
| 35 | Vốn hóa | Tỷ đồng | Daily |
| 36 | EPS | Đồng | Quarterly |
| 38 | BVPS | Đồng | Quarterly |
| 39 | P/E | — | Daily (Quarter T) |
| 40 | P/B | — | Daily (Quarter) |
| 41 | P/S | — | Daily (Quarter T) |
| 43 | EV | Tỷ đồng | Quarterly |
| 44 | EBIT | Tỷ đồng | Quarterly |
| 45 | EBITDA | Tỷ đồng | Quarterly |
| 46 | EV/EBIT | — | Daily (Quarter T) |
| 47 | EV/EBITDA | — | Daily (Quarter T) |
| 48 | Tiền mặt ròng | Tỷ đồng | Quarterly |
| 49 | Tiền mặt ròng/Cổ phiếu | Đồng | Quarterly |
| 50 | Tiền mặt ròng/Vốn hóa | % | Daily (Quarter) |
| 163 | Tăng trưởng doanh thu (YoY) | % | year,quarter |
| 164 | Tăng trưởng EBIT (YoY) | % | year,quarter |
| 165 | Tăng trưởng EBITDA (YoY) | % | year,quarter |
| 166 | Tăng trưởng LNST Hợp nhất (YoY) | % | year,quarter |
| 167 | Tăng trưởng LNST Cổ đông CT mẹ (YoY) | % | year,quarter |

**Format response** (`finance-ticket-data` với TRAILING):
```json
{"REE": [{"id":..., "ticket":"REE", "year":2026, "quarter":1, "account_id":2, "accountId":2, "value":0.423},...]}
```
**Format** (`finance-data-range` với TRAILING):
```json
{"maxYear":2026, "minYear":2015, "maxQuarter":1, "minQuarter":1}
```

### TRAILING per corpType — accountId ranges (verify 2026-05-23)

| corpType | Ngành | Items | accountId range | Đặc trưng riêng |
|---|---|---|---|---|
| 1 | Ngân hàng | 43 | 56–175 | **ROE(67), ROA(68), PE(89), PB(90)** — khác corpType=4. NIM(60), CASA(57), COF(58), YEA(59), NPL(62), SML(63), LLCR(64), CAR-TT41(73), CAR tier1(74), LDR(75), LDR thuần(72), CIR(159), vốn ngắn hạn TDH(76), CreRWA/TA(77), Vốn hóa(85). YoY: NII(168), Fee(169), TOI(170), PPOP(171), LNTT(172), LNST(173) |
| 2 | Bảo hiểm | 14 | 130–145 | ROE(131), ROA(132), cổ tức(134-137), **Vốn hóa(140)**, EPS(141), BVPS(143), PE(144), PB(145). **Lưu ý**: Vốn hóa corpType=2 là 140, KHÔNG phải 35 |
| 3 | Chứng khoán | 29 | 98–174 | Biên LN gộp(99), ROE(104), ROA(105), thị phần môi giới HOSE(107)/HNX(160)/UPCOM(161), dư nợ margin(108), tỷ lệ margin/vốn CSH(109) |
| 4 | Sản xuất/BĐS | 54 | 1–174 | Đầy đủ nhất (xem bảng trên). ROE(8), ROA(9), PE(39), PB(40), Vốn hóa(35), **Net cash(48)** |

> **Verify 2026-05-24** (test thực tế): accountId=48 net cash: HPG=-54,894 tỷ / GAS=+36,893 tỷ / KBC=-15,796 tỷ / PVS=+14,691 tỷ VNĐ.

### finance-ticket-data đặc điểm

- `ticket`: JSON array string, vd `'["VCB","TCB","ACB"]'`
- `date`: MM/DD/YYYY — trả quý/năm **chứa** ngày đó. Dùng `01/01`, `04/01`, `07/01`, `10/01` để chọn Q1-Q4
- **1 date = 1 quý** — loop để lấy time-series (xem `finance_timeseries()`)
- `value` đơn vị: **VND tuyệt đối** cho IS/BS/CF; **tỷ lệ/số tuyệt đối** cho TRAILING

### corpType mapping

| corpType | Ngành |
|---|---|
| 1 | Ngân hàng |
| 2 | Bảo hiểm |
| 3 | Chứng khoán |
| 4 | Sản xuất / BĐS / Khác |

> **Sửa lỗi**: bảng cũ có corpType 2/3 bị đảo. Mapping đúng xác nhận từ TRAILING accountId range: corpType=2→Bảo hiểm(PE=144,ROE=131), corpType=3→Chứng khoán(thị phần môi giới HOSE=107, dư nợ margin=108).

### INCOME_STATEMENT accountId (Bank, corpType=1)

| accountId | Tên |
|---|---|
| 1 | Thu nhập lãi thuần |
| 2 | Thu nhập lãi |
| 3 | Chi phí lãi |
| 4 | Lãi/Lỗ dịch vụ |
| 7 | Lãi/Lỗ ngoại hối |
| 8 | Lãi/Lỗ CKKD |
| 9 | Lãi/Lỗ CKĐT |
| 10 | Lãi/Lỗ hoạt động khác |
| 13 | Thu nhập từ góp vốn |
| 46 | **Tổng thu nhập HĐ** |
| 14 | Chi phí hoạt động |
| 15 | LN trước dự phòng |
| 16 | Chi phí dự phòng RRTD |
| 17 | **LNTT** |
| 21 | **LNST** |
| 22 | Lợi ích CĐTS |
| 23 | Lợi ích CĐCT mẹ |

### INCOME_STATEMENT accountId (Bảo hiểm, corpType=2) — verify 2026-05-24 (38 items)

| accountId | Tên |
|---|---|
| 125 | Doanh thu phí bảo hiểm (tổng) |
| 126 | Thu phí bảo hiểm gốc |
| 127 | Thu phí nhận tái bảo hiểm |
| 131 | (Tăng)/giảm DP phí chưa được hưởng |
| 128 | Phí nhượng tái bảo hiểm |
| 132 | Doanh thu phí BH thuần (1)+(2) |
| 136 | Hoa hồng nhượng tái BH + DT khác HĐ KD BH |
| 142 | Doanh thu thuần HĐ KD BH (3)+(4) |
| 194 | Chi bồi thường (net) |
| 143 | Tổng chi bồi thường (gross) |
| 146 | Thu bồi thường nhượng tái BH |
| 150 | Tổng chi bồi thường BH |
| 152 | (Tăng)/giảm DP nghiệp vụ BH |
| 153 | (Tăng)/giảm DP dao động lớn |
| 154 | Chi phí khác HĐ KD BH |
| 156 | Chi hoa hồng bảo hiểm |
| 169 | Tổng chi phí HĐ KD BH |
| 170 | **Lợi nhuận gộp HĐ KD BH** |
| 173 | LN từ HĐ đầu tư BĐS |
| 178 | Doanh thu HĐ tài chính |
| 179 | Chi phí HĐ tài chính |
| 180 | LN gộp HĐ tài chính |
| 176 | Chi phí quản lý DN |
| 181 | **LN thuần từ HĐ KD** |
| 182 | Thu nhập khác |
| 183 | Chi phí khác |
| 184 | LN từ HĐ khác |
| 185 | **Tổng LNTT** |
| 190 | Chi phí thuế TNDN |
| 191 | **LNST** |
| 192 | Lợi ích CĐTS |
| 193 | **LNST CT mẹ** |

> **Tỷ lệ bồi thường** = accountId=143 / accountId=132 (gross claim / phí thuần). Findicator không có sẵn ratio này — phải tính từ raw IS.

### INCOME_STATEMENT accountId (SX/BĐS, corpType=4)

| accountId | Tên |
|---|---|
| 24 | Doanh thu |
| 26 | Doanh thu thuần |
| 27 | Giá vốn |
| 28 | **Lợi nhuận gộp** |
| 29 | DT tài chính |
| 30 | CP tài chính |
| 31 | CP lãi vay |
| 33 | CP bán hàng |
| 34 | CP QLDN |
| 40 | **LNTT** |
| 43 | **LNST** |
| 44 | Lợi ích CĐTS |
| 45 | Lợi ích CĐCT mẹ |

Xem đầy đủ: `BANK_IS_ACCOUNTS`, `SX_IS_ACCOUNTS` dict trong `collector/findicator_api.py`.

---

## 5c. Overview & News Endpoints (PUBLIC — phát hiện 2026-05-23)

### `/api/overview/legend` — Market snapshot + macro metadata

Trả dict với 15 keys:
- **`dataInit`** — 66 live prices mới nhất: `{nameId, date, value, change, pctChange, pctChangeWeekly, pctChangeMonthly, pctChangeYtd}`. Cover currency/bond/stock/comdty/crypto.
- **`overviewTab`** — 7 tab: id=1 Lãi suất(G), 2 Lạm phát(G), 3 Thất nghiệp(G), 4 PMI SX(G), 5 Vĩ mô VN, 6 XK YoY, 7 NK YoY
- **`dimOverviewGlobal`** / **`dimOverviewVietNam`** / `dimOverviewChina` / `dimOverviewUs` — dim tables (nameId → tên chỉ số)
- **`dimOverviewCurrency/Bond/Stock/Comdty/Crypto`** — dim market data

### `/api/overview/overview-data?tabId={1-7}&repo={}`

Trả `{lastedDate, data:[{id, date, nameId, value, period}]}`.

| tabId | repo | Nội dung | lastedDate | Rows |
|---|---|---|---|---|
| 1 | `overview_global` | Lãi suất các nước | 05/2026 | ~254 |
| 2 | `overview_global` | Lạm phát các nước | 04/2026 | ~335 |
| 3 | `overview_global` | Thất nghiệp | 04/2026 | ~253 |
| 4 | `overview_global` | PMI Sản xuất | 05/2026 | ~371 |
| 5 | `overview_vietnam` | Vĩ mô VN (GDP/FDI/tín dụng/CPI/PMI/lãi suất NHNN) | 05/2026 | ~405 |
| 6 | `overview_vietnam` | Xuất khẩu VN YoY theo ngành hàng | 04/2026 | 448 |
| 7 | `overview_vietnam` | Nhập khẩu VN YoY theo nhóm nguyên liệu | 04/2026 | 408 |

Dùng `nameId` join `dimOverviewGlobal` / `dimOverviewVietNam` từ `overview_legend()` để ra tên.

**tabId=5 — nameId mapping** (verify 2026-05-24):
| nameId | Chỉ số | Giá trị mẫu |
|---|---|---|
| 1 | GDP tăng trưởng (%) | 0.0783 → 7.83% Q1/2026 |
| 2 | FDI thực hiện YoY | 0.1206 → 12.06% |
| 3 | Tín dụng YoY | 0.2281 → 22.8% |
| 4 | Tăng trưởng sản xuất công nghiệp YoY | 0.3556 → 35.6% |
| 5 | CPI (YoY) | 0.0988 → 9.88% |
| 6 | PMI Sản xuất VN | 50.5 (điểm) |
| 7 | Bán lẻ YoY | 0.0769 → 7.69% |
| 8 | XK tổng YoY | 0.1192 → 11.9% |
| 9 | NK tổng YoY | 0.1252 → 12.5% |
| 10 | Thất nghiệp VN (%) | 0.0546 → 5.46% |
| 11 | Khách quốc tế YoY | 0.2277 → 22.8% |
| 66 | Lãi suất tái cấp vốn NHNN (%) | 0.04 → 4% |
| 67 | Lãi suất chiết khấu NHNN (%) | 0.019 → 1.9% |
| 68 | Lãi suất OMO NHNN (%) | 0.059 → 5.9% |
| 69 | Lãi suất tái cấp vốn khác (%) | 0.06075 → 6.08% |

**tabId=4 — PMI Sản xuất global nameId mapping** (verify 2026-05-24, 371 rows, lastedDate=2026-05-01):

| nameId | Quốc gia | Ghi chú |
|---|---|---|
| 34 | China | PMI SX TQ (NBS/Caixin blend) |
| 35 | France | |
| 36 | Germany | |
| 37 | India | |
| 38 | Indonesia | |
| 39 | Italy | |
| 40 | Japan | |
| 41 | South Korea | |
| 42 | Thailand | |
| 43 | United Kingdom | |
| 44 | United States | PMI ISM |
| 45 | Vietnam | PMI Markit VN |
| 49 | Euro Area | PMI tổng EU |

> Gọi: `overview/overview-data?tabId=4&repo=overview_global` → `{lastedDate, data: [{id, date, nameId, value}]}`. Join nameId với `dimOverviewGlobal` từ `overview/legend`.

**tabId=6 — XK VN YoY nameId mapping** (verify 2026-05-24):

> Hai endpoint bổ trợ nhau: `overview-data tabId=6` (nameId = `dimOverviewVietNam.id`) → `month_yoy` (%);
> `macro/metric-data macroItemId=25` (nameId = `dimOverviewVietNam.originalId`) → `month_value` (Triệu USD, 60 rows/5Y).
> Một số item macroItemId=25 có thêm trường `volume` + `price` (đánh dấu ✓).

| tabId=6 nameId | mac25 nameId | Mặt hàng XK | vol+price | Liên quan ngành |
|---|---|---|---|---|
| 12 | 3 | Hàng thủy sản | | cá tra, tôm |
| 13 | 15 | Clanhke và xi măng | ✓ | xi măng |
| 14 | 19 | Hóa chất | | hóa chất/phân bón |
| 15 | 20 | Sản phẩm hóa chất | | hóa chất |
| 16 | 21 | Phân bón các loại | ✓ | phân bón |
| 17 | 24 | Cao su | ✓ | cao su |
| 18 | 25 | Sản phẩm từ cao su | | cao su |
| 19 | 28 | Gỗ và sản phẩm gỗ | | **gỗ** (ngành chưa có dashboard) |
| 20 | 29 | Sản phẩm gỗ (tinh chế) | | **gỗ** |
| 21 | 31 | Xơ, sợi dệt các loại | ✓ | dệt may |
| 22 | 32 | Hàng dệt, may | | dệt may |
| 23 | 40 | Sắt thép các loại | ✓ | thép |
| 24 | 41 | Sản phẩm từ sắt thép | | thép |
| 25 | 43 | Máy vi tính, SP điện tử và linh kiện | | **công nghệ/điện tử** |
| 26 | 44 | Điện thoại các loại và linh kiện | | **công nghệ/điện tử** |
| — | **6** | **Cà phê** | ✓ | cà phê — **Verify 2026-05-24**: 04/2026 = 822.5 Tr USD / 189.9 kT / 4332 USD/T |
| — | **8** | **Hạt tiêu** | ✓ | hồ tiêu — **Verify 2026-05-24**: 04/2026 = 193.9 Tr USD / 30.9 kT / 6265 USD/T |
| — | **9** | **Gạo** | ✓ | lúa gạo — **Verify 2026-05-24**: 04/2026 = 513.9 Tr USD / 1107 kT / 464 USD/T |
| 70 | 1 | Kim ngạch xuất khẩu tổng (YoY) | | macro |

**tabId=7 — NK VN YoY nameId mapping** (verify 2026-05-24):

> Cùng pattern: tabId=7 nameId = `dimOverviewVietNam.id`, macroItemId=26 nameId = `dimOverviewVietNam.originalId`, 60 rows/5Y.

| tabId=7 nameId | mac26 nameId | Nhóm NK | vol+price | Liên quan ngành |
|---|---|---|---|---|
| 27 | 19 | Hóa chất | | hóa chất |
| 28 | 20 | Sản phẩm hóa chất | | hóa chất |
| 29 | 22 | Chất dẻo nguyên liệu | ✓ | **nhựa** |
| 30 | 23 | Sản phẩm từ chất dẻo | | nhựa |
| 31 | 33 | Vải các loại | | dệt may (NVL) |
| 32 | 36 | NPL dệt, may, da, giày | | dệt may |
| 33 | 40 | Sắt thép các loại | ✓ | thép (NK) |
| 34 | 41 | Sản phẩm từ sắt thép | | thép |
| 35 | 43 | Máy vi tính, SP điện tử và linh kiện | | công nghệ |
| 36 | 44 | Điện thoại các loại và linh kiện | | công nghệ |
| 71 | 1 | Kim ngạch nhập khẩu tổng (YoY) | | macro |

### `/api/news` — Tin tức

Params: `page`, `limit`, `search` (full-text), `ticket` (filter theo mã CK).  
Trả `{total, data:[{id, title, createdAt, ticket, categoryName, categoryColor, slugId, contentPath}]}`.  
Tổng ~10,901 tin. `ticket='VCB'` → ~85 tin. `search='lãi suất'` → ~145 tin.

### `/api/enterprise/overview-valuation` — Valuation chart

accountIds quan trọng (SX/BĐS/Index — **KHÔNG** hỗ trợ NH/CK/BH):

| accountId | Ý nghĩa |
|---|---|
| 39 | PE trailing (TTM) |
| 40 | PB trailing (TTM) |
| 154 | PE forward (consensus) |
| 155 | PB forward (consensus) |

Xem `VALUATION_ACCOUNTS` dict trong `collector/findicator_api.py`.

### corpType mapping (finance-label — verify 2026-05-23)

| corpType | Ngành |
|---|---|
| 1 | Ngân hàng |
| 2 | Bảo hiểm |
| 3 | Chứng khoán (69 IS items, 131 BS items) |
| 4 | Sản xuất / BĐS |

---

## 6. Cách gọi (code patterns)

### 6.1 Generic macro call

```python
from collector.findicator_api import FindicatorClient

c = FindicatorClient()  # auto_login=True

# Pattern chuẩn:
rows = c._get('/api/macro/metric-data', {
    'extendID': f'{factTable}-{nameId}-{period}-{valueType}-null-',
    'macroItemId': mid,
    'period': period,          # date / month / quarter
    'valueType': valueType,    # value / yoy / mom / qoq
    'nameId': nameId,
    'filter': '1Y',            # 1Y / 5Y / MAX
    'ticket': '',
    'isSamePeriod': 'false',
})
# rows: list[{id, period, date, name_id, unit, value}]
# date format: "MM/DD/YYYY"
```

### 6.2 Commodity shortcut

```python
from collector.findicator_api import FindicatorClient, COMDTY, _trend

c = FindicatorClient()
rows = c.macro_metric_data(COMDTY['heo_hoi_vn'])  # nameId=9
tr = _trend(rows or [], val='value', date='date')
# tr: {latest, latest_date, mom_pct, yoy_pct, n_points}
```

### 6.3 Sector→commodity mapping

```python
from collector.findicator_api import SECTOR_COMDTY, COMDTY

# Các commodity key cho ngành nhựa:
keys = SECTOR_COMDTY['nhua']  # ['pet_tq','pp_tq','pvc_tq','wti','khi_tn_hh']
nameIds = [COMDTY[k] for k in keys]  # [170, 183, 231, 67, 66]
```

### 6.4 Legend tree → nameIds

```python
leg = c._get('/api/macro/get-label-v2', {
    'dimTable': 'dim_comdty',   # hoặc 'macro_vn_dim_cpi', ...
    'corpTypeId': ''
})
# leg: list[{id, name, unit, child:[...]}]  — cây phân cấp
# Leaf nodes (child=[]) = nameId thực sự có data
```

### 6.5 Tra metric field

```python
menu = c._get('/api/macro/menu-macro', {'isSamePeriod': 'false'}) or []
item = next(x for x in menu if x['id'] == 25)
print(item['metric'])
# {"month": ["value","yoy","mom"], "quarter": ["value","yoy","qoq"], ...}
```

### 6.6 Industry KCN endpoints (PUBLIC, không cần auth)

```python
# Giá đất KCN theo vùng + occupancy rate
region_land = c.call('industry/region-land')

# Giá thuê nhà máy (built-to-lease) theo tỉnh
factory_price = c.call('industry/province-factory')

# FDI vào KCN theo ngành-tỉnh
fdi_by_sector_province = c.call('industry/fdi-sector-by-province')

# FDI tháng/năm (verify 2026-05-23 — filter_type enum đã xác định)
fdi_month = c._get('/api/industry/fdi-status', {'filter_type': 'MONTH', 'year': '1Y'})
# → {fdi_realized: [{date, unit, value}], fdi_sector: [{date, unit, value}]}
fdi_year = c._get('/api/industry/fdi-status', {'filter_type': 'YEAR', 'year': '5Y'})
# → {fdi_realized: [...], fdi_sector: [...], metadata: {last_year_ended, end_time}}
```

### 6.8 Market snapshot — live prices

```python
leg = c.overview_legend()

# 66 live prices (currency/bond/comdty/stock/crypto)
snapshot = {row['nameId']: row for row in leg['dataInit']}
# {nameId: {value, change, pctChange, pctChangeWeekly, pctChangeMonthly, pctChangeYtd}}

# Macro time-series VN (tab 5: GDP/M2/tín dụng)
macro_vn = c.overview_data(5, 'overview_vietnam')
dim_vn = {item['id']: item['name'] for item in leg['dimOverviewVietNam']}
for row in macro_vn['data'][:3]:
    print(dim_vn.get(row['nameId'], row['nameId']), '=', row['value'], row['date'])

# Lãi suất quốc tế (tab 1)
rates = c.overview_data(1, 'overview_global')
dim_g = {item['id']: item['name'] for item in leg['dimOverviewGlobal']}
```

### 6.9 Tin tức theo ticker

```python
# Tin tức gần đây về VCB
news = c.news(ticket='VCB', limit=10)
print(f"Tổng: {news['total']} tin")
for n in news['data']:
    print(n['title'], '—', n['createdAt'])

# Search theo chủ đề
macro_news = c.news(search='lãi suất', limit=5)
```

### 6.10 Finance comparison — BCTC nhiều ticker

```python
from collector.findicator_api import FindicatorClient, BANK_IS_ACCOUNTS

c = FindicatorClient()

# 1 quý, nhiều ticker:
data = c.finance_ticket_data(['VCB', 'TCB', 'ACB'], date='01/01/2026')
# data = {'VCB': [{year, quarter, accountId, value}...], 'TCB': [...]}

# Thu nhập lãi thuần (accountId=1) của VCB:
vcb_rows = data['VCB']
nii = next(r['value'] for r in vcb_rows if r['accountId'] == 1)

# 8 quý time-series:
ts = c.finance_timeseries(['HPG', 'HSG'], n_quarters=8)
# ts = {'HPG': [rows Q1/2026 + Q4/2025 + ... + Q2/2024], 'HSG': [...]}

# Labels cho ngân hàng:
labels = c.finance_label(corp_type=1, table='INCOME_STATEMENT')
# [{id, name, parentId, isWatchList, ...}]
```

### 6.11 GDPNow forecast (macroItemId=139, up-to-date daily)

```python
# GDPNow Fed Atlanta — 5 series daily (C, I, G, X-M, tổng)
gdpnow = c._get('/api/macro/metric-data', {
    'extendID': 'macro_us_gdp_forecast-1-date-value-null-',
    'macroItemId': 139, 'period': 'date', 'valueType': 'value',
    'nameId': 1, 'filter': '1Y', 'ticket': '', 'isSamePeriod': 'false',
})
```

---

## 7. Sector-to-Data Mapping (Pipeline FA)

### COMDTY dict (collector/findicator_api.py)
70+ hàng hoá có tên gợi nhớ. `COMDTY['brent'] = 65`, `COMDTY['heo_hoi_vn'] = 9`...

### SECTOR_COMDTY dict
Mapping sector slug → list COMDTY keys:
```python
SECTOR_COMDTY = {
    "steel":     ["quang_sat_cme","quang_sat_tq","hrc_tq","than_coc_tq","thep_phe_lme","thep_cb300"],
    "chan_nuoi": ["heo_hoi_vn","heo_hoi_tq","ngo_cbot","dau_nanh"],
    "nhua":      ["pet_tq","pp_tq","pvc_tq","wti","khi_tn_hh"],
    "duong":     ["duong_ice","duong_tq","duong_rs_vn"],
    "cao_su":    ["cao_su_jpx","cao_su_sg"],
    "fertilizer":["ure_cme","ure_tq","ure_phu_my","dap_tq","kali_phu_my"],
    "seafood":   ["tom_the_50","tom_the_30","ca_tra_nl"],
    "van_tai_bien":["bdi","bdti","bcti","wci","brent"],
    ...  # xem đầy đủ trong code
}
```

### PLAYBOOK_TO_FINDICATOR dict
Mapping playbook slug → findicator sector name (cho sector dashboard):
```python
PLAYBOOK_TO_FINDICATOR = {
    "vlxd_xi_mang": "cement", "thep": "steel", "cao_su": "rubber",
    "ngan_hang": "bank", "thuy_san": "seafood", ...
}
```

---

## 7b. Steel Sector API — Chi tiết đầy đủ (verify 2026-05-23)

> Base: `GET https://api.findicator.vn/api/steel/{endpoint}` — PUBLIC, không cần auth.

### `steel/legend` — Dimension tables
Trả `dict[4]`:
| Key | Items | Nội dung |
|---|---|---|
| `macroDimComdty` | 5 | Global: Thép phế(47), Quặng sắt(49), Than cốc Úc(159), HRC TQ(167) + 1 nữa. Unit: USD/Tấn hoặc CNY/Tấn |
| `macroDimComdtyVN` | 6 | VN: Thép thanh VN CB300(11), Thép xây dựng(18), HRC-CRC(19), Ống thép(20) + 2 nữa |
| `corpNames` | 1878 | Toàn bộ corp list (id, ticket, floor, corp_name, market_cap_tyvnd, sector, icb_name_vi) |
| `steelCNDimOverall` | 7 | Trung Quốc: Nhập quặng sắt(1), Sản xuất thép thô(2), XK thép(3), NK thép(4), Tồn kho(5), Tiêu thụ(6), SX DN lớn(7) — unit: Triệu tấn |

### `steel/overview/steel-data` — Tổng quan thị trường
Trả `dict[4]`:
| Key | Items | Nội dung |
|---|---|---|
| `steelOverviewDim` | 2 | nameId=40 (Sắt thép các loại), nameId=41 |
| `steelOverviewImportValue` | ~22 | NK thép VN theo tháng: name_id, imported_country_id, value(Tr USD), volume(Nghìn tấn), year |
| `steelManufacturingCountryData` | 666 | SX thép thô global từ 1965: year, countryId, value(Tr tấn) |
| `steelManufacturingCountry` | 19 | dim country: id, country (VN), countryEn, hcKey |

### `steel/enterprise-corp-name` — 4 DN thép niêm yết
```
list[4]: HPG, HSG, NKG, TNA
Fields: id, ticket, floor, corp_type_id, corp_name, market_cap_tyvnd, listed_share_vol, sector, icb_name_vi, short_name
```

### `steel/input-price?macroIds=47,49,159,167&vnMacroIds=11&year=5Y` — Giá nguyên liệu
```
list[6737] period=date_value (daily), fields: id, period, date, name_id, value
name_ids: 11(thép thanh VN), 47(thép phế), 49(quặng sắt), 159(than cốc Úc), 167(HRC TQ)
year: 1Y/3Y/5Y/MAX
```
> Lưu ý: `macroIds` phải là comma-separated string (không phải array). `steel_snapshot()` dùng macroIds="47,49,159,167,177".

### `steel/exchange-rate` — Tỷ giá USD/CNY
```
dict[2]: {usdExchangeRate: [{date, value}...], cnyExchangeRate: [{date, value}...]}
```

### `steel/domestic-market-share?year=5Y` — Thị phần nội địa
```
list[940] period=month_value, fields: id, period, date, ticket, name_id, unit(%), value
Tickers: HPG, HSG, NKG, TVDUC + others
```

### `steel/enterprise-domestic-market-share?ticket=HPG&year=5Y` — Thị phần per-DN
```
list[180] fields: id, period(month_value), date, ticket, name_id, unit(%), value
```

### `steel/enterprise-quantity-structure?ticket=HPG&year=5Y` — Cơ cấu sản lượng per-DN
```
list[120] fields: id, period(month_value), date, ticket, market(export|domestic), unit(Nghìn tấn), value
```

### `steel/domestic-market-data` — Dữ liệu thị trường nội địa (verify 2026-05-23)

Params: `seriesType=TIME_SERIES`, `type=inventory|production|consumption|import|export|sale|hrc|rebar`, `year=1Y/3Y/5Y`

> Lưu ý: chỉ `type=inventory` có data thực (4 series). Các type khác backend trả `[]`.

Response: `[{name_id, data: [{date, name_id, unit(Nghìn tấn), quantity}]}]` — 4 name_ids (18,19,20,21).

### `steel/demand-export-status` — Tồn kho/Xuất khẩu thép

Params: `seriesType=TIME_SERIES`, `year=1Y/3Y/5Y`

Response: `[{name_id, data: [{date, name_id, unit(Nghìn Tấn), quantity}]}]` — 4 name_ids (18,19,20,21).

### `steel/enterprise-sale-data` — Doanh số bán per-DN

Params: `seriesType=TIME_SERIES`, `ticket=HPG`, `type=all`, `year`

> Backend trả `[]` cho HPG (data không có). Thử ticker khác: HSG/NKG/TNA.

---

> **seriesType enum** (verify từ JS bundle 2026-05-23): chỉ có `TIME_SERIES` là valid. YEAR_OVER_YEAR/GROWTH đều 400.

---

## 7c. Sector API — Chi tiết các ngành khác (verify 2026-05-23)

> Base: `GET https://api.findicator.vn/api/{slug}/{endpoint}` — PUBLIC, không cần auth.

### Cement (Xi măng)

**Legend** (`cement/legend`) — dict[4]:
| Key | nameId | Nội dung | Unit |
|---|---|---|---|
| `macroDimComdtyCementLegends` | 54 | Than đá | USD/Tấn |
| `macroVnDimComdtyCementLegends` | 57 | Xi măng Hà Tiên PCB40 (bao 50kg) | VNĐ/kg |
| `macroVnDimPrdIndustrialProductCementLegends` | 29 | Xi măng sản xuất | Triệu tấn |
| `macroVnDimEximExcomdtyCementLegends` | 15 | Clanhke và xi măng | — |

**Endpoints**:
| Endpoint | Params | Data |
|---|---|---|
| `cement/average-export-price` | `year` | Giá XK xi măng trung bình |
| `cement/coal-price` | `year` | Giá than (nameId=54) theo năm |
| `cement/internal-cement-price` | `year` | Giá xi măng nội địa (nameId=57) |
| `cement/legend` | — | Dimension tables (xem trên) |
| `cement/clanhke-value` | `macroIds=15`, `period=month_value`, `year` | Sản lượng/XK clinker monthly — **mới từ JS bundle** |
| `cement/clanhke-year-over-year` | `macroIds=15` | YoY clinker — **mới từ JS bundle** |
| `cement/values-year-over-year` | `macroIds=29` | YoY IIP xi măng — **mới từ JS bundle** |

### Chemistry (Hóa chất / Phân bón)

**Endpoints**:
| Endpoint | Params | Data |
|---|---|---|
| `chemistry/fertilizer-product-price` | `globalMacroIds`, `vnMacroIds`, `year` | list[N] `{id, period(month_value), date, name_id, value}` — giá phân bón tháng |
| `chemistry/overview/caustic-soda-data` | — | Cơ cấu chi phí sản xuất xút (caustic soda) |
| `chemistry/overview/fertilizer-data` | — | dict{ureaCoal, ureaGas, phosphate}: cơ cấu CP SX phân bón (4 items/loại: NVL/Nhiên liệu/KHTSCĐ/Nhân công, year/valuePercent) |
| `chemistry/overview/phosphorus-data` | — | Cơ cấu chi phí sản xuất DAP/MAP |
| `chemistry/value-by-macro-ids` | `macroIds`, `repo`, `year` | Chuỗi thời gian: `repo=macro_comdty_vn` (giá VN), `repo=macro_comdty` (global, trả empty) |
| `chemistry/value-timeseries` | `macroId`, `repo`, `year` | Time-series 1 series |
| `chemistry/value-by-top-countries` | `macroId`, `repo`, `countryCol`, `selectCols`, `year` | Top quốc gia |
| `chemistry/value-year-over-year` | `macroId`, `repo`, `extraCondition`, `selectCols` | YoY |
| `chemistry/legends` | — | Dimension tables ngành hóa chất |

### Rubber (Cao su)

**Legend** (`rubber/legends`) — hashCode string (structure: rubberOverall, rubberApplication, country, rubberFarming).

**Values** (`rubber/values`):
- Params bắt buộc: `repo=macro_comdty`, `period=date_value|month_value`, `macroIds` (CSV)
- Valid nameIds (từ scan): **41** · **51** (cao_su_jpx, JPX) · **91** · **161** (HRC TQ) · 171/181/191/201/221/231/241/251 · **304** (xác nhận từ JS bundle)
- `period=quarter_value` → 400 (không hỗ trợ)
- **year param**: `1Y/3Y/5Y` hoạt động (verify 2026-05-24: 1Y=328 rows / 3Y=895 rows / 5Y=1412 rows). `year=MAX` → trả null (không hỗ trợ)

**`rubber/values-year-over-year`** — YoY:
- Params: `macroIds`, `repo=macro_vn_exim_excomdty`, `year` (verify từ JS bundle)

**Overview** (`rubber/overview/rubber-data`) — dict[4]:
| Key | Items | Nội dung |
|---|---|---|
| `rubberOverall` | 32 | SX cao su VN theo năm: `{id, year, value, type(output), unit(Tấn), countryId}` |
| `rubberApplication` | 9 | Cơ cấu ứng dụng: Lốp xe(65%), Ống dẫn(8%)... `{name, value(%), unit}` |
| `country` | 95 | dim country: `{id, country, countryEn, hcKey}` |
| `rubberFarming` | 20 | Diện tích trồng cao su top quốc gia: `{year, value(ha), countryId}` |

### Pig (Chăn nuôi heo)

**Legend** (`pig/legend`) — dict[4]:
| Key | Items | nameId/Nội dung |
|---|---|---|
| `macroDimComdty` | 4 | Global: Lúa mỳ(92), Ngô(112), Giá heo TQ(260) + 1 |
| `macroDimComdtyVN` | 3 | VN: Giá vốn nuôi(8), Giá heo VN(9), Giá heo giống(63) |
| `pigDimFarmingGlobal` | 5 | id=1 Tăng trưởng đàn VN, id=2 SL xuất chuồng VN, id=3 Số heo nái, id=4,5 ... |
| `macroGlobalDimImportComdty` | 1 | id=88 Meat of swine (thịt heo NK) |

**Endpoints**:
- `pig/macro-comdty` — params: `macroIds`, `period=date_value`, `year`. nameIds: 92(lúa mỳ), 112(ngô), 260(heo TQ)
- `pig/macro-comdty-vn` — params: `macroIds`, `period=date_value`, `year`. nameIds: 8,9,63
- `pig/pig_farming_global` — params: `macroIds`, `period`, `year`. Chú ý: `year=MAX` và `year=5Y` → 400; dùng `year=1Y` và `period=month_value|date_value`

### Aviation (Hàng không)

**Endpoints**:
| Endpoint | Params | Data |
|---|---|---|
| `aviation/legend` | — | dim airports (17 sân bay), dim companies |
| `aviation/dim-airports` | — | list[17] `{id, name, airportCode, nameLegend, sortIndex}` |
| `aviation/flight-company-data` | `period=date_value\|month_value`, `tickets`, `year` | list[N] `{id, period, date, ticket, value, unit(Chuyến bay)}`. tickets=VJC/HVN/BAV |
| `aviation/visitor-come-to-vn` | `macroIds`, `repo=MacroVnInternational`, `period=month_value`, `year` | Khách quốc tế đến VN — **mới từ JS bundle** |
| `aviation/values-year-over-year` | `macroIds`, `repo=MacroVnInternational`, `period`, `year` | YoY — **mới từ JS bundle** |

### Transport (Vận tải biển)

**Legend** (`transport/legends`) — `macroDimComdty` dict[28]:
| nameId | Tên | Unit |
|---|---|---|
| 308 | Supramax (58 000 dwt) | USD/ngày |
| 309 | Capesize (180 000 dwt) | USD/ngày |
| 310 | Panamax (75 000 dwt) | USD/ngày |
| 311 | Handysize (38 000 dwt) | USD/ngày |
| 312 | VLGC (Very Large Gas Carrier) | USD/tháng | latest=6,000,000 |
| 313 | LGC (Large Gas Carrier) | USD/tháng | latest=3,850,000 |
| 314 | MGC (Medium Gas Carrier) | USD/tháng | latest=1,850,000 |
| 315 | HDY SR | USD/tháng | latest=980,000 |
| 316 | ETH tanker | USD/tháng | latest=1,100,000 |
| 317 | SR tanker | USD/tháng | latest=630,000 |
| 318 | COASTER Asia | USD/tháng | latest=550,000 |
| 319 | COASTER Europe | USD/tháng | latest=280,000 |
| 322 | Tàu MR (1 năm) | USD/ngày |
| 339 | Tàu Aframax | USD/ngày |
| 340 | Tàu Suezmax | USD/ngày |
| 341 | Tàu VLCC | USD/ngày |
| 679 | Chỉ số giá cước vận tải dầu thô | — |
| 680 | Chỉ số giá cước dầu sản phẩm | — |
| 681 | Chỉ số giá cước tàu vận tải hàng rời | — |
| 688 | WCI | — |
| 689-696 | Shanghai→Rotterdam/Genoa/LA/NY, Rotterdam→Shanghai/NY, LA→Shanghai | USD/40ft |

**Values** (`transport/values`) — params: `macroIds` (CSV string, KHÔNG cần `repo`), `year=1Y/5Y/MAX`.
- Response: `list[N] {id, period(date_value), date, name_id, value}`
- **Legend nameIds 308-322 đúng là valid** cho `transport/values` (xác nhận từ JS bundle) — charter rates daily/monthly cho Supramax/Capesize/Panamax/Handysize/VLGC/LGC/MGC...
- Internal nameIds 40-97 (từ scan) là data từ macro DB chung, không phải transport-specific

### Stock (Chứng khoán)

**`stock/vn-interest-value`** — Lãi suất huy động ngân hàng:
- Params: `macroIds` (format `"{groupId}-{nameId}"`, VD: `"1-1"`), `year=1Y/5Y`
- Response: `{date, name_id, value, group_id}`
- Metadata từ `stock/vn-interest-metadata`: 15 entries, `id="{groupId}-{nameId}"`, nameLegend như "NHTMCP Nhà nước", "Lãi suất kỳ hạn 1 tháng" (id="1-2")

**`stock/values-by-macro-ids`** — Time-series macro cho stock dashboard:
- Params: `macroIds`, `repo`, `period`, `year`
- Valid repos: `macro_global_stock`, `macro_vn_stock`, `macro_global_bond`, `macro_global_crypto`, `macro_global_exchangerate`
- `stock/vn-stock-metadata?dimRepo=macro_vn_dim_stock` — dim metadata (dimRepo phải là `macro_vn_dim_stock`)

**`stock/enterprise-valuation`** — Định giá per-CTCK:
- Params: `accountIds`, `repo=corp_fin_financialratio_quarter_trailing_daily`, `ticket=SSI`, `year=5Y`

### Electricity (Điện lực) — verify 2026-05-23, HAR-confirmed 2026-05-24

> DN điện xác nhận từ HAR: **ASM, GEG, HDG, HND, NT2, PC1, POW, QTP, REE** (9 DN).
> Cũng có data cho: TBC, CHP, TMP, VSH (trong lake-name/electric-output-plant).
> Base: `GET https://api.findicator.vn/api/electricity/{endpoint}` — PUBLIC, không cần auth.

**No-param endpoints** (trả data ngay):

| Endpoint | Data | Ghi chú |
|---|---|---|
| `electricity/output-resource-name` | list[7]: `{resource_id, name_legend}` — 7 loại nguồn: 1=Thủy, 2=Than, 3=Khí, 5=Gió, 6=Mặt trời, 7=NK&Khác, 8=Tổng | Dùng join với output-resource-by-value |
| `electricity/output-price` | list[N] giá bán điện bình quân (đồng/kWh, monthly): 1411→1748 (2024) | |
| `electricity/electric-description-structure` | Cơ cấu nguồn điện % (Than 37.7%, Thủy 37.8%...) | |
| `electricity/electric-output-plant` | Sản lượng 36 nhà máy (monthly, Triệu kWh): TBC/CHP/HND/NT2... | |
| `electricity/electric_description_solar` | Công suất lắp đặt ĐMTMB (MW, by year): 2018=106→2020=16,656 | |
| `electricity/lake-name` | list[40] hồ thủy điện: `{id, lakename, province, region, level_avg, ticket}` — **verify 2026-05-24**: thêm field `region` (Miền Bắc/Trung/Nam), `level_avg` (mực nước trung bình m) | Join với lake-level |
| `electricity/enso-nearest-date` | 2 ngày forecast gần nhất | |
| `electricity/policy-renewable` | Giá FiT điện tái tạo (Cent/kWh + VNĐ/kWh) theo loại (ĐMT áp mái/mặt đất, Điện gió) | |
| `electricity/policy-resource` | Quy hoạch công suất (MW by year, by loại nguồn) | |

**Params-required endpoints**:

| Endpoint | Params | Data |
|---|---|---|
| `electricity/output-resource-by-value` | `resourceId=1\|2\|3\|6` | Sản lượng Tỷ kWh monthly theo loại nguồn — gọi per resourceId |
| `electricity/output-resource-by-proportion` | `year=5Y\|10Y\|All` | **Tỷ lệ % cơ cấu nguồn** (stacked 100%) — HAR confirmed ✅ (ghi nhầm là broken trước đây) |

> **`output-resource-by-value` + `electric-output-plant`**: KHÔNG hỗ trợ year param. `year=5Y` có trong request nhưng backend bỏ qua — kết quả giống hệt khi không có year. Luôn trả full dataset: output-resource-by-value ~29 rows/resourceId, electric-output-plant = 36 nhà máy. **Verify 2026-05-24**.

| `electricity/input-price-trend` | `nameId=15\|16\|...` | Giá đầu vào trend (monthly, 12 tháng gần nhất) — HAR: nameId=15 (than NK), 16 (Richard Bay) |
| `electricity/latest-input-price` | `nameId=15\|16\|...` | Giá đầu vào mới nhất (2 điểm) |
| `electricity/lake-level` | `lakeId={id}` | Mực nước hồ (m) — gọi per lakeId, HAR: 5,10,12,24,28,30,45 |
| `electricity/enso-forecast` | `date=YYYY-MM-DD` | Xác suất El Niño/La Niña theo tháng — HAR: gọi per date |
| `electricity/enso-history` | `year=1Y\|3Y\|5Y\|All` | Lịch sử chỉ số ENSO (monthly) |
| `electricity/electric_description_manufacturing` | `ticket=HND\|NT2\|CHP\|...` | Sản lượng DN (Triệu kWh, by year 2015-2023) |

**nameId mapping cho input-price-trend/latest-input-price**:
| nameId | Chỉ số | Unit |
|---|---|---|
| 1 | Giá than nhập khẩu | VND/kg (~12-15k = $500-600/tấn) |
| 2 | Dầu FO | VND/lít (~25-29k) |
| 3 | Dầu DO / Than VN nội địa | VND/lít (~26-32k) |
| 4-7, 15 | Giá khí thiên nhiên các pool (SE/Nam Côn Sơn/Cửu Long...) | USD/MMBTU (1.8-3.0) |
| 16 | Giá than quốc tế (Richard Bay) | USD/GJ (~8.5) |
| 17 | Giá bán điện bình quân | VND/kWh |

> `output-resource-by-proportion` ✅ hoạt động bình thường (xác nhận HAR 2026-05-24) — ghi nhầm là 400 trong verify trước. Dùng param `year=5Y|10Y|All`, không có `resourceId`.

### Food-and-Beverage — verify 2026-05-23

**`food-and-beverage/values`** — đã crack repo enum:
- Params: `repo`, `macroIds` (CSV), `year`, `period=month_value|date_value` (**bắt buộc**)
- **Valid repos**: `MacroVnEximImcomdty` (NK nguyên liệu, n=12) · `MacroComdtyVN` (giá VN, n=12)
- Response MacroVnEximImcomdty: `{id, period, date, name_id, unit, value, volume, price, value_unit, volume_unit, price_unit}`
- Response MacroComdtyVN: `{id, period, date, name_id, value}` (compact)

**`food-and-beverage/overview/beer-data`** — dict[4]:
- `beerCostStructure`: cơ cấu chi phí SX bia
- `beerConsumptionByProduct`: tiêu thụ theo sản phẩm (lon/chai/hơi)
- `beerConsumptionByCountry`: tiêu thụ theo quốc gia
- `beerConsumptionByChannel`: tiêu thụ theo kênh (on-trade/off-trade) → dùng cho SAB/BHN/VBL

**`food-and-beverage/overview/milk-data`** — dict[3]:
- `milkDomesticCows`: đàn bò sữa nội địa
- `milkMarketShare`: thị phần sữa
- `milkProductStructure`: cơ cấu sản phẩm → dùng cho VNM/MCM

> **retail**: hoàn toàn placeholder — tất cả endpoint 404 (Findicator chưa có data ngành bán lẻ).

### Textile (Dệt may) — verify 2026-05-23

**`textile/values-by-macro-ids`** — đã crack repo enum (từ JS bundle):
- Params: `repo`, `macroIds` (CSV), `year=1Y/3Y/5Y`, `period=month_value|month_yoy`
- **Valid repos (đầy đủ từ JS bundle)**:
  - `MacroComdty` — giá hàng hoá global (bông/sợi)
  - `MacroVnEximExcomdty` — XK dệt may VN monthly
  - `MacroVnEximExcomdtyCountry` — XK dệt may theo quốc gia
  - `MacroVnEximImcomdty` — NK nguyên liệu VN
  - `MacroVnLabourIndex` — chỉ số lao động ngành dệt
  - `MacroVnPrdIip` — IIP ngành dệt may
  - `MacroGlobalBangladeshExportComdty` — XK Bangladesh (đối thủ)
  - `MacroGlobalChinaExportComdty` — XK Trung Quốc
  - `MacroGlobalIndiaExportComdty` — XK Ấn Độ
  - `MacroGlobalTurkeyExportComdty` — XK Thổ Nhĩ Kỳ
- Response: `{id, period, date, name_id, unit, value, volume, volume_unit, price, price_unit, value_unit}`

**`textile/overview/textile-data`** — dict[4]:
- `textileExportOverall`: tổng XK dệt may VN (Tỷ USD/tháng, ~3.1B USD tháng 4/2026)
- `textileApplication[7]`: cơ cấu ứng dụng (may mặc, nhà, kỹ thuật...)
- `textileExportCountry[9]`: XK sang Mỹ/EU/TQ/Nhật/HQ — dùng ngay cho TCM/TNG/MSH/VGT
- `country[95]`: dim country

### Real-Estate (Bất động sản) — verify 2026-05-23

> **Gap**: `real-estate/supply-demand` KHÔNG tồn tại — đã xác nhận.
> DN chính: VHM, NVL, PDR, DXG, KDH, DIG, NLG.

**No-param endpoints**:

| Endpoint | Data |
|---|---|
| `real-estate/laws` | dict{year:[{url, name, date_effective}]} — chính sách pháp lý BĐS từ 2006-2026 (Luật Đất đai, Nhà ở, Kinh doanh BĐS...) |

**Per-DN endpoints** (params: `tickets={TICKER}`):

| Endpoint | Params | Data |
|---|---|---|
| `real-estate/company-project` | `tickets=VHM` | Danh sách dự án per-DN: tên/địa điểm/quy mô/tiến độ |
| `real-estate/core-index-valuation` | `tickets=VHM` | Định giá per-DN: PE/PB/NAV và các chỉ số cốt lõi |

**Macro BĐS Trung Quốc** (từ macro/metric-data):

| macroItemId | nameId | Nội dung | period |
|---|---|---|---|
| 121 | — | BĐS TQ: Đầu tư phát triển (YoY) | month |
| 122 | — | BĐS TQ: Diện tích sàn | month |
| 123 | — | BĐS TQ: Doanh thu | month |
| 125 | — | BĐS TQ: Đầu tư TS cố định (YoY) | month |

> Không có per-DN time-series từ Findicator → bổ sung từ BCTC `finance_timeseries()` corpType=4.

---

## 7e. Bank Dashboard API — Chi tiết (verify 2026-05-23)

> Base: `GET https://api.findicator.vn/api/bank/{endpoint}` — PUBLIC, không cần auth.
> **Lưu ý**: param `tickets` là **string đơn** ("VCB") không phải JSON array.

| Endpoint | Params | Data |
|---|---|---|
| `bank/legends` | — | dict[10]: bankList(30 NH), macroGlobalDimUnitedStates, macroVnDimInterestRate*, corpDimFin* |
| `bank/bank-list` | — | list[30] NH: ticket, corp_name, floor, market_cap_tyvnd |
| `bank/bank-credit-growth-metadata` | — | dict{dates: list ISO dates theo quý 2019-2026, banks: list 30 NH} |
| `bank/bank-credit-growth?date=2026-03-01` | date(ISO) | list[28] {ticket, date, value=tăng trưởng TD, value_cap=trần NHNN}. **28 NH cùng lúc vs trần NHNN** |
| `bank/bank-credit-growth-by-ticket` | tickets, quarter, year | list[5] chuỗi TG Q1 × 5 năm {ticket, date, value} |
| `bank/overview/bank-data` | — | dict{casaAndCof: CASA+CoF per-bank, yeaAndNpl: YEA+NPL per-bank, crWRA: Credit-RWA/TA} |
| `bank/dxy-index?year=5Y` | year | list[2]: sub[0]=DXY daily (1436 rows, name_id=1), sub[1]=USD/VND daily (1845 rows, name_id=7) |
| `bank/asset-structure?tickets=VCB&year=5Y` | tickets, year | list[100] {year,quarter,date,type(1-5),value} — cấu trúc tài sản theo quý |
| `bank/income-structure?tickets=VCB&year=5Y` | tickets, year | list[100] — cấu trúc thu nhập theo quý |
| `bank/capital-structure?tickets=VCB&year=5Y` | tickets, year | list[100] — cấu trúc vốn (nợ phải trả) theo quý |
| `bank/deposit-interest-rate?tickets=VCB&year=5Y` | tickets, year | list[3495] daily {date, name_id, value}. name_id map từ legend sang kỳ hạn |
| `bank/bank-picture-overview-metadata` | — | dict{quarters: list kỳ có dữ liệu, banks: list NH} |

---

## 8. Endpoints khác (public, không cần auth)

```
GET /api/enterprise/corp-list                               # Toàn bộ DN niêm yết VN (~930KB encrypted) — HAR confirmed
GET /api/enterprise/corp-search?corpText=                   # Tìm kiếm DN theo tên (corpText= trả tất cả) — HAR confirmed
GET /api/enterprise/corp-profile?ticket=VNM
GET /api/enterprise/overview-valuation?ticket=VNM&year=5Y&accountIds=1
GET /api/enterprise/overview-dividend?year=All&ticket=REE   # Lịch sử cổ tức per DN — HAR confirmed
GET /api/enterprise/report-data-prediction?ticket=VNM
GET /api/macro/menu-macro?isSamePeriod=false                # registry 105 chỉ số macro
GET /api/macro/get-label-v2?dimTable=dim_comdty&corpTypeId= # legend tree
```

### Enterprise — Manufacturing endpoints (HAR findicator.vn5, 2026-05-24)

> Auth required (response là hashCode encrypted). Áp dụng cho mọi DN sản xuất (corpType=4) và điện.
> Tickers điện xác nhận: ASM, GEG, HDG, HND, NT2, PC1, POW, QTP, REE.

| Endpoint | Params | Data |
|---|---|---|
| `enterprise/manufactoring-revenue` | `ticket=`, `year=All`, `period=quarter\|year` | Doanh thu per quý/năm per-DN. Response: list[N] `{year, quarter, date, type, value}` (VND tuyệt đối) |
| `enterprise/manufactoring-profit-after-tax` | `ticket=`, `year=All`, `period=quarter\|year` | LNST per quý/năm per-DN. Cùng format với manufactoring-revenue |

**Phân biệt với `manufactoring-revenue-to-profit-ratio`** (đã biết trước):
- `manufactoring-revenue-to-profit-ratio` → waterfall 11 type: DT→LNST breakdown (chi phí từng khoản)
- `manufactoring-revenue` → chỉ DT (series đơn giản, nhiều quý hơn)
- `manufactoring-profit-after-tax` → chỉ LNST (series đơn giản)

**Khi nào dùng gì**: Dùng `manufactoring-revenue`+`manufactoring-profit-after-tax` cho chart trend DT/LNST nhiều quý. Dùng `manufactoring-revenue-to-profit-ratio` cho waterfall 1 quý cụ thể (DT→chi phí→LNST).

---

## 9. Giới hạn & Lưu ý

- **Token TTL**: ~72h, tự refresh qua `login()`. Account: `nduccanh2k3@gmail.com` (free tier).
- **device_id + token UUID**: phải cố định (từ `data/secrets/findicator_creds.json`), không tạo mới.
- **filter=1Y**: trả ~250-360 điểm cho daily, ~12-13 tháng cho monthly.
- **Date parse**: format `"MM/DD/YYYY"` — `_parse_date()` đã xử lý trong client.
- **YoY/MoM đơn vị**: thập phân (0.0349 = 3.49%), KHÔNG phải phần trăm.
- **Rate limit**: chưa xác định — không nên gọi quá dày đặc.
- **`year=MAX` không được hỗ trợ** trên một số sector endpoint: `rubber/values`, `transport/values`, `aviation/flight-company-data` → trả null khi `year=MAX`. Dùng tối đa `year=5Y`. **Verify 2026-05-24**.
- **electricity endpoints không có year param**: `output-resource-by-value` và `electric-output-plant` bỏ qua tham số `year` — luôn trả toàn bộ dataset. Frontend phải tự slice. **Verify 2026-05-24**.
- **Insurance revenue type=1**: chỉ có 1 type (phí BH gốc). Các mã: BVH, BMI, BIC, BLI, MIG, PGI, PRE, PTI, ABI, AIC.
- **corp-list response size**: ~930KB encrypted. Chứa toàn bộ DN niêm yết VN (HOSE+HNX+UPCOM). Dùng làm lookup table corpType/sector, nên cache local, không gọi mỗi request.
- **output-resource-by-proportion**: ✅ hoạt động — trước đây ghi nhầm là 400. Param `year=5Y|10Y|All`, không có resourceId. Khác với `output-resource-by-value` (gọi per resourceId, trả Tỷ kWh tuyệt đối).
- **manufactoring-revenue / manufactoring-profit-after-tax**: HAR xác nhận gọi với `year=All&period=quarter` cho tất cả quý lịch sử per-DN.
- **macroItemId=49 (lãi suất TT2/VNIBOR)**: xác nhận **0 rows** — không có data qua metric-data endpoint. Dùng WiChart `lslnh` (tien_te) làm primary: 3 series (qua đêm/1 tuần/2 tuần, daily, verify 2026-05-24).
- **macroItemId=134 nameId=12,21**: empty — không có data. nameId=12 là nhóm breadth (parent), nameId=21 là nhóm valuation (parent) — chỉ lấy children của chúng (13-20, 22-27).
- **transport/values nameId=339 (Aframax) và 340 (Suezmax)**: **CÓ DATA** — 254/256 rows (5Y), latest 2026-05-20: Aframax=$28,500/ngày, Suezmax=$37,500/ngày. **Verify 2026-05-24**. Khác với 322 (MR) và 341 (VLCC) vẫn trả 0 rows. Thêm vào call transport/values cùng các nameId khác.
- **IIP sub-nameId (macroItemId=7)**: tất cả 12 rows/1Y, period=month, valueType=yoy/mom. Key: điện=25, cao su+nhựa=16, dược=15, gỗ=29, hóa chất=14, thép=18, điện tử=20, dệt=10, may=11. **Verify 2026-05-24**.
- **CPI sub-nameId (macroItemId=4)**: thuốc&DV y tế=16 (YoY+13.58%), DV y tế=5 (YoY+17.65%). **Verify 2026-05-24**.
- **NK dược (macroItemId=26)**: NPL dược phẩm=62 (42.1 Tr USD/tháng), Dược phẩm=63 (369.2 Tr USD/tháng). Gỗ&SP gỗ=28 (301 Tr USD). **Verify 2026-05-24**.
- **FDI theo ngành (macroItemId=15)**: logistics&vận tải kho bãi=8 (366 Tr USD/tháng), KHCN=7 (95), TTCN/ICT=9 (21.7), y tế/dược=15 (1.1). **Verify 2026-05-24, latest=04/2024**.
- **sstock general-data-series confirm (verify 2026-05-24)**: Đường mía HK Future ✅ (4,242 rows, fresh 2026-05-22, $14.71 US¢/lb) · Đường kính SX ✅ (160 rows monthly, 250.9 nghìn tấn) · Ống nhựa 27mm ✅ (92 rows monthly, 12.4 nghìn VNĐ/m) · Ống nhựa 60mm ✅ (31.9 nghìn VNĐ/m) · Ống nhựa 90mm ✅ (68.9 nghìn VNĐ/m) · NaOH TQ ✅ (1,716 rows daily, 620 CNY/T) · Thép HRC TQ ✅ (2,791 rows daily, 3,414 CNY/T) · NK xăng dầu ✅ (208 rows monthly, 1,257 Tr USD). **Lưu ý**: Thị phần giao dịch `Thị phần giao dịch - {TICKER}` chỉ có cho CTCK (SSI/VPS/TCBS...) — không có cho DN logistics/pharma (GMD → 0 rows).
- **macroItemId=25 XK gỗ (nameId=29)**: CÓ DATA, 12 rows/1Y, latest=05/2025=995.5 Tr USD, nhưng `volume` và `price` field = null (khác với cà phê/hạt tiêu/gạo có vol+price). Chỉ có value (Triệu USD). nameId=28 cũng available (Gỗ chưa chế biến, 1,411 Tr USD — nhưng đơn vị có thể bao gồm cả NK).
- **macroItemId=23 (Bán lẻ VN) sub-nameId**: 1=Tổng / 2=Bán lẻ HH / 3=DV lưu trú ăn uống / 4=DV lữ hành / 5=DV khác. Dùng nameId=2 (Bán lẻ HH) cho proxy tiêu dùng nội địa thuần. **Verify 2026-05-24**.
- **industry/filter-company**: trả `{result: [...]}` (wrap trong dict), **không phải** list trực tiếp. Giải nén: `r['result']`.
- **Sector dashboard không tồn tại**: logistics, pharma, retail, wood, sugar, livestock, mining, port, technology — gọi `{slug}/legend` đều trả null. Không có sector hub cho các ngành này trên Findicator (verify 2026-05-24).
- **overview-dividend value đơn vị**: thập phân (0.05 = 5% cổ tức tiền mặt; 0.20 = 20% cổ tức cổ phiếu). type=1=tiền mặt, type=2=cổ phiếu.
- **overview-shareholder ratio**: phần trăm thực (74.8 = 74.8%, không phải thập phân).
- **report-data-prediction realData date**: ISO format `"YYYY-MM-DDT00:00:00.000Z"` (khác với metric-data dùng MM/DD/YYYY). predictData đơn vị VNĐ (số nguyên, không phải nghìn VNĐ).
- **corp-profile**: PUBLIC, không cần auth. Trả snapshot realtime (closePrice, pe, pb, marketCap...) + overview text + website. Dùng thay thế cho finance-ticket-data khi chỉ cần KPI snapshot 1 ticker.

---

## 10. WiChart API — Tóm tắt coverage (verify 2026-05-24)

> Base: `GET https://api.wichart.vn/vietnambiz/vi-mo?name={NAME}&key={KEY}`  
> Public, không cần auth. Không có tham số time range — trả toàn bộ series, frontend tự filter theo `timestamp_ms`.  
> Client: `collector/wichart_api.py` → `WiChartClient`.

### key=hanghoa (giá hàng hóa) — 12 indicators

| name | Mô tả | n_series | n_pts | as_of | Ghi chú |
|---|---|---|---|---|---|
| `thep` | Giá thép xây dựng VN | 3 | 665 | 2026-05-24 | CB240-D6, CB240-D8, CB300-D10 |
| `quang_sat` | Giá quặng sắt | 1 | 719 | 2026-05-24 | CNY/tấn |
| `xang_dau` | Giá xăng dầu | 4 | 515 | 2026-05-22 | WTI + RON95/A92/DO VN |
| `vang` | Giá vàng | 2 | 508 | 2026-05-23 | SJC + vàng miếng |
| `ca_phe` | Giá cà phê | 1 | 554 | 2026-05-21 | Robusta VN (VNĐ/kg) |
| `cao_su` | Giá cao su | 1 | 176 | **2025-02-10** | **⚠ STALE ~15 tháng** |
| `duong` | Giá đường | 1 | 513 | 2026-05-22 | USD/tấn (ICE) |
| `heo_hoi` | Giá heo hơi 3 miền | 1 | 509 | 2026-05-22 | avg 68,833 VNĐ/kg |
| `phan_ure` | Giá phân urê | 2 | 602 | 2026-05-15 | Phú Mỹ + Cà Mau |
| `xi_mang` | Giá xi măng | 1 | 257 | **2025-02-04** | **⚠ STALE ~15 tháng** (CNY/tấn) |
| `tieu` | Giá hồ tiêu VN | 1 | 512 | 2026-05-22 | VNĐ/kg — dùng cho ngành gia vị |
| `lua` | Giá lúa gạo VN | 1 | 618 | 2026-05-14 | nghìn đồng/kg |

### key=tien_te (vĩ mô tiền tệ) — 6 indicators

| name | Mô tả | n_series | n_pts | as_of | Series chính |
|---|---|---|---|---|---|
| `gdp` | GDP VN | 3 | 65 | 2026-03-01 | GDP danh nghĩa / so sánh / tăng trưởng YoY |
| `cpi` | CPI VN (YoY%) | 1 | 280 | 2026-04-01 | — |
| `iip` | IIP (YoY%) | 1 | 148 | 2026-04-01 | Sản xuất công nghiệp |
| `fdi` | FDI | 4 | 148 | 2026-04-01 | Đăng ký / thực hiện / YoY cả hai |
| `lslnh` | Lãi suất liên NH | 3 | 497 | 2026-05-21 | **Qua đêm(5.52%) / 1 tuần(5.97%) / 2 tuần(6.65%)** — PRIMARY cho VNIBOR (macroItemId=49 trống) |
| `dhtg` | Tỷ giá USD/VND | 5 | 505 | 2026-05-22 | Trung tâm / Trần / Sàn / NHTM bán / Tự do bán |

### Lưu ý WiChart
- **Không có filter time (1Y/5Y)**: endpoint nhận `name` + `key` only. Frontend/collector tự cắt theo `timestamp_ms`.
- **Data format**: Highcharts `[[timestamp_ms, value], ...]` — sorted newest-first.
- **cao_su** và **xi_mang**: data stale ~15 tháng (2025-02-04/10) — không dùng làm realtime signal.
- **Primary use cases**: `lslnh` (VNIBOR thay macroItemId=49), `lua`/`tieu` (giá hàng hóa nông nghiệp chưa có trên Findicator), `heo_hoi` cross-check với macroItemId=35 nameId=9.
