# Collector Specifications - Complete API Coverage

**Version**: 1.0  
**Status**: Specification draft  
**Date**: 2026-05-26  

---

## Overview

Mỗi collector là 1 async task chạy hàng ngày (7:30 AM theo giờ HN), fetch data từ Findicator API, cache locally, expose qua REST API.

### Collector Types

1. **MacroCollector** — Vĩ mô (35+ chỉ số)
2. **EnterpriseCollector** — Tài chính doanh nghiệp (50+ endpoints)
3. **OverviewCollector** — Market overview + news (3 endpoints)
4. **SectorCollector** (27 subtypes) — Sector dashboards (100+ endpoints)

---

## 1. MacroCollector

### Responsibility

Fetch tất cả 35+ macroItemId indicators (vĩ mô VN/US/TQ + hàng hoá).

### Implementation

```python
# collectors/macro_collector.py
class MacroCollector(BaseCollector):
    async def collect(self):
        # 1. Commodity (macroItemId=35)
        #    - 107 nameIds: dầu, khí, kim loại, nông sản, vàng, phân bón, cao su, dệt, vận tải
        
        # 2. VN Macro (16 macroItemIds)
        #    - GDP(2,3), CPI(4), PMI(6), IIP(7), Sản phẩm CN(8)
        #    - FDI(15), Bán lẻ(23), XK/NK(25,26)
        #    - Tín dụng(47), Lãi suất(48), Tỷ giá(52,53)
        #    - Trái phiếu(54), Tỷ giá khác(53)
        #    - Khách quốc tế(61), Vận chuyển(29,31)
        #    - OMO(50), Dự trữ ngoại hối(55)
        
        # 3. US Macro (15 macroItemIds)
        #    - CPI(70), PPI(71), GDP(72,73), PCE(75), PMI(78)
        #    - Labor(76), IIP(79,80), Production(81)
        #    - Retail sales(84), Treasury fiscal(138)
        #    - FED rates(96), FED assets(97), GDPNow(139)
        
        # 4. CN Macro (10 macroItemIds)
        #    - CPI(107,108,109), PPI(110,112), PMI(115)
        #    - Industrial(116), Energy(119), Real-estate(121,122,123)
        #    - Investment(125), Retail(126), Exim(127)
```

### API Endpoints Used

| macroItemId | Endpoint | Period | ValueType | Rows/1Y | Update freq |
|-------------|----------|--------|-----------|---------|------------|
| 35 | `/api/macro/metric-data` | date | value | ~6,700 | Daily |
| 4 | `/api/macro/metric-data` | month | yoy/mom | ~13 | Monthly (last day) |
| 6 | `/api/macro/metric-data` | month | value | ~13 | Monthly |
| 7 | `/api/macro/metric-data` | month | yoy/mom | ~12 | Monthly |
| 25 | `/api/macro/metric-data` | month | value | ~12 | Monthly |
| 52 | `/api/macro/metric-data` | date | value | ~250 | Daily |
| [... 29 more ...] | | | | | |

### Cache Strategy

```
cache/
├── macro/
│   ├── comdty.json (107 nameIds, daily)
│   ├── vn_macro.json (16 macroItemIds)
│   ├── us_macro.json (15 macroItemIds)
│   └── cn_macro.json (10 macroItemIds)
└── overview/
    ├── legend.json (66 live prices, metadata)
    ├── overview_data.json (7 tabs)
    └── news.json (latest 100 articles)
```

### Output Schema

```json
{
  "updated_at": "2026-05-26T07:45:00+07:00",
  "comdty": [
    {"nameId": 65, "name": "Dầu Brent", "period": "2026-05-26", "value": 82.5, "change": 0.3, "unit": "USD/Bbl"},
    ...
  ],
  "vn_macro": {
    "gdp": [{"date": "2026-03-31", "value": 7.83, "unit": "%"}],
    "cpi": [{"date": "2026-05-01", "value": 9.88, "unit": "%", "mom": 0.5}],
    ...
  },
  "us_macro": {...},
  "cn_macro": {...}
}
```

---

## 2. EnterpriseCollector

### Responsibility

Fetch enterprise finance data: corp-list, TRAILING metrics (54 chỉ số), BCTC per-DN.

### Implementation

```python
# collectors/enterprise_collector.py
class EnterpriseCollector(BaseCollector):
    async def collect(self):
        # 1. Corp list (~930KB, toàn bộ DN niêm yết)
        #    - HOSE + HNX + UPCOM
        #    - Fields: ticket, corp_name, sector, corpType, marketCap
        
        # 2. TRAILING metrics (54 chỉ số cho corpType=4)
        #    - PE/PB/PS/EV/ROE/ROA/margins/vòng quay/thanh khoản
        #    - Cần finance_ticket_data() cho tất cả 35+ CTCK
        
        # 3. Dividend history (overview-dividend)
        #    - Tất cả CTCK, year=All
        
        # 4. Valuation (overview-valuation)
        #    - PE/PB trailing + forward per-CTCK
        
        # 5. OHLC historical (stock-ohlc)
        #    - 3 năm history per symbol
        
        # 6. Manufacturing (manufactoring-revenue, manufactoring-profit-after-tax)
        #    - Tất cả DN sản xuất (corpType=4)
        #    - period=quarter, year=All
        
        # 7. Bank data (bank-revenue, bank-asset, bank-bad-debt-ratio, bank-debt)
        #    - 30 NH
        #    - period=quarter, year=5Y
        
        # 8. Stock enterprises (stock-revenue, enterprise-stock-asset/debt/revenue)
        #    - 35 CTCK
        #    - period=quarter, year=5Y
```

### API Endpoints Used

| Endpoint | Type | Tickers | Rows |
|----------|------|---------|------|
| `/api/enterprise/corp-list` | GET | all | 930KB |
| `/api/enterprise/overview-valuation` | GET | all | 35+ |
| `/api/enterprise/overview-dividend` | GET | all | variable |
| `/api/enterprise/stock-ohlc` | GET | all symbols | 749+ rows/3Y |
| `/api/enterprise/v2/finance-ticket-data` | GET | batch | 54 metrics |
| `/api/enterprise/manufactoring-revenue` | GET | mfg | variable |
| `/api/enterprise/bank-revenue` | GET | 30 NH | quarterly |
| `/api/enterprise/bank-asset` | GET | 30 NH | quarterly |
| `/api/enterprise/stock-revenue` | GET | 35 CTCK | quarterly |
| [... more ...] | | | |

### Cache Strategy

```
cache/
├── enterprise/
│   ├── corp_list.json (930KB snapshot)
│   ├── trailing_metrics.json (54 metrics × 35+ CTCK)
│   ├── dividend_history.json (all CTCK)
│   ├── valuation_snapshot.json (PE/PB realtime)
│   ├── ohlc_history.json (symbols × 3Y)
│   ├── bank_financials.json (30 NH quarterly)
│   └── mfg_financials.json (corpType=4 quarterly)
```

---

## 3. OverviewCollector

### Responsibility

Fetch market overview: 66 live prices, 7 overview tabs, news feed.

### Implementation

```python
# collectors/overview_collector.py
class OverviewCollector(BaseCollector):
    async def collect(self):
        # 1. Overview legend
        #    - 66 live prices (currency, bond, stock, comdty, crypto)
        #    - 15 dim tables (dimOverviewGlobal, dimOverviewVietNam, etc.)
        
        # 2. Overview data (7 tabs)
        #    - tabId=1: Lãi suất các nước (US, VN, TQ, EU)
        #    - tabId=2: Lạm phát các nước
        #    - tabId=3: Thất nghiệp
        #    - tabId=4: PMI Sản xuất (global + VN)
        #    - tabId=5: Vĩ mô VN (GDP/FDI/tín dụng/CPI/PMI/lãi suất)
        #    - tabId=6: XK VN YoY theo mặt hàng (60 items)
        #    - tabId=7: NK VN YoY theo nhóm NVL
        
        # 3. News
        #    - Tổng ~10,901 tin
        #    - Filter by ticket, search keyword
        #    - Cache top 100 latest
```

### API Endpoints Used

| Endpoint | Params | Rows |
|----------|--------|------|
| `/api/overview/legend` | — | 66 prices + 15 dims |
| `/api/overview/overview-data` | tabId=1..7, repo | 250-400 rows/tab |
| `/api/news` | page=1, limit=100 | 100-10,901 total |

### Cache Strategy

```
cache/
└── overview/
    ├── legend.json (66 prices, 15 dims)
    ├── overview_tabs.json (7 tabs, latest data)
    └── news.json (top 100 articles)
```

---

## 4. SectorCollector (27 subtypes)

### Base Template

```python
# collectors/sector_collector.py (template)
class SectorCollector(BaseCollector):
    SECTOR_CODE = "sector_code"  # e.g., "steel", "bank", "electricity"
    
    async def collect(self):
        # 1. Fetch legend (metadata + dimension tables)
        # 2. Fetch overview (snapshot + structures)
        # 3. Fetch per-DN/ticker data
        # 4. Fetch time-series
        # 5. Fetch comparisons
        # 6. Cache to JSON
```

### 27 Sectors Breakdown

#### **1. Steel (8 endpoints)**
```python
class SteelCollector:
    - steel/legend() → macroDimComdty, macroDimComdtyVN, corpNames, steelCNDimOverall
    - steel/overview/steel-data() → overview snapshot
    - steel/enterprise-corp-name() → 4 DN (HPG, HSG, NKG, TVDUC)
    - steel/input-price(macroIds=47,49,159,167) → giá NVL
    - steel/exchange-rate() → USD/CNY
    - steel/domestic-market-share() → thị phần nội địa per-DN
    - steel/enterprise-quantity-structure() → cơ cấu sản lượng per-DN
    - steel/domestic-market-data() → tồn kho, sản lượng, tiêu thụ
```

#### **2. Bank (14 endpoints)**
```python
class BankCollector:
    - bank/legends() → 30 NH, macro US data, dim tables
    - bank/bank-list() → list 30 NH
    - bank/bank-credit-growth() → credit growth vs trần NHNN
    - bank/overview/bank-data() → CASA/CoF, YEA/NPL, Credit-RWA
    - bank/dxy-index() → DXY, USD/VND
    - bank/asset-structure() → cấu trúc TS per-NH quarterly
    - bank/income-structure() → cấu trúc TN per-NH
    - bank/capital-structure() → cấu trúc vốn
    - bank/deposit-interest-rate() → lãi suất huy động daily
    - [bank-bad-debt-ratio, bank-client-debt, bank-loan-over-time, bank-profit-after-tax]
```

#### **3. Electricity (12 endpoints)**
```python
class ElectricityCollector:
    - electricity/output-resource-name() → 7 loại nguồn
    - electricity/output-price() → giá bán điện bình quân monthly
    - electricity/electric-description-structure() → cơ cấu nguồn %
    - electricity/electric-output-plant() → sản lượng 36 nhà máy
    - electricity/lake-name() → 40 hồ thủy điện + level
    - electricity/enso-nearest-date() → ENSO forecast
    - electricity/output-resource-by-value() → sản lượng per resourceId
    - electricity/output-resource-by-proportion() → tỷ lệ cơ cấu nguồn
    - electricity/input-price-trend() → giá đầu vào monthly
    - electricity/latest-input-price() → giá đầu vào mới nhất
    - electricity/electric_description_manufacturing() → sản lượng per-DN (HND, REE, etc.)
    - [electricity/lake-level, electricity/enso-forecast]
```

#### **4-27. Remaining Sectors**
```
4. Cement (6 endpoints)
5. Pig (3 endpoints)
6. Aviation (4 endpoints)
7. Transport (2 endpoints + 28 freight index)
8. Stock/Securities (9 endpoints)
9. Chemistry (7 endpoints)
10. Rubber (3 endpoints)
11. Textile (4 endpoints)
12. Real-estate (3 endpoints)
13. Food-and-beverage (2 endpoints)
14. Shrimp (7 endpoints)
15. Pangasius (5 endpoints)
16. Industry/KCN (6 endpoints)
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
```

---

## Cache Structure

```
cache/
├── macro/
│   ├── comdty.json
│   ├── vn_macro.json
│   ├── us_macro.json
│   └── cn_macro.json
├── overview/
│   ├── legend.json
│   ├── overview_data.json
│   └── news.json
├── enterprise/
│   ├── corp_list.json
│   ├── trailing_metrics.json
│   ├── dividend_history.json
│   ├── valuation_snapshot.json
│   ├── ohlc_history.json
│   ├── bank_financials.json
│   └── mfg_financials.json
└── sectors/
    ├── steel.json
    ├── bank.json
    ├── electricity.json
    ├── [25 more sectors].json
    └── timestamp.json
```

---

## Error Handling

```python
# Typical error scenarios
1. Token expired → auto-refresh via login_user()
2. API 404 → log warning, continue (endpoint may not exist)
3. API 500 → retry with exponential backoff (1s, 2s, 4s, 8s max)
4. Network timeout → retry 3x, then skip (cache stale data if available)
5. Data mismatch → log error, use previous cached version
```

---

## Update Schedule

| Collector | Frequency | Time (HN) | TTL |
|-----------|-----------|-----------|-----|
| MacroCollector | Daily | 7:30 AM | 24h |
| EnterpriseCollector | Daily | 8:00 AM | 24h |
| OverviewCollector | Daily | 7:45 AM | 24h |
| SectorCollector (all 27) | Daily | Parallel 8:15 AM | 24h |

---

## Testing Strategy

```python
# test_collectors.py
class TestCollectors:
    async def test_macro_collector():
        # 1. Check 35+ macroItemId returns data
        # 2. Check cache file created
        # 3. Check data format (rows, columns, types)
        
    async def test_enterprise_collector():
        # 1. Check corp_list size
        # 2. Check TRAILING metrics coverage (54 items)
        # 3. Check dividend history per-CTCK
        
    async def test_overview_collector():
        # 1. Check 66 live prices
        # 2. Check 7 overview tabs
        # 3. Check news rows
        
    async def test_sector_collectors():
        # 1. Each sector returns legend + overview + data
        # 2. Cache created per sector
        # 3. Error handling (404 endpoints skipped gracefully)
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Total collection time** | <10 minutes | For all 31 collectors in parallel |
| **Cache size** | <500MB | Includes all sectors + macro + enterprise |
| **Cache hit rate** | >95% | Should serve from cache >95% of requests |
| **API response time (p95)** | <500ms | After caching |
| **Token refresh time** | <2s | Should be cached 99%+ of time |

---

## Monitoring & Alerts

```python
# Setup monitoring for:
1. Collector success rate (>99%)
2. Cache file size (should be <500MB)
3. Latest data timestamp (should be <24h old)
4. API error rate (>1% warrants investigation)
5. Cache hit rate (should be >90%)
```

---

**Version**: 1.0  
**Last Updated**: 2026-05-26  
**Status**: Specification complete, ready for implementation
