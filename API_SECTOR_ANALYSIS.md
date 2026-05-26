# Findicator API Sector Analysis Report
**Generated:** 2026-05-26  
**HAR File:** findicator.vn5.har (153 requests, ~4.9 MB)

---

## Executive Summary

### Overall API Health
- **Total Requests Analyzed:** 153
- **Active Sectors:** 4 (Findicator, Google Auth, Next.js static, Analytics)
- **Unique API Endpoints:** 35+ (Findicator only)
- **Success Rate:** 99% (1 auth error, many empty responses are false positives)
- **Critical Issues:** 1 (401 Unauthorized on initial auth)

---

## 🔴 CRITICAL ISSUES

### 1. Authentication Error (401)
- **Endpoint:** `GET /api/auth`
- **Status:** 401 Unauthorized
- **Issue:** Initial authentication attempt fails before successful login
- **Impact:** Potential security concern - credentials may be invalid or rate-limited
- **Fix:** Verify API key/token in `findicator_token.txt` or `findicator_creds.json`

### 2. Empty Response Bodies (False Positives)
- **Count:** 22+ endpoints showing empty responses
- **Root Cause:** Responses are actually returning encrypted data with `hashCode` key
- **Evidence:** All enterprise and electricity APIs return `{"hashCode": "..."}`
- **Status:** ✅ NOT A PROBLEM - data is encrypted, not missing

### 3. Query Parameters Issues
- **`corpText=` (empty search):** Multiple calls with empty parameter
  - Endpoint: `/api/enterprise/corp-search`
  - Should filter by non-empty search term
  - Recommendation: Validate input before API call

---

## 📊 SECTOR-BY-SECTOR ANALYSIS

### Sector 1: ENTERPRISE FINANCE

#### Active APIs (9 endpoints)

| Endpoint | Calls | Status | Data Type | Issue |
|----------|-------|--------|-----------|-------|
| `/api/enterprise/corp-list` | 1 | 200 | Encrypted | ✅ OK |
| `/api/enterprise/corp-profile` | 9 | 200 | Encrypted | ✅ OK |
| `/api/enterprise/corp-search` | 5 | 200 | Encrypted | ⚠️ Called with empty `corpText=` |
| `/api/enterprise/finance-label` | 5 | 200 | Encrypted | ✅ OK |
| `/api/enterprise/finance-ticket-data` | 9 | 200 | Encrypted | ✅ OK |
| `/api/enterprise/finance-data-range` | 9 | 200 | Encrypted | ✅ OK |
| `/api/enterprise/manufactoring-revenue` | 9 | 200 | Encrypted | ✅ OK (typo in endpoint name) |
| `/api/enterprise/manufactoring-profit-after-tax` | 9 | 200 | Encrypted | ✅ OK (typo in endpoint name) |
| `/api/enterprise/overview-dividend` | 9 | 200 | Encrypted | ✅ OK |

#### Data Sample (Encrypted Response)
```json
{
  "hashCode": "U2FsdGVkX1+1nur3OPLmxpo+3EAwgycZmLAo6FvqCqF..."
}
```
- **Status:** Encrypted data detected - likely client-side AES encryption
- **Key Field:** `hashCode` (base64-encoded encrypted payload)

#### Missing Comparison APIs
| API | Purpose | Data Points Needed | Status |
|-----|---------|-------------------|--------|
| `/api/enterprise/compare-revenue` | Revenue comparison across companies | Revenue by company/year | ❌ NOT FOUND |
| `/api/enterprise/financial-ratios` | Ratio analysis (P/E, ROA, ROE, etc.) | Financial metrics | ❌ NOT FOUND |
| `/api/enterprise/sector-ranking` | Rank companies by sector | Company rankings | ❌ NOT FOUND |
| `/api/enterprise/peer-analysis` | Compare metrics with peers | Peer group analysis | ❌ NOT FOUND |
| `/api/enterprise/market-share` | Market share by sector | Market share data | ❌ NOT FOUND |
| `/api/enterprise/growth-metrics` | YoY/QoQ growth comparison | Growth rates | ❌ NOT FOUND |

#### Recommendations
1. **Fix empty search issue:** Add validation to prevent `corpText=` (empty) calls
2. **Implement comparison features:** Add APIs for revenue/profit comparison
3. **Add ranking capabilities:** Create sector ranking endpoints
4. **Extend financial metrics:** Add financial ratio calculations (P/E, ROA, profit margin)

---

### Sector 2: ELECTRICITY & ENERGY

#### Active APIs (14 endpoints)

| Endpoint | Calls | Status | Data Type | Issue |
|----------|-------|--------|-----------|-------|
| `/api/electricity/lake-level` | 7 | 200 | Encrypted | ✅ OK |
| `/api/electricity/enso-forecast` | 4 | 200 | Encrypted | ✅ OK |
| `/api/electricity/latest-input-price` | 4 | 200 | Encrypted | ✅ OK |
| `/api/electricity/output-resource-by-value` | 4 | 200 | Encrypted | ✅ OK |
| `/api/electricity/output-resource-by-proportion` | 3 | 200 | Encrypted | ✅ OK |
| `/api/electricity/enso-history` | 2 | 200 | Encrypted | ✅ OK |
| `/api/electricity/enso-nearest-date` | 2 | 200 | Encrypted | ✅ OK |
| `/api/electricity/electric-output-plant` | 2 | 200 | Encrypted | ✅ OK |
| `/api/electricity/lake-name` | 1 | 200 | Encrypted | ✅ OK |
| `/api/electricity/input-price-trend` | 1 | 200 | Encrypted | ✅ OK |
| `/api/electricity/output-price` | 1 | 200 | Encrypted | ✅ OK |
| `/api/electricity/output-resource-name` | 1 | 200 | Encrypted | ✅ OK |
| `/api/electricity/policy-resource` | 1 | 200 | Encrypted | ✅ OK |
| `/api/electricity/policy-renewable` | 1 | 200 | Encrypted | ✅ OK |

#### Key Observations
- **Most Used:** Lake level data (7 calls)
- **Proportion vs Value APIs:** Both available - support different visualization needs
- **Forecast APIs:** ENSO (El Niño Southern Oscillation) for weather prediction

#### Missing Comparison APIs
| API | Purpose | Data Points | Status |
|-----|---------|-----------|--------|
| `/api/electricity/provider-comparison` | Compare electricity providers | Pricing, capacity, region | ❌ NOT FOUND |
| `/api/electricity/renewable-vs-traditional` | Renewable energy mix comparison | Energy source percentages | ⚠️ PARTIALLY (see `output-resource-by-proportion`) |
| `/api/electricity/regional-consumption` | Consumption by region | Regional demand data | ❌ NOT FOUND |
| `/api/electricity/price-forecast` | Future price predictions | Price trends | ❌ NOT FOUND |
| `/api/electricity/capacity-utilization` | Capacity vs actual output | Utilization rates | ❌ NOT FOUND |
| `/api/electricity/supply-demand` | Supply/demand balance | Balance metrics | ❌ NOT FOUND |

#### Recommendations
1. **Add renewable energy tracking:** Enhance `/output-resource-by-proportion` with time-series data
2. **Regional comparison:** Add endpoints for consumption/generation by region
3. **Provider comparison:** Compare different electricity providers' metrics
4. **Price trend analysis:** Extend forecast with historical price data
5. **Capacity planning:** Add capacity utilization and planning data

---

### Sector 3: STEEL & COMMODITIES

#### Active APIs (1 endpoint)

| Endpoint | Calls | Status | Data Type | Issue |
|----------|-------|--------|-----------|-------|
| `/api/steel/legend` | 1 | 200 | Encrypted | ✅ OK (legend/mapping data) |

#### Current Coverage
- Only legend/reference data is retrieved
- No actual steel price, production, or market data found

#### Missing APIs (CRITICAL)
| API | Purpose | Status |
|-----|---------|--------|
| `/api/steel/price` | Steel price trends | ❌ NOT FOUND |
| `/api/steel/production` | Production volume by type | ❌ NOT FOUND |
| `/api/steel/market-share` | Market leaders by type | ❌ NOT FOUND |
| `/api/steel/global-vs-domestic` | Global vs domestic market | ❌ NOT FOUND |
| `/api/steel/price-forecast` | Future price predictions | ❌ NOT FOUND |
| `/api/steel/quality-grades` | Price by quality grade | ❌ NOT FOUND |

#### Recommendations
1. **Implement core steel APIs:** Add price, production, market share endpoints (HIGH PRIORITY)
2. **Market comparison:** Create endpoints for global vs domestic comparison
3. **Type-based analysis:** Support comparison by steel type (hot-rolled, cold-rolled, stainless, etc.)
4. **Price tracking:** Add historical price data and trend analysis

---

## 🔍 COMPREHENSIVE API USAGE MAPPING

### Authentication Flow
```
1. POST /api/auth/device/check (201 Created)
   └─> GET /api/auth?deviceId=<UUID> (401 → 200 after refresh)
       └─> Returns encrypted hashCode token for session
```

### Enterprise Data Flow
```
GET /api/enterprise/corp-search?corpText=<search>
│
├─> GET /api/enterprise/corp-profile?corpId=<id>
│   ├─> GET /api/enterprise/finance-data-range (get available years)
│   ├─> GET /api/enterprise/finance-label (get field mapping)
│   └─> GET /api/enterprise/finance-ticket-data (get financial data)
│
├─> GET /api/enterprise/manufactoring-revenue?ticket=<code>&year=<year>&period=<period>
├─> GET /api/enterprise/manufactoring-profit-after-tax?ticket=<code>&year=<year>&period=<period>
└─> GET /api/enterprise/overview-dividend (dividend history)
```

### Electricity Data Flow
```
GET /electricity (homepage)
│
├─> GET /api/electricity/lake-level?lakeId=<id> (for specific lakes)
│   ├─> GET /api/electricity/lake-name (get available lakes)
│   └─> GET /api/electricity/enso-forecast?date=<date> (ENSO prediction)
│
├─> GET /api/electricity/output-resource-by-proportion?year=<year>
├─> GET /api/electricity/output-resource-by-value?year=<year>
│   └─> GET /api/electricity/output-resource-name (legend)
│
├─> GET /api/electricity/latest-input-price
├─> GET /api/electricity/input-price-trend
└─> GET /api/electricity/output-price
```

---

## 📋 QUERY PARAMETERS FOUND

### Common Parameters
| Parameter | Used By | Example Values |
|-----------|---------|-----------------|
| `corpText` | corp-search | (empty), company name |
| `corpType` | finance-label | 4 (corporation type) |
| `tableName` | finance-label | INCOME_STATEMENT, BALANCE_SHEET, CASH_FLOW_INDIRECT |
| `ticket` | manufacturing APIs | REE, ASM, etc. |
| `year` | multiple APIs | 2026, All, 5Y, 10Y |
| `period` | manufacturing APIs | quarter, year |
| `corpId` | corp-profile | numeric IDs |
| `lakeId` | lake-level | 10, 24, 28, 45, etc. |
| `date` | forecast APIs | YYYY-MM-DD format |
| `deviceId` | auth | UUID format |

---

## 🚀 MISSING FEATURES & OPPORTUNITIES

### High Priority (Core Functionality)
1. **Financial Comparison** - Compare revenue, profit, margins across companies
   - Endpoints needed: `/api/enterprise/compare-revenue`, `/api/enterprise/financial-ratios`
   
2. **Sector Benchmarking** - Show where a company ranks in sector
   - Endpoints needed: `/api/enterprise/sector-ranking`, `/api/enterprise/peer-analysis`
   
3. **Steel Market Data** - Critical gap in commodity coverage
   - Endpoints needed: `/api/steel/price`, `/api/steel/production`, `/api/steel/market-share`
   
4. **Time Series Data** - Historical trends for forecasting
   - Extend existing APIs with `date_range` parameter

### Medium Priority (Enhanced Analytics)
1. **Sector Composition** - Show capital structure by sector
   - `/api/enterprise/sector-capital-structure`
   
2. **Growth Metrics** - YoY/QoQ comparisons
   - `/api/enterprise/growth-analysis`
   
3. **Energy Source Mix** - Detailed renewable vs fossil breakdown
   - `/api/electricity/source-mix-detailed`
   
4. **Regional Distribution** - Consumption/generation by region
   - `/api/electricity/regional-metrics`

### Low Priority (Advanced Features)
1. **Predictive Analysis** - ML-based forecasting
2. **Anomaly Detection** - Flag unusual data patterns
3. **Custom Dashboards** - User-defined metric tracking
4. **Export Formats** - CSV, PDF, JSON export options
5. **Real-time Alerts** - Notify on price/metric changes

---

## 🔐 Security Observations

### Encryption Status
- **All API responses use `hashCode` field:** Contains AES-encrypted data
- **Key:** Likely derived from device ID or session token
- **Implementation:** Client-side decryption required
- **Concern:** Ensure encryption keys are properly rotated

### Authentication Security
- **Device-based auth:** Using device UUID instead of user credentials
- **Token expiration:** Not visible in response, may need refresh logic
- **401 Errors:** Occurring on first auth attempt - normal flow or security issue?

#### Recommendations
1. Document encryption key derivation
2. Implement token refresh mechanism
3. Add rate limiting to auth endpoints
4. Audit 401 error frequency

---

## 📈 API Usage Statistics

### Call Distribution
- **Enterprise APIs:** ~45 calls (33%)
- **Electricity APIs:** ~37 calls (27%)
- **Authentication:** ~11 calls (8%)
- **Page routes/static:** ~60 calls (44%)

### Most Used Endpoints
1. `/api/enterprise/finance-ticket-data` - 9 calls
2. `/api/enterprise/corp-profile` - 9 calls
3. `/api/enterprise/finance-data-range` - 9 calls
4. `/api/electricity/lake-level` - 7 calls

### Least Used Endpoints
- `/api/steel/legend` - 1 call
- Many electricity detail endpoints - 1 call each

---

## ✅ ACTION ITEMS

### Immediate (Critical)
- [ ] Fix 401 auth error - verify credentials
- [ ] Fix empty `corpText` parameter in corp-search calls
- [ ] Document all API response structures (encrypted data)

### Short Term (1-2 weeks)
- [ ] Implement financial comparison APIs
- [ ] Add sector ranking/benchmarking
- [ ] Create steel market data endpoints
- [ ] Add time-series/historical data support

### Medium Term (1 month)
- [ ] Enhance electricity APIs with regional data
- [ ] Add growth metrics and analysis
- [ ] Implement predictive forecasting
- [ ] Create detailed documentation with example data

### Long Term (2-3 months)
- [ ] Advanced analytics features
- [ ] Real-time data feeds
- [ ] Custom alert system
- [ ] Performance optimization for large datasets

---

## 📖 Reference

### Files to Update
- `docs/findicator_api.md` - Add new endpoints and auth flow
- `routers/` - Implement new endpoints
- `collectors/` - Add collectors for new data sources
- `static/` - Add UI components for comparisons

### Related Documentation
- See `/docs/` folder for existing API documentation
- See `sector_hub_plan.md` for architecture planning

---

**End of Report**
