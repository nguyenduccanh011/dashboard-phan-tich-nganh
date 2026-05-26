# Implementation Plan: Findicator API Complete Integration

**Status**: Draft  
**Last Updated**: 2026-05-26  
**Scope**: 100+ Findicator API endpoints → Sector Hub  
**Timeline**: 8-12 weeks  
**Priority**: Complete coverage - không thiếu cái nào

---

## 📋 Executive Summary

Sector Hub hiện tích hợp **16 API endpoints** từ Findicator (16%). Dự án này sẽ triển khai **100+ API endpoints** bao phủ:

- ✅ **27 sector collectors** (already defined in app.py)
- ✅ **4 routers** (sector, macro, stock, + phân tích)
- ✅ **Macro indicators** (35+ chỉ số vĩ mô)
- ✅ **Enterprise dashboards** (50+ endpoints tài chính)
- ✅ **Frontend UI** cho tất cả sectors

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sector Hub (FastAPI)                         │
├─────────────────────────────────────────────────────────────────┤
│ Frontend (HTML/JS/CSS)                                          │
│ ├─ index.html (home + navigation)                               │
│ ├─ sector.html (template cho 27 sectors)                        │
│ ├─ macro.html (macro indicators + overview)                     │
│ └─ static/js/ (charts, data tables, interactions)               │
├─────────────────────────────────────────────────────────────────┤
│ Backend (FastAPI routers)                                       │
│ ├─ /api/sector/{code} → sector router                           │
│ ├─ /api/macro → macro router (vĩ mô + overview + news)          │
│ ├─ /api/stock → stock router (chứng khoán)                      │
│ └─ /api/enterprise → enterprise router (finance comparison)     │
├─────────────────────────────────────────────────────────────────┤
│ Data Collectors (async tasks)                                   │
│ ├─ base.py (FindicatorClient wrapper)                           │
│ ├─ macro_collector.py (GDP/CPI/PMI/FDI/XK/NK/lãi suất/tỷ giá)   │
│ ├─ sector_collectors/ (27 sectors)                              │
│ │  ├─ steel, bank, electricity, cement, pig, aviation...        │
│ │  ├─ transport, shrimp, textile, realestate, food...           │
│ │  └─ coffee, rubber, pharma, wood, logistics, rice...          │
│ └─ Cache: ./cache/*.json (local SQLite or memory cache)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 API Coverage Breakdown

### Category 1: Authentication (2 endpoints)
- ✅ `POST /api/auth/login-user` — Already in base.py
- ✅ `POST /api/auth/device/check` — Already in base.py

### Category 2: Macro Indicators (4 endpoints) → `macro_collector.py`

| Endpoint | Coverage | Priority |
|----------|----------|----------|
| `/api/macro/metric-data` | 35+ macroItemId (see table below) | 🔴 Critical |
| `/api/macro/menu-macro` | Registry 105 chỉ số | 🔴 Critical |
| `/api/macro/get-label-v2` | Legend trees | 🟠 Important |

**35+ macroItemId targets**:
- **Hàng hoá** (macroItemId=35): 107 nameIds (dầu, khí, kim loại, nông sản, vàng, phân bón, cao su, dệt, vận tải, tàu)
- **Vĩ mô VN** (2-54): GDP, CPI, IIP, FDI, XK/NK, Tín dụng, Lãi suất, Tỷ giá, Trái phiếu, Bán lẻ
- **Vĩ mô US** (70-139): CPI, PMI, GDP, FED rates, Labor, Treasury, GDPNow forecast
- **Vĩ mô TQ** (107-132): CPI, PMI, PPI, GDP, Investment, Real-estate, Retail

### Category 3: Sector Dashboards (100+ endpoints) → `sector_collectors/`

**27 sectors x average 4-5 endpoints/sector = 108-135 endpoints**

| Sector | Endpoints | Data points | Notes |
|--------|-----------|------------|-------|
| **steel** | 8 | 4 DN (HPG/HSG/NKG/TVDUC) | thị phần, sản lượng, giá NVL |
| **cement** | 6 | giá xi măng, than, clinker | sản xuất VN |
| **electricity** | 12 | 9 DN, 36 NM | mực nước hồ, ENSO, giá đầu vào |
| **bank** | 14 | 30 NH | CASA, CoF, NPL, credit growth |
| **pig** | 3 | giá heo VN/TQ, ngô, đậu nành | — |
| **aviation** | 4 | VJC/HVN/BAV chuyến bay | khách quốc tế |
| **transport** | 2 | 28 freight index (Supramax/Aframax/VLGC/container) | charter rates |
| **stock/securities** | 9 | 35 CTCK | thị phần, cơ cấu, lãi suất |
| **chemistry/fertilizer** | 7 | giá phân bón, cơ cấu chi phí | — |
| **rubber** | 3 | cơ cấu ứng dụng, diện tích, giá | — |
| **textile** | 4 | XK dệt may, NK NVL, đối thủ | — |
| **real-estate** | 3 | danh sách dự án, định giá, luật | — |
| **food-and-beverage** | 2 | bia (tiêu thụ, cơ cấu CP), sữa | — |
| **shrimp** | 7 | CMX/FMC/MPC XK tôm | thị trường toàn cầu |
| **pangasius** | 5 | ABT/ACL/ANV/IDI/VHC XK cá | giá ASP per-nước |
| **industry/kcn** | 6 | 12 DN KCN, giá đất, FDI | — |
| **coffee** | 3 | giá cà phê, XK, NK | — |
| **wood** | 2 | XK gỗ, sản xuất | — |
| **pharma** | 3 | giá dược, NK NPL+phẩm, FDI | — |
| **logistics** | 4 | giá vận tải, KCN occupancy | — |
| **rice** | 2 | giá gạo, XK, NK | — |
| **pepper** | 2 | giá tiêu, XK | — |
| **plastics** | 3 | giá nhựa TQ, XK nhựa | — |
| **oilgas** | 4 | giá dầu, sản xuất, NK/XK | — |
| **gold** | 2 | giá vàng, XK | — |
| **technology** | 3 | giá điện tử, XK, NK | — |
| **insurance** | 2 | phí BH, doanh thu | — |

### Category 4: Enterprise Finance (50+ endpoints) → `enterprise_collector.py`

| Subcategory | Endpoints | Priority |
|-------------|-----------|----------|
| **Public enterprise data** | corp-list, corp-search, corp-profile, report-data-prediction, report-analysis | 🔴 Critical |
| **Valuation** | overview-valuation, overview-dividend, overview-shareholder | 🟠 Important |
| **Manufacturing** | manufactoring-revenue, manufactoring-profit-after-tax | 🔴 Critical |
| **Stock enterprises (CTCK)** | stock-revenue, stock-ohlc, enterprise-stock-asset/debt/revenue | 🟠 Important |
| **Bank** | bank-revenue, bank-asset, bank-bad-debt-ratio, bank-debt, bank-profit-after-tax, bank-loan-over-time | 🔴 Critical |
| **Finance comparison (PUBLIC)** | finance-label, v2/finance-data-range, v2/finance-ticket-data, custom-tickets-same-period | 🟠 Important |
| **Insurance** | insurance-revenue | ⚪ Low |

### Category 5: Overview & Market (3 endpoints) → `overview_collector.py`

| Endpoint | Data | Priority |
|----------|------|----------|
| `/api/overview/legend` | 66 live prices + 15 dim tables | 🟠 Important |
| `/api/overview/overview-data` | 7 tabs (lãi suất, lạm phát, PMI, VN macro, XK/NK) | 🟠 Important |
| `/api/news` | 10,901 tin + full-text search | 🟠 Important |

---

## 🎯 Implementation Roadmap (8-12 weeks)

### **Week 1-2: Foundation (Collectors Setup)**

**Objectives**: Cập nhật base collectors, create macro + enterprise collectors

**Files to create/update**:
- [ ] `collectors/base.py` — Update FindicatorClient với toàn bộ 100+ endpoints
- [ ] `collectors/macro_collector.py` — Implement 35+ macroItemId collectors
- [ ] `collectors/enterprise_collector.py` — Finance comparison (54 TRAILING metrics)
- [ ] `collectors/overview_collector.py` — Market overview + news
- [ ] `cache/` — Setup cache strategy (JSON files vs SQLite)

**Effort**: 3-4 developers × 1-2 weeks

---

### **Week 3-4: Sector Collectors (Phase 1)**

**High-priority sectors** (tie to macro + finance):
- [ ] `steel_collector.py` — Refactor, add all 8 endpoints
- [ ] `bank_collector.py` — Refactor, add all 14 endpoints + 30 NH comparison
- [ ] `electricity_collector.py` — Refactor, add all 12 endpoints + 9 DN
- [ ] `cement_collector.py` — Add 6 endpoints
- [ ] `transport_collector.py` — Add 28 freight index endpoints

**Effort**: 2 developers × 2 weeks

---

### **Week 5-6: Sector Collectors (Phase 2)**

**Mid-priority sectors**:
- [ ] `pig_collector.py`, `aviation_collector.py`, `rubber_collector.py`
- [ ] `chemistry_collector.py`, `textile_collector.py`
- [ ] `shrimp_collector.py`, `pangasius_collector.py`

**Effort**: 2 developers × 2 weeks

---

### **Week 7: Sector Collectors (Phase 3)**

**Remaining sectors**:
- [ ] `food_beverage_collector.py`, `realestate_collector.py`
- [ ] `securities_collector.py`, `insurance_collector.py`
- [ ] `plastics_collector.py`, `oilgas_collector.py`, `gold_collector.py`
- [ ] `coffee_collector.py`, `wood_collector.py`, `pharma_collector.py`
- [ ] `logistics_collector.py`, `rice_collector.py`, `pepper_collector.py`
- [ ] `technology_collector.py`

**Effort**: 1 developer × 1 week

---

### **Week 8-9: Routers (APIs)**

**Backend APIs to expose**:
- [ ] `routers/sector.py` — GET /api/sector/{code}, POST /api/sector/{code}/refresh
- [ ] `routers/macro.py` — GET /api/macro/indicators, /api/macro/overview, /api/macro/news
- [ ] `routers/stock.py` — GET /api/stock/valuation, /api/stock/dividend, /api/stock/ohlc
- [ ] `routers/enterprise.py` — GET /api/enterprise/finance-comparison, /api/enterprise/sector-ranking
- [ ] `routers/admin.py` — Manual refresh, cache management, logs

**Effort**: 1-2 developers × 2 weeks

---

### **Week 10-11: Frontend (UI)**

**HTML Templates** (static/):
- [ ] Update `index.html` — Navigation, quick links to 27 sectors + macro
- [ ] Update `sector.html` — Generic template (js loads sector-specific config)
- [ ] Update `macro.html` — 7 macro tabs + overview + news + market snapshot
- [ ] Create `enterprise.html` — Finance comparison, dividend tracker, OHLC charts

**JavaScript** (static/js/):
- [ ] `charts.js` — Chart.js/D3.js wrappers for all chart types
- [ ] `sector-loader.js` — Load sector data + render UI per sector
- [ ] `macro-dashboard.js` — Macro indicators + tabs
- [ ] `enterprise-dashboard.js` — Finance comparison + heatmaps
- [ ] `cache-manager.js` — Client-side caching, refresh signals

**CSS** (static/css/):
- [ ] `base.css` — Responsive grid, colors, typography
- [ ] `sectors.css` — Per-sector color schemes
- [ ] `macro.css` — Tab UI, metric cards
- [ ] `enterprise.css` — Heatmaps, comparison tables

**Effort**: 2 developers × 2 weeks

---

### **Week 12: Testing & Deployment**

- [ ] Integration tests (all 100+ endpoints callable)
- [ ] Load testing (concurrent requests)
- [ ] UI/UX testing (browser compatibility)
- [ ] Performance optimization (caching, lazy-loading)
- [ ] Deployment + monitoring

**Effort**: 1-2 developers × 1 week

---

## 📁 File Structure (To be created/updated)

```
sector-hub/
├── collectors/
│   ├── base.py (EXPAND: 100+ endpoints)
│   ├── macro_collector.py (NEW)
│   ├── enterprise_collector.py (NEW)
│   ├── overview_collector.py (NEW)
│   ├── steel_collector.py (UPDATE)
│   ├── bank_collector.py (UPDATE)
│   ├── electricity_collector.py (UPDATE)
│   ├── cement_collector.py (UPDATE)
│   ├── transport_collector.py (UPDATE)
│   ├── [23 more sector collectors] (NEW)
│   └── __init__.py
│
├── routers/
│   ├── sector.py (UPDATE)
│   ├── macro.py (UPDATE)
│   ├── stock.py (UPDATE)
│   ├── enterprise.py (NEW)
│   ├── admin.py (NEW)
│   └── __init__.py
│
├── static/
│   ├── index.html (UPDATE)
│   ├── sector.html (UPDATE)
│   ├── macro.html (UPDATE)
│   ├── enterprise.html (NEW)
│   ├── css/
│   │   ├── base.css (NEW/UPDATE)
│   │   ├── sectors.css (NEW)
│   │   ├── macro.css (NEW)
│   │   └── enterprise.css (NEW)
│   └── js/
│       ├── charts.js (NEW)
│       ├── sector-loader.js (NEW)
│       ├── macro-dashboard.js (NEW)
│       ├── enterprise-dashboard.js (NEW)
│       └── cache-manager.js (NEW)
│
├── cache/
│   ├── sectors/ (all sector JSON caches)
│   ├── macro/ (macro indicators)
│   └── enterprise/ (finance data)
│
├── app.py (Update task scheduler)
├── requirements.txt (Add dependencies: aiohttp, sqlalchemy, chart libraries)
├── IMPLEMENTATION_PLAN_COMPLETE.md (THIS FILE)
└── docs/
    ├── COLLECTOR_SPEC.md (Detailed spec for each collector)
    ├── API_ENDPOINTS_MATRIX.md (All 100+ endpoints)
    ├── FRONTEND_COMPONENTS.md (UI component library)
    └── DEPLOYMENT_GUIDE.md (Production setup)
```

---

## 🔧 Key Implementation Details

### 1. Base Collector (collectors/base.py)

**Current**: ~200 lines, basic FindicatorClient  
**Target**: ~500 lines, full endpoint coverage

```python
class FindicatorClient:
    # Auth
    - login_user(email, password, device_id)
    - device_check(device_id)
    
    # Macro (35+ endpoints)
    - metric_data(macroItemId, nameId, period, valueType, filter)
    - menu_macro()
    - get_label(dimTable)
    
    # Enterprise
    - corp_list()
    - corp_search(corpText)
    - corp_profile(ticket)
    - overview_valuation(ticket, accountIds)
    - overview_dividend(ticket, year)
    - stock_ohlc(symbol)
    - finance_ticket_data(tickets, date, tableName)
    - [50+ endpoints...]
    
    # Overview
    - overview_legend()
    - overview_data(tabId, repo)
    - news(ticket, search, limit)
    
    # Sector dashboards (calls per-sector)
    - steel_legend()
    - bank_legends()
    - electricity_output_resource_by_value(resourceId)
    - [100+ sector endpoints...]
```

### 2. Macro Collector (collectors/macro_collector.py)

**Responsibilities**:
- Fetch 35+ macroItemId indicators daily
- Cache locally
- Update every 6-12 hours (based on update frequency)

```python
class MacroCollector:
    async def collect():
        # Commodity (107 nameIds)
        - fetch prices (daily): Brent, WTI, coal, metals, agricultural
        
        # VN Macro (16 macroItemIds)
        - GDP, CPI, IIP, FDI, XK/NK, Tín dụng, Lãi suất, Tỷ giá
        - Bán lẻ, Khách quốc tế, Trái phiếu, TTCK
        
        # US Macro (15 macroItemIds)
        - CPI, PMI, GDP, FED rates, US labor, Treasury, GDPNow
        
        # CN Macro (10 macroItemIds)
        - CPI, PMI, PPI, Investment, Real-estate
        
        # Overview
        - 66 live prices, 7 overview tabs, news summary
```

### 3. Sector Collectors (collectors/*_collector.py)

**Template**:
```python
class SectorCollector(BaseCollector):
    SECTOR_NAME = "sector_code"
    ENDPOINTS = [...]  # list of all API endpoints for this sector
    CACHE_TTL = 3600 * 6  # 6 hours
    
    async def collect():
        # 1. Fetch legend/metadata
        # 2. Fetch per-ticker/per-DN data
        # 3. Fetch time-series
        # 4. Fetch comparisons
        # 5. Cache to local JSON/DB
        # 6. Publish refresh signal
```

**27 sectors to implement** with full endpoint coverage.

### 4. Routers (routers/*.py)

**API endpoints to expose**:

```
GET /api/sector/{code}/legend           → metadata
GET /api/sector/{code}/overview         → sector overview
GET /api/sector/{code}/timeseries       → time-series per ticker/DN
GET /api/sector/{code}/comparison       → company comparison
POST /api/sector/{code}/refresh         → manual refresh

GET /api/macro/indicators               → all 35+ macro indicators
GET /api/macro/indicators/{macroItemId} → specific indicator time-series
GET /api/macro/overview                 → 7 overview tabs
GET /api/macro/news                     → news feed

GET /api/stock/valuation                → PE/PB heatmap 35 CTCK
GET /api/stock/dividend                 → dividend history
GET /api/stock/ohlc/{symbol}            → OHLC time-series

GET /api/enterprise/finance-comparison  → Multi-ticker TRAILING metrics
GET /api/enterprise/sector-ranking      → Ranking per sector
GET /api/enterprise/news                → News per-CTCK
```

### 5. Frontend (static/js, html, css)

**Key features**:
- Responsive grid (27 sectors + macro + enterprise)
- Real-time charts (Chart.js / D3.js)
- Client-side caching (IndexedDB / localStorage)
- Search + filter (per-ticker, per-sector, per-metric)
- Mobile-friendly UI
- Dark mode toggle

---

## 🚀 Deployment Strategy

### Phase 1: Staging (Week 13)
- Deploy to staging server
- Full integration test
- Performance profiling
- Bug fixing

### Phase 2: Production (Week 14)
- DNS cutover
- Monitor metrics (response time, cache hit rate, errors)
- A/B test if needed
- Rollback plan ready

### Phase 3: Monitoring (Ongoing)
- Uptime monitoring (99.5%+)
- Error tracking (Sentry)
- Performance tracking (New Relic / DataDog)
- Cache efficiency (hit rate > 90%)

---

## 📊 Success Criteria

| Metric | Target |
|--------|--------|
| **API Coverage** | 100+ endpoints (100%) |
| **Sector Coverage** | 27 sectors (100%) |
| **Uptime** | 99.5% |
| **Response Time** | <500ms (p95) |
| **Cache Hit Rate** | >90% |
| **Mobile Score** | >80 (Lighthouse) |
| **Test Coverage** | >80% |
| **Deployment Time** | <5 minutes |

---

## 👥 Team Requirements

| Role | FTE | Duration |
|------|-----|----------|
| Senior Backend Dev | 1 | 12 weeks |
| Junior Backend Dev | 1 | 12 weeks |
| Frontend Dev | 1.5 | 12 weeks |
| QA/Tester | 0.5 | 12 weeks |
| DevOps/Infra | 0.5 | 12 weeks |

**Total**: ~5 FTE-weeks = 20 person-weeks

---

## 📝 Documentation Deliverables

1. **COLLECTOR_SPEC.md** — Detailed spec for each collector (27 sectors + 4 meta-collectors)
2. **API_ENDPOINTS_MATRIX.md** — Complete mapping of all 100+ endpoints
3. **FRONTEND_COMPONENTS.md** — Reusable UI component library
4. **DEPLOYMENT_GUIDE.md** — Production deployment + monitoring setup
5. **API_REFERENCE.md** — Client-facing API documentation
6. **USER_GUIDE.md** — How to navigate Sector Hub

---

## ⚠️ Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Findicator API rate limits | Medium | High | Batch requests, local cache, fallback to WiChart |
| Findicator data gaps (某些 sectors 缺 data) | High | Medium | Document per-sector data availability, use alternative sources (WiChart, public data) |
| Large dataset caching overhead | Medium | Medium | Use SQLite instead of JSON, implement cache eviction (LRU) |
| Frontend performance (27 sectors × N charts) | Medium | High | Lazy-load, virtualization, async rendering |
| Token expiration/device limits | Low | High | Auto-refresh in collector, exponential backoff |
| Browser compatibility | Low | Low | Polyfills, test on major browsers |

---

## 🎓 Learning Resources

- **Findicator API docs**: `docs/findicator_api.md` (1491 lines, comprehensive)
- **HAR analysis**: `docs/api_gap_analysis_2026-05-26.md` (detailed gap analysis)
- **FastAPI**: https://fastapi.tiangolo.com/
- **Chart.js**: https://www.chartjs.org/
- **APScheduler**: https://apscheduler.readthedocs.io/

---

## 📅 Next Steps

1. **Week 1 (This week)**: 
   - [ ] Finalize this implementation plan
   - [ ] Start collectors/base.py refactor
   - [ ] Setup dev environment + requirements.txt

2. **Week 2**:
   - [ ] Complete macro_collector.py
   - [ ] Complete enterprise_collector.py
   - [ ] Setup cache architecture

3. **Week 3**:
   - [ ] Start sector collectors (high-priority 5)
   - [ ] Begin routers implementation

4. **Week 4+**:
   - [ ] Continue sector collectors in phases
   - [ ] Frontend development in parallel
   - [ ] Integration testing

---

## 📞 Contact & Questions

- **Questions about API spec**: See `docs/findicator_api.md`
- **Gap analysis**: See `docs/api_gap_analysis_2026-05-26.md`
- **Sector-specific details**: See `collectors/{sector}_collector.py` specs (TBD)

---

**Document Version**: 1.0  
**Author**: Implementation Team  
**Last Updated**: 2026-05-26
