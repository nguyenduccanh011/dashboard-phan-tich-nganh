# Sector Hub API Enrichment Plan

## Current Status: 14/27 Sectors Tested OK ✓

### Verified Working Sectors (với dữ liệu hiện có)

| Sector | Tickers | Current Blocks | Enhancement Opportunity |
|--------|---------|---|---|
| **Electricity** | 9 | A,B,C,D,E,F,G | ✓ Thêm ENSO forecast, lake level trends |
| **Steel** | 4 | A,B,C,D,E,F,G | ✓ Thêm per-company production vs market share |
| **Cement** | 3 | A,B,C,D,E,F | ⚠️ Gap: không có per-DN production |
| **Pig** | 3 | A,B,C,D,E,F | ⚠️ Gap: không có per-DN feedstock cost |
| **Chemistry** | 6 | A,B,C,D,E,F | ✓ Thêm cost structure từ BCTC |
| **Bank** | 10 | A,B,C,D,E,F,G | ✓ Deposit rates, credit growth by sector |
| **Stock** | 7 | A,B,C,D,E,F | ⚠️ Missing sector indices (VNFIN, VNMAT...) |
| **Textile** | 6 | A,B,C,D,E,F | ✓ Thêm export by country |
| **Rubber** | 3 | A,B,C,D,E,F,G | ⚠️ Gap: không có per-DN export |
| **Food & Beverage** | 6 | A,B,C,D,E,F | ⚠️ Market share static 2022 |
| **Real-Estate** | 5 | A,B,C,D,E,F | ❌ Missing: supply-demand endpoint |
| **Transport** | 6 | A,B,C,D,E,F | ⚠️ Gap: không có per-DN fleet data |
| **Shrimp** | 3 | A,B,C,D,E,F,G | ✓ Export + pricing per-company |
| **Pangasius** | 5 | A,B,C,D,E,F,G | ✓ Export + pricing per-company |

---

## Data Blocks Explanation

| Block | Meaning | Current Coverage |
|-------|---------|---|
| **A** | Macro commodity prices | 100+ series (comdty macroItemId=35) |
| **B** | VN Macro (CPI, PMI, IIP, FDI, etc.) | Selected items per sector |
| **C** | Enterprise per-company data | BCTC (revenue, profit, assets) |
| **D** | Sector-specific APIs | Findicator endpoints |
| **E** | Global benchmarking | US/China macro indexes |
| **F** | Market valuation | PE/PB/PS metrics |
| **G** | Specialized data | Lake levels, export markets, etc. |

---

## Enrichment Action Items (Priority)

### 🔴 HIGH PRIORITY — Missing Critical Data

#### 1. **Electricity** — Add ENSO Real-time Data
```python
# Current: Historical ENSO only
# Add: Real-time ENSO forecast + historical comparison

electricity_collector.py:
- electricity/enso-forecast (real-time) ✓ already in HAR
- electricity/enso-history (5Y) ✓ already in HAR
- Add: enso-nearest-date correlation with output-resource
```

**API calls needed:** 2 more (already have from HAR)

#### 2. **Steel** — Add Market Share vs Production Comparison
```python
# Current: Per-company revenue only
# Add: Production volume breakdown + market share calculation

steel_collector.py:
- macro/metric-data?macroItemId=8&nameId=30 (IIP thép) - monthly output
- enterprise/stock-ohlc?symbol=HPG/HSG/NKG - daily prices
- bank-loan-by-sector (if available) - financing analysis
```

**New API calls:** 3

#### 3. **Bank** — Add Credit Growth by Sector
```python
# Current: Per-bank metrics only
# Add: Macro credit growth + sector breakdown

bank_collector.py:
- macro/metric-data?macroItemId=47 (tín dụng by sector) ✓
- macro/metric-data?macroItemId=48 (lãi suất huy động) ✓
- macro/metric-data?macroItemId=52 (USD/VND) ✓
```

**Status:** ✓ Already defined, just need to verify calls

#### 4. **Stock** — Add Missing Sector Indices
```python
# Current: 4/9 sector indices (VNCOND/VNCONS/VNDIAMOND/VNENE)
# Missing: VNFIN, VNMAT, VNHEAL, VNREAL, VNUTIL

# Solution: Use external source (VNDirect API) or note as unavailable
# Findicator confirmed: only 4 sectors available (verify 2026-05-24)
```

**Status:** ❌ Cannot fix via Findicator, need external data

#### 5. **Real-Estate** — Workaround supply-demand Gap
```python
# Current: Project list + valuation
# Issue: real-estate/supply-demand endpoint DOES NOT EXIST

realestate_collector.py:
- real-estate/company-project ✓
- real-estate/core-index-valuation ✓
- SKIP: real-estate/supply-demand (broken endpoint)
- ADD: Fallback to project-level tracking
```

**Status:** ⚠️ Document workaround, no fix available

---

### 🟡 MEDIUM PRIORITY — Enhance Existing Data

#### 6. **Cement** — Estimate Per-DN Production
```python
# Since no per-DN API, calculate from:
cement_collector.py:
- macro/metric-data?macroItemId=8?nameId=29 (cement output)
- enterprise/manufactoring-revenue (per-company revenue)
- Formula: Each_DN_share = DN_revenue / total_revenue × total_output
```

**New API calls:** 1

#### 7. **Textile** — Add Export by Country
```python
# Current: Only macro export numbers
textile_collector.py:
- macro/metric-data?macroItemId=25&nameId=31/32 (XK dệt/may) ✓
- ADD: textileExportCountry endpoint (from docs)
- ADD: Per-company export from enterprise-export-status (if available)
```

**New API calls:** 1-2

#### 8. **Food & Beverage** — Add Market Trend
```python
# Current: Static market share 2022
# Solution: Estimate trend from revenue + export data

food_beverage_collector.py:
- macro/metric-data?macroItemId=25&nameId=6/8/9 (coffee/pepper/rice export)
- macro/metric-data?macroItemId=7&nameId=7/8 (IIP food/beverage)
- enterprise/manufactoring-revenue (per-company)
```

**New API calls:** 2

#### 9. **Rubber** — Export by Country
```python
rubber_collector.py:
- macro/metric-data?macroItemId=25&nameId=24 (rubber XK) ✓
- macro/metric-data?macroItemId=35&nameId=51/93 (rubber prices JPX/Singapore) ✓
- ADD: Export market breakdown (if available from another endpoint)
```

**Status:** ✓ Mostly complete, just format data better

#### 10. **Transport** — Freight Index Trending
```python
transport_collector.py:
- macro/metric-data?macroItemId=35&nameId=679-696 (freight indices) ✓
- macro/metric-data?macroItemId=35&nameId=308-341 (ship charter) ✓
- ADD: YoY comparison + trend analysis
```

**Status:** ✓ Already have data, just format better

---

### 🟢 LOW PRIORITY — Polish UI

#### 11. **General UI Enhancements**
- [ ] Add comparison charts (sector vs macro index)
- [ ] Add forecast widgets (ENSO, FDI, credit growth)
- [ ] Add sector valuation widgets (PE/PB/PS distribution)
- [ ] Add market size pie charts (market share per-DN)

---

## Implementation Roadmap

### Phase 1: Quick Wins (2-3 hours)
- ✓ Fix sector endpoint mapping (DONE)
- [ ] Add macro data to collections (CPI, PMI, IIP, credit, FDI)
- [ ] Format and display existing Block E (US/China macro)
- [ ] Create comparison widgets

### Phase 2: API Enhancements (4-6 hours)
- [ ] Add per-DN production estimation (cement, pig, rubber)
- [ ] Add export market breakdown (textile, coffee, rice)
- [ ] Add forecast widgets (ENSO, credit growth)

### Phase 3: UI Polish (2-3 hours)
- [ ] Dashboard layout improvements
- [ ] Interactive charts (sector vs macro)
- [ ] Mobile responsive design

### Phase 4: External Data Integration (2-3 hours)
- [ ] VNDirect API for missing stock indices
- [ ] Savills/CBRE for real-estate market
- [ ] Bloomberg for commodity forecast

---

## Collectors to Enhance (Priority Order)

### Immediate (High Impact)
1. `bank_collector.py` — Add macro credit by sector
2. `electricity_collector.py` — Verify ENSO integration
3. `steel_collector.py` — Add production comparison

### Short-term (Medium Impact)
4. `cement_collector.py` — Add production estimation formula
5. `textile_collector.py` — Add export by country
6. `food_beverage_collector.py` — Add trend calculation

### Long-term (Polish)
7. `real-estate_collector.py` — Document workarounds
8. `stock_collector.py` — Note missing indices
9. All others — Add formatted comparison data

---

## API Metrics Summary

| Metric | Count | Status |
|--------|-------|--------|
| Available macro items (VN/US/China) | 82+ | ✓ Exist |
| Commodity price series | 100+ | ✓ Used in some sectors |
| Sector-specific endpoints | 27 | ✓ 14 verified |
| Enterprise endpoints | 15+ | ✓ Used for BCTC |
| Missing per-DN APIs | 5 sectors | ❌ Workaround via BCTC |
| Broken endpoints | 1 (real-estate supply-demand) | ❌ Document only |

---

## Next Steps

1. Pick Phase 1 tasks and implement enhancements
2. Test each sector with `/run` before deploying
3. Update this document with actual implementation details
4. Create UI mockups for new widgets

**Generated:** 2026-05-26
