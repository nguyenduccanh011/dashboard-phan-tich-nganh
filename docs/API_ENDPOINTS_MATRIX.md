# Findicator API Endpoints Complete Matrix

**Total Endpoints**: 160+  
**Documented**: 100+  
**Sector Hub Coverage Target**: 100% (160+)  
**Last Updated**: 2026-05-26

---

## 📊 Summary by Category

| Category | Count | Priority | Collector | Router |
|----------|-------|----------|-----------|--------|
| **Authentication** | 2 | 🔴 Critical | base.py | — |
| **Macro Indicators** | 4 | 🔴 Critical | macro_collector.py | /api/macro |
| **Overview & Market** | 3 | 🟠 Important | overview_collector.py | /api/overview |
| **Enterprise Finance** | 50+ | 🔴 Critical | enterprise_collector.py | /api/enterprise |
| **Sector Dashboards** | 100+ | 🔴 Critical | sector_collectors/ | /api/sector |
| **TOTAL** | **160+** | | | |

---

## 1️⃣ Authentication (2 endpoints)

| # | Method | Endpoint | Purpose | Status | Collector |
|---|--------|----------|---------|--------|-----------|
| 1 | POST | `/api/auth/login-user` | Login with email/password + deviceId | ✅ Done | base.py |
| 2 | POST | `/api/auth/device/check` | Verify/register device session | ✅ Done | base.py |

---

## 2️⃣ Macro Indicators (4 endpoints)

### Core Macro Endpoints

| # | Method | Endpoint | Purpose | Status | Collector |
|---|--------|----------|---------|--------|-----------|
| 1 | GET | `/api/macro/metric-data` | Get metric data for any macroItemId | ⏳ Pending | macro_collector.py |
| 2 | GET | `/api/macro/menu-macro` | Get list of 105+ macro indicators (metadata) | ⏳ Pending | macro_collector.py |
| 3 | GET | `/api/macro/get-label-v2` | Get legend tree for dimension tables | ⏳ Pending | macro_collector.py |
| 4 | GET | `/api/macro/metrics-labels` | (Inferred) Get metric labels | ⏳ Pending | macro_collector.py |

### macroItemId Breakdown (35+ items)

#### **Hàng hoá (Commodities) — macroItemId=35**
107 nameIds covering:

| Category | nameIds | Examples |
|----------|---------|----------|
| **Năng lượng** | 65-68, 196, 612-628 | Brent, WTI, khí TN, than, xăng, dầu |
| **Kim loại** | 53, 80-86, 111, 114, 161, 171 | Đồng, nhôm, quặng sắt, thép, nickel, chì |
| **Vàng** | 78, 584-585, 730 | ICE gold, SJC, Thế giới |
| **Nông sản** | 87-97, 160, 220, 685 | Cà phê, đậu nành, ngô, lúa mì, đường |
| **Phân bón** | 12-13, 29-30, 50, 156, 190 | Urea, DAP, Kali |
| **Hóa chất** | 165, 182, 213, 253 | Xút, lưu huỳnh, phốt pho |
| **Nhựa** | 170, 183, 203-204, 207-208, 231-232 | PET, PP, PVC, LDPE, HDPE, LLDPE |
| **Cao su** | 51, 93 | JPX, Singapore TSR20 |
| **Dệt may** | 98, 163-168, 185-186, 207-208 | Bông, xơ bông, sợi polyester |
| **Vận tải** | 679-681, 688-689-696 | Freight index, container routes |
| **Tàu hàng** | 308-311, 322, 339-341 | Supramax, Capesize, Panamax, Aframax, Suezmax |
| **Thủy sản** | 2-3, 9, 21-26, 254 | Cá tra, tôm, heo |

**Total**: 107 nameIds, Daily/Monthly data

#### **Vĩ mô Việt Nam — macroItemId 2-61**

| macroItemId | Name | factTable | period | valueType | nameIds | Priority |
|-------------|------|-----------|--------|-----------|---------|----------|
| 2 | GDP danh nghĩa | macro_vn_gdp_nominal | quarter | value | ~10 | 🔴 |
| 3 | GDP so sánh | macro_vn_gdp_real | quarter | value | — | 🔴 |
| 4 | CPI | macro_vn_cpi | month | yoy/mom | 11 | 🔴 |
| 5 | GDP per capita | — | quarter | — | — | ⚪ |
| 6 | PMI | macro_vn_prd_pmi | month | value | 1 | 🔴 |
| 7 | IIP | macro_vn_prd_iip | month | yoy/mom | 12 | 🔴 |
| 8 | Sản phẩm CN | macro_vn_prd_industrialproduct | month | value | 12 | 🟠 |
| 9 | Chỉ số giá NVL | macro_vn_prd_materialpriceindex | quarter | value | — | ⚪ |
| 10 | PPI | macro_vn_prd_ppi | quarter | value | — | 🟠 |
| 12 | Chỉ số tiêu thụ | macro_vn_dim_index_consumption | quarter | value | — | ⚪ |
| 13 | Chỉ số tồn kho | macro_vn_dim_index_inventory | quarter | value | — | ⚪ |
| 15 | FDI theo ngành | macro_vn_fdi_sector | month | value/yoy | 19 | 🔴 |
| 16 | FDI theo quốc gia | macro_vn_fdi_country | month | value/yoy | — | 🟠 |
| 17 | FDI theo địa phương | macro_vn_fdi_province | month | value/yoy | — | 🟠 |
| 18 | FDI vốn thực hiện | macro_vn_fdi_realized | month | value/yoy | — | 🟠 |
| 20 | Vốn đầu tư NSNN | macro_vn_capital_understate | month | value | — | ⚪ |
| 21 | Vốn đầu tư xã hội | macro_vn_capital_social | quarter | value | — | ⚪ |
| 23 | Bán lẻ | macro_vn_retailsales | month/quarter/year | value/yoy | 4 | 🔴 |
| 25 | XK hàng hoá | macro_vn_exim_excomdty | month/quarter/year | value/yoy | 46 | 🔴 |
| 26 | NK hàng hoá | macro_vn_exim_imcomdty | month/quarter/year | value/yoy | 60+ | 🔴 |
| 27 | XNK dịch vụ | macro_vn_exim_service | quarter | value | — | ⚪ |
| 29 | Vận chuyển HK | macro_vn_trans_carriedpassenger | month | value | 3 | 🟠 |
| 30 | Vận chuyển HH | macro_vn_trans_carriedfreight | month | value | 3 | 🟠 |
| 31 | Luân chuyển HK | macro_vn_trans_trafficpassenger | month | value | 3 | 🟠 |
| 32 | Luân chuyển HH | macro_vn_trans_trafficfreight | month | value | 3 | 🟠 |
| 33 | Giá vận tải kho bãi | macro_vn_trans_warehouse | quarter | value | — | ⚪ |
| 47 | Tín dụng | macro_vn_credit_growth | month | value/yoy | 6 | 🔴 |
| 46 | Tổng PTTT | macro_vn_liquidity | month | value | — | 🟠 |
| 48 | Lãi suất huy động | macro_vn_interestrate_commercialbank | date | value | 10 | 🔴 |
| 49 | Lãi suất TT2/VNIBOR | macro_vn_interestrate_centralbank | date | value | 3 | 🔴 |
| 50 | OMO | macro_vn_omo | date | value | 8 | 🟠 |
| 52 | Tỷ giá USD/VND | macro_vn_exchangerate_usd | date | value | 12 | 🔴 |
| 53 | Tỷ giá khác | macro_vn_exchangerate_others | date | value | 11 | 🟠 |
| 54 | Trái phiếu | macro_global_bond | date | value | 22 | 🔴 |
| 55 | Dự trữ ngoại hối | macro_vn_reserves | month | value/yoy | — | 🟠 |
| 56 | Cán cân thanh toán | macro_vn_balance_payment | quarter | value | — | ⚪ |
| 58-60 | Ngân sách NN | macro_vn_statebudget* | quarter | value | — | ⚪ |
| 61 | Khách quốc tế | macro_vn_internationalvisitor | month | value | 35 | 🔴 |
| 134 | TTCK VN | macro_vn_stock | date | value | 27 | 🔴 |
| 135 | XK/NK theo tỉnh | macro_vn_exim_province | month | value | — | ⚪ |
| 136 | Cán cân TM hàng hoá | macro_vn_exim_comdty_net | month | value | — | ⚪ |
| 140 | Cán cân TM hàng hoá | macro_vn_exim_comdty_net | month | value | — | ⚪ |

**Total VN Macro**: 30+ macroItemIds

#### **Vĩ mô Mỹ — macroItemId 70-139**

| macroItemId | Name | nameIds |
|-------------|------|---------|
| 70 | CPI Mỹ | 1 |
| 71 | PPI Mỹ | 1 |
| 72 | GDP thực (phương pháp chi tiêu) | — |
| 73 | GDP thực (theo ngành) | — |
| 74 | GDP theo tiểu bang | 60 |
| 75 | PCE | — |
| 76 | Lao động | 6 |
| 78 | PMI Mỹ | 1 |
| 79 | IIP theo sản phẩm | — |
| 80 | IIP theo ngành | 4 |
| 81 | Production Index | 5 |
| 84 | Doanh số bán lẻ | 24 |
| 87 | XNK Mỹ | — |
| 95 | Cung tiền Mỹ | — |
| 96 | Lãi suất FED | 3 |
| 97 | FED Total Assets | 1 |
| 98 | CB balance sheet | 3 |
| 99 | Tài chính công | 6 |
| 100 | Tồn kho bán lẻ | — |
| 103 | Cán cân TT | 5 |
| 104 | Dòng vốn ngoại | 12 |
| 138 | US Treasury | 2 |
| 139 | GDPNow Fed | 5 |

**Total US Macro**: 20+ macroItemIds

#### **Vĩ mô Trung Quốc — macroItemId 107-132**

| macroItemId | Name | valueType |
|-------------|------|-----------|
| 107 | CPI toàn quốc | value/yoy/mom |
| 108 | CPI thành thị | value/yoy/mom |
| 109 | CPI nông thôn | value/yoy/mom |
| 110 | PPI NXS | value/yoy |
| 112 | PPI CN | value/yoy |
| 115 | PMI TQ | value (28 chuỗi) |
| 116 | Sản phẩm CN | value/yoy |
| 119 | Sản lượng năng lượng | value/yoy |
| 121 | BĐS phát triển | value/yoy |
| 122 | BĐS diện tích sàn | value/yoy |
| 123 | BĐS doanh thu | value/yoy |
| 125 | Đầu tư TS cố định | value/yoy |
| 126 | Bán lẻ TQ | value/yoy |
| 127 | XNK TQ | value/yoy |
| 131 | Tài khóa TQ | value/yoy |
| 132 | Cung tiền TQ | value/yoy |

**Total CN Macro**: 16 macroItemIds

---

## 3️⃣ Overview & Market (3 endpoints)

| # | Method | Endpoint | Purpose | Status | Collector | Router |
|---|--------|----------|---------|--------|-----------|--------|
| 1 | GET | `/api/overview/legend` | 66 live prices + metadata | ⏳ Pending | overview_collector.py | /api/overview/legend |
| 2 | GET | `/api/overview/overview-data` | 7 tabs (lãi suất/lạm phát/PMI/VN macro/XK/NK) | ⏳ Pending | overview_collector.py | /api/overview/tabs |
| 3 | GET | `/api/news` | News feed + search | ⏳ Pending | overview_collector.py | /api/news |

---

## 4️⃣ Enterprise Finance (50+ endpoints)

### 4.1 Public Enterprise Data (5 endpoints)

| # | Method | Endpoint | Purpose | Status | Collector |
|---|--------|----------|---------|--------|-----------|
| 1 | GET | `/api/enterprise/corp-list` | All listed companies (~930KB) | ⏳ Pending | enterprise_collector.py |
| 2 | GET | `/api/enterprise/corp-search` | Search companies by name | ⏳ Pending | enterprise_collector.py |
| 3 | GET | `/api/enterprise/corp-profile` | Company profile snapshot | ⏳ Pending | enterprise_collector.py |
| 4 | GET | `/api/enterprise/report-data-prediction` | 3Y OHLC + prediction | ⏳ Pending | enterprise_collector.py |
| 5 | GET | `/api/enterprise/report-analysis` | Broker analysis reports | ⏳ Pending | enterprise_collector.py |

### 4.2 Valuation Endpoints (3 endpoints)

| # | Method | Endpoint | Purpose | Priority | Status |
|---|--------|----------|---------|----------|--------|
| 1 | GET | `/api/enterprise/overview-valuation` | PE/PB snapshot | 🔴 | ⏳ Pending |
| 2 | GET | `/api/enterprise/overview-dividend` | Dividend history | 🔴 | ⏳ Pending |
| 3 | GET | `/api/enterprise/overview-shareholder` | Major shareholders | 🟠 | ⏳ Pending |

### 4.3 Manufacturing Endpoints (2 endpoints)

| # | Method | Endpoint | Purpose | Status |
|---|--------|----------|---------|--------|
| 1 | GET | `/api/enterprise/manufactoring-revenue` | Revenue quarterly | ⏳ Pending |
| 2 | GET | `/api/enterprise/manufactoring-profit-after-tax` | Profit quarterly | ⏳ Pending |

### 4.4 Stock Enterprises (3 endpoints)

| # | Method | Endpoint | Purpose | Status |
|---|--------|----------|---------|--------|
| 1 | GET | `/api/enterprise/stock-ohlc` | 3Y OHLC history per symbol | ⏳ Pending |
| 2 | GET | `/api/enterprise/stock-revenue` | Revenue per CTCK | ⏳ Pending |
| 3 | GET | `/api/enterprise/enterprise-stock-asset` | Asset structure per CTCK | ⏳ Pending |

### 4.5 Finance Comparison (PUBLIC) — 4 endpoints

| # | Method | Endpoint | Purpose | Status |
|---|--------|----------|---------|--------|
| 1 | GET | `/api/enterprise/finance-label` | 54 TRAILING metrics labels | ⏳ Pending |
| 2 | GET | `/api/enterprise/v2/finance-data-range` | Data range per ticker | ⏳ Pending |
| 3 | GET | `/api/enterprise/v2/finance-ticket-data` | TRAILING metrics per-ticket | ⏳ Pending |
| 4 | GET | `/api/enterprise/custom-tickets-same-period` | Same period comparison | ⏳ Pending |

### 4.6 Bank Endpoints (10 endpoints)

| # | Method | Endpoint | Purpose | Status |
|---|--------|----------|---------|--------|
| 1 | GET | `/api/enterprise/bank-revenue` | Revenue per NH | ⏳ Pending |
| 2 | GET | `/api/enterprise/bank-asset` | Asset structure per NH | ⏳ Pending |
| 3 | GET | `/api/enterprise/bank-bad-debt-ratio` | NPL ratio | ⏳ Pending |
| 4 | GET | `/api/enterprise/bank-client-debt` | Client debt structure | ⏳ Pending |
| 5 | GET | `/api/enterprise/bank-debt` | Debt structure | ⏳ Pending |
| 6 | GET | `/api/enterprise/bank-debt-by-bond-issuer` | Bond issuer debt | ⏳ Pending |
| 7 | GET | `/api/enterprise/bank-loan-over-time` | Loan over time | ⏳ Pending |
| 8 | GET | `/api/enterprise/bank-profit-after-tax` | Profit per NH | ⏳ Pending |
| 9 | GET | `/api/enterprise/bank-capital-structure` | Capital structure | ⏳ Pending |
| 10 | GET | `/api/enterprise/bank-deposit-interest-rate` | Deposit rates | ⏳ Pending |

**Total Enterprise**: 50+ endpoints

---

## 5️⃣ Sector Dashboards (100+ endpoints)

### **1. Steel (8 endpoints)**

```
steel/legend
steel/overview/steel-data
steel/enterprise-corp-name
steel/input-price
steel/exchange-rate
steel/domestic-market-share
steel/enterprise-domestic-market-share
steel/enterprise-quantity-structure
```

### **2. Cement (6 endpoints)**

```
cement/legend
cement/average-export-price
cement/coal-price
cement/internal-cement-price
cement/clanhke-value
cement/values-year-over-year
```

### **3. Electricity (12 endpoints)**

```
electricity/output-resource-name
electricity/output-price
electricity/electric-description-structure
electricity/electric-output-plant
electricity/electric_description_solar
electricity/lake-name
electricity/lake-level
electricity/enso-nearest-date
electricity/enso-forecast
electricity/enso-history
electricity/policy-renewable
electricity/policy-resource
electricity/output-resource-by-value
electricity/output-resource-by-proportion
electricity/input-price-trend
electricity/latest-input-price
electricity/electric_description_manufacturing
```

### **4-27. Remaining Sectors** (similar breakdown)

Each sector has 2-15 endpoints covering:
- Legend/metadata
- Overview/snapshots
- Per-company/DN time-series
- Comparisons
- Market analysis

**Complete list**:
4. Bank (14 endpoints)
5. Pig (3 endpoints)
6. Aviation (4 endpoints)
7. Transport (2 endpoints)
8. Stock/Securities (9 endpoints)
9. Chemistry (7 endpoints)
10. Rubber (3 endpoints)
11. Textile (4 endpoints)
12. Real-estate (3 endpoints)
13. Food-and-beverage (2 endpoints)
14. Shrimp (7 endpoints)
15. Pangasius (5 endpoints)
16. Industry (6 endpoints)
17. Coffee (3 endpoints)
18. Wood (2 endpoints)
19. Pharma (3 endpoints)
20. Logistics (4 endpoints)
21. Rice (2 endpoints)
22. Pepper (2 endpoints)
23. Plastics (3 endpoints)
24. Oil & Gas (4 endpoints)
25. Gold (2 endpoints)
26. Technology (3 endpoints)
27. Insurance (2 endpoints)

---

## 📋 Implementation Checklist

- [ ] Category 1: Authentication (2/2) — ✅ Done
- [ ] Category 2: Macro Indicators (4/4)
  - [ ] `/api/macro/metric-data`
  - [ ] `/api/macro/menu-macro`
  - [ ] `/api/macro/get-label-v2`
  - [ ] Cache all 35+ macroItemId
  
- [ ] Category 3: Overview & Market (3/3)
  - [ ] `/api/overview/legend`
  - [ ] `/api/overview/overview-data`
  - [ ] `/api/news`
  
- [ ] Category 4: Enterprise Finance (50+/50+)
  - [ ] Public enterprise data (5)
  - [ ] Valuation (3)
  - [ ] Manufacturing (2)
  - [ ] Stock enterprises (3)
  - [ ] Finance comparison (4)
  - [ ] Bank (10)
  
- [ ] Category 5: Sector Dashboards (100+/100+)
  - [ ] Steel (8/8)
  - [ ] Cement (6/6)
  - [ ] Electricity (12/12)
  - [ ] Bank (14/14)
  - [ ] Remaining sectors (23)

---

**Status**: 160+ endpoints mapped  
**Implementation Priority**: Macro → Overview → Enterprise → Sectors (parallel)  
**Timeline**: 8-12 weeks  
**Target**: 100% coverage (160+/160+)

