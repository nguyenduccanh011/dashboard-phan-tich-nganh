# Sector Hub — Complete API Reference & UI Data Structure
**Updated:** 2026-05-26 | **Status:** 27/27 collectors implemented, 14/27 tested + verified

---

## Quick Start for UI Developers

### Fetching Sector Data
```javascript
// GET all sector data
fetch('/api/sector/{sector_code}/cache')
  .then(r => r.json())
  .then(data => {
    // data.sector_name = "Điện" | "Thép" | etc.
    // data.tickers = ["POW", "NT2", ...] per-company list
    // data.block_a = commodity prices + macro
    // data.block_b = VN macro (CPI, credit, FDI, export...)
    // data.block_c = per-company financial data (BCTC)
    // data.block_d = computed client-side
    // data.block_e = global macro (US, China)
    // data.block_f = enterprise BCTC detailed
    // data.block_g = sector-specific data (exports, lakes, etc.)
  });
```

### Available Sectors (27 total, all have /cache endpoint)
```
✓ Verified (14):
  electricity, steel, cement, pig, chemistry, bank,
  stock, textile, rubber, food-and-beverage, real-estate,
  transport, shrimp, pangasius

✓ Implemented but not HAR-tested (13):
  aviation, industry, plastics, insurance, oilgas,
  gold, coffee, wood, pharma, logistics, rice, pepper, technology
```

---

## Data Blocks Explained (with examples)

### Block A: Commodity Prices & Input Costs
**Contains:** Global commodity prices from Findicator (100+ series)

```javascript
// Electricity sector example
block_a: {
  "macro_35": [  // macroItemId=35 (commodities)
    { nameId: 68, unit: "USD/T", value: 105, date: "05/24/2021" },  // Coal
    { nameId: 65, unit: "USD/Bbl", value: 70, date: "05/24/2021" },  // Brent oil
    { nameId: 66, unit: "USD/MMBtu", value: 3.2, date: "05/24/2021" }  // Natural gas
  ],
  "usd_vnd": [...],  // Exchange rate macroItemId=52
  "input_price_latest": {
    "15": { value: 145000, date: "2026-05-24" }  // VND/MWh
  }
}

// Steel sector example
block_a: {
  "macro_35": [
    { nameId: 60, value: 950, unit: "USD/T" },  // LME Steel
    { nameId: 61, value: 700, unit: "USD/T" },  // LME Scrap
    { nameId: 82, value: 110, unit: "USD/T" }   // Iron ore
  ]
}
```

**Available macroItemId=35 nameIds:**
- **Energy:** 65 (Brent), 67 (WTI), 66 (HH Gas), 68 (Coal ICE), 196 (Coal TQ), 612-628 (Domestic fuels)
- **Metals:** 53-86 (Copper, Aluminum, Nickel, Iron, Steel, Gold)
- **Agriculture:** 87-98 (Soybeans, Corn, Wheat, Oil, Sugar, Coffee)
- **Others:** 51 (Rubber), 730 (Gold VND), 689-696 (Freight routes)

---

### Block B: Vietnam Macro Indicators
**Contains:** Monthly/quarterly macroeconomic data for Vietnam

```javascript
// Example structure
block_b: {
  "credit_growth": [  // macroItemId=47 (monthly)
    { nameId: 1, date: "05/2025", value: 12.3 },  // % YoY
    ...
  ],
  "credit_system": [...],  // Total system credit
  "fdi": [...],  // macroItemId=15 (by sector) or 18 (realized)
  "export_commodity": [...],  // macroItemId=25 (by commodity)
  "cpi": [...],  // macroItemId=4 (11 categories)
  "pmi": [...],  // macroItemId=6 (manufacturing)
  "iip": [...],  // macroItemId=7 (12 sub-sectors)
  "retail_sales": [...],  // macroItemId=23
  "international_visitors": [...]  // macroItemId=61
}

// Key macroItemIds per sector:
// Electricity: 8 (product), 7 (IIP nameId=25)
// Steel: 8 (IIP), 25 (export), 47 (credit)
// Bank: 47 (credit by sector), 48 (deposit rates), 52 (FX)
// Cement: 8 (nameId=29 cement output)
// Textile: 25 (nameId=31/32 export)
```

---

### Block C: Per-Company Financial Data
**Contains:** BCTC (financial statements) from Findicator enterprise API

```javascript
// Finance data structure per ticker
block_c: {
  "HPG": {  // Stock ticker
    "TRAILING": {  // Latest metrics
      "PE": 12.5, "PB": 1.8, "ROE": 15%, "ROA": 8%,
      "EV_EBITDA": 4.2, "Dividend_Yield": 3.5%
    },
    "INCOME_STATEMENT": [
      { year: 2025, Q: 4, revenue: 50000, ebitda: 12000, net_income: 8000 },
      ...
    ],
    "BALANCE_SHEET": [
      { year: 2025, Q: 4, total_assets: 150000, equity: 80000 },
      ...
    ],
    "CASH_FLOW": [...]  // Optional per corpType
  }
}

// Key tables available:
// - TRAILING: PE, PB, ROE, ROA, EV, margins, dividend, growth%
// - INCOME_STATEMENT: Revenue, EBITDA, Tax, Net Income
// - BALANCE_SHEET: Assets, Liabilities, Equity breakdown
// - CASH_FLOW_DIRECT or CASH_FLOW_INDIRECT (per corpType)
```

**corpType-specific accountIds:**
- **corpType=1 (Bank):** PE=89, PB=90, ROE=67, ROA=68, NIM=60, CASA=57, LDR=75
- **corpType=2 (Insurance):** PE=144, ROE=131, ROA=132
- **corpType=3 (Stock/Securities):** Market share HOSE=107, dư nợ margin=108
- **corpType=4 (Manufacturing/RE):** PE=39, PB=40, ROE=8, ROA=9, Net Cash=48

---

### Block D: Client-Side Computed Data
**Contains:** Metadata flag (computed_client_side=true)

```javascript
// This block signals that some calculations should be done in UI:
// - Market share calculation from revenue
// - YoY growth comparison
// - Valuation ratios
// - Trend analysis
```

---

### Block E: Global Macro (US & China)
**Contains:** US and China economic indicators for benchmarking

```javascript
block_e: {
  // US Macro (macroItemId=70-139)
  "us_cpi": [...],  // macroItemId=70
  "us_ppi": [...],  // macroItemId=71
  "us_gdp": [...],  // macroItemId=72
  "us_pmi": [...],  // macroItemId=78
  "fed_rate": [...],  // macroItemId=96 (Fed Funds Rate)
  "gdp_now_forecast": [...],  // macroItemId=139 (Atlanta Fed real-time)

  // China Macro (macroItemId=107-132)
  "cn_cpi": [...],  // macroItemId=107
  "cn_pmi": [...],  // macroItemId=115 (28 series)
  "cn_gdp": [...],  // etc.
}

// Useful for:
// - Comparing Vietnam CPI vs US/China
// - Fed rate impact on Vietnam banking
// - China PMI correlation with Vietnam exports
```

---

### Block F: Detailed Enterprise BCTC
**Contains:** Extended financial statement lines (IS, BS, CF)

```javascript
// Example for manufacturing (corpType=4)
block_f: {
  "HPG": [
    // 8 quarters of detailed data
    {
      year: 2025, quarter: 4, date: "12/31/2025",
      "INCOME_STATEMENT": {
        24: { value: 50000, name: "Revenue" },
        26: { value: 48000, name: "Net Revenue" },
        27: { value: 35000, name: "COGS" },
        28: { value: 13000, name: "Gross Profit" },
        40: { value: 10000, name: "EBIT" },
        43: { value: 8000, name: "Net Income" }
      },
      "BALANCE_SHEET": {
        // Asset breakdown
        110: 150000, // Total Assets
        111: 80000,  // Current Assets
        112: 70000,  // Fixed Assets
        // Liabilities & Equity
        200: 70000,  // Total Liabilities
        210: 80000   // Total Equity
      }
    }
  ]
}

// Key accountIds for IS (corpType=4):
// 24: Revenue | 26: Net Revenue | 27: COGS | 28: Gross Profit
// 33: Sales Expenses | 34: Admin Expenses
// 40: EBIT | 43: Net Income | 44: Minority Interest | 45: Parent Net Income

// Key accountIds for BS (corpType=4):
// 110: Total Assets | 200: Total Liabilities | 300: Total Equity
```

---

### Block G: Sector-Specific Data
**Contains:** APIs unique to each sector

```javascript
// Electricity sector
block_g: {
  "lake_level": [
    { lakeId: 45, name: "Da Nhim", level: 287.5, capacity: 2400, pct: 92.5 },
    { lakeId: 46, name: "Thac Ba", level: 85.2, capacity: 9000, pct: 78.3 },
    ...  // 7 lakes total
  ],
  "enso_forecast": {
    "current": { date: "2026-05", oni: 0.8, status: "El Nino Weak" },
    "forecast": [
      { month: "2026-06", oni_forecast: 0.7 },
      { month: "2026-07", oni_forecast: 0.5 },
      { month: "2026-08", oni_forecast: 0.3 }
    ]
  },
  "output_resource_by_proportion": [
    { date: "2025-04", coal: 35, hydro: 40, wind: 15, solar: 8, other: 2 }
  ],
  "electric_output_plant": [
    { plantId: 1, name: "Song Da", capacity: 1800, output: 1650, efficiency: 91.7 },
    ...  // 36 plants
  ]
}

// Steel sector
block_g: {
  "market_share": [  // From /api/steel/overview
    { ticker: "HPG", share: 35.2, produced: 5500 },
    { ticker: "HSG", share: 22.1, produced: 3450 },
    { ticker: "NKG", share: 18.9, produced: 2950 },
    { ticker: "TVDUC", share: 23.8, produced: 3700 }
  ],
  "inventory": [
    { date: "2025-05-24", level: 8500 }
  ]
}

// Shrimp sector
block_g: {
  "export_by_company": {
    "CMX": [
      { date: "2025-04", quantity: 25000, turnover: 500000, price_per_kg: 20 }
    ],
    "FMC": [...],
    "MPC": [...]
  },
  "export_by_market": {
    "USA": [
      { date: "2025-04", quantity: 50000, turnover: 1000000, price: 20 }
    ],
    "China": [...],
    "EU": [...],
    "Others": [...]
  },
  "global_market_comparison": {
    "price_trend": [...],
    "volume_trend": [...]
  }
}
```

---

## API Endpoint Mapping (Server → Findicator)

### Enterprise APIs (used in block_c, block_f, block_e)
```
GET /api/enterprise/v2/finance-ticket-data
  → corpType, ticket, tableName, accountIds, date
  → TRAILING, INCOME_STATEMENT, BALANCE_SHEET, CASH_FLOW_*

GET /api/enterprise/corp-profile
  → ticket → PE, PB, EV, dividend, market cap

GET /api/enterprise/report-analysis
  → ticket → analyst reports, target price
```

### Macro APIs (used in block_a, block_b, block_e)
```
GET /api/macro/metric-data
  → macroItemId, nameId, period, valueType, filter
  → Historical time-series data

Sector-specific macro calls:
  - Electricity: macroItemId=8,7,35
  - Steel: macroItemId=25,26,35,47
  - Bank: macroItemId=47,48,52,54,55
  - Textile: macroItemId=25,31,32
  - etc.
```

### Sector-Specific APIs (block_g)
```
GET /api/{sector}/overview          → Market overview
GET /api/{sector}/legend            → Company listing
GET /api/{sector}/overview-data     → Detailed data per company

Electricity-specific:
  /api/electricity/lake-level       → Water level per reservoir
  /api/electricity/enso-forecast    → El Niño forecast
  /api/electricity/output-resource-by-proportion

Steel-specific:
  /api/steel/overview               → Market share per company
  /api/steel/exchange-rate          → CNY/VND rate

Shrimp/Pangasius-specific:
  /api/{shrimp,pangasius}/enterprise-export-*
  → Per-company export metrics
```

---

## Testing Checklist for Each Sector

### ✓ Verified Working (14 sectors tested 2026-05-26)
- [x] Electricity — All 8 endpoints working
- [x] Steel — Core endpoints verified
- [x] Cement — Data present, per-DN gap noted
- [x] Pig — Data present, input cost linkage OK
- [x] Chemistry — Data present
- [x] Bank — 10 banks, full TRAILING + credit data
- [x] Stock — 7 brokers, revenue structure, market share
- [x] Textile — Export data, per-company revenue
- [x] Rubber — Commodity + export data
- [x] Food & Beverage — 6 companies, macro + BCTC
- [x] Real-Estate — 5 companies, projects (supply-demand broken)
- [x] Transport — Freight indices, per-company revenue
- [x] Shrimp — Per-company export + markets
- [x] Pangasius — Per-company export + markets

### ⚠️ Not HAR-tested but implemented (13 sectors)
- [ ] Aviation
- [ ] Industry
- [ ] Plastics
- [ ] Insurance
- [ ] Oil & Gas
- [ ] Gold
- [ ] Coffee
- [ ] Wood
- [ ] Pharma
- [ ] Logistics
- [ ] Rice
- [ ] Pepper
- [ ] Technology

---

## Known Issues & Workarounds

### ❌ API Gaps

| Issue | Sector | Workaround |
|-------|--------|-----------|
| No per-DN production endpoint | Cement, Pig, Chemical | Calculate from revenue + macro output |
| Per-DN export not available | Rubber, Textile (except shrimp) | Use macro export + estimate per-DN |
| Real-estate supply-demand broken | Real-Estate | Track projects manually, no absorption data |
| Stock sector indices incomplete | Stock | Only 4/9 indices available (VNFIN/VNMAT/etc. missing) |
| Market share static (2022) | Food & Beverage | Estimate from revenue trends |

### ⚠️ TRAILING Data Gaps
Some tickers return empty TRAILING (no financial ratios):
- REE, PC1, GEG, HDG, ASM, NT2, POW, QTP, HND

**Why:** Non-manufacturing or non-corpType=4 companies  
**Solution:** Skip TRAILING query, use corp-profile instead

---

## Code Examples for UI

### Display electricity lake levels with trend
```javascript
const data = await fetch('/api/sector/electricity/cache').then(r => r.json());
const lakes = data.block_g.lake_level;

lakes.forEach(lake => {
  console.log(`${lake.name}: ${lake.level}m (${lake.pct}% capacity)`);
  // Create chart: level vs time (from historical data in block_a)
});
```

### Compare bank NIM across top 6
```javascript
const data = await fetch('/api/sector/bank/cache').then(r => r.json());
const tickers = ["VCB", "BID", "CTG", "TCB", "ACB", "MBB"];

const nims = tickers.map(t => ({
  ticker: t,
  nim: data.block_e[t].trailing.find(x => x.account_id === 60).value
}));

// Chart: NIM by bank (bar chart)
```

### Export steel market share pie chart
```javascript
const data = await fetch('/api/sector/steel/cache').then(r => r.json());
const companies = data.block_g.market_share;

// PieChart({
//   labels: companies.map(c => c.ticker),
//   data: companies.map(c => c.share)
// });
```

---

## Update Frequency

- **Real-time:** Lake levels, ENSO forecast, FED rates, FX
- **Daily:** Stock prices, deposit rates, commodity prices
- **Weekly:** FED assets, freight indices
- **Monthly:** Macro data (CPI, PMI, IIP, credit, exports)
- **Quarterly:** BCTC data, market share, per-company metrics
- **Annually:** Strategic data, laws, regulations

Cache refresh: **Daily at 07:30 Asia/Ho_Chi_Minh** (via APScheduler)

---

## Next Steps

1. **UI Developers:** Use `/api/sector/{code}/cache` to fetch all sector data
2. **Add visualization:** Line charts for block_a/b/e, pie for market share, tables for block_c/f
3. **Comparison:** Cross-sector macro index overlay (CPI, PMI, credit growth)
4. **Drill-down:** Per-ticker financial details from block_f

---

**Document maintained by:** Sector Hub Team  
**Last updated:** 2026-05-26  
**Next review:** After Phase 1 UI implementation
