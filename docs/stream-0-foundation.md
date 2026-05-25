# Luồng 0 — Foundation (Bắt buộc làm trước)
> Luồng này tạo toàn bộ hạ tầng chung. Luồng 1/2/3 không thể bắt đầu trước khi Luồng 0 xong.

---

## Tài liệu cần đọc trước khi bắt đầu

1. `docs/ocbs_style_guide.md` — toàn bộ (màu, font, spacing, component classes)
2. `docs/sector_hub_plan.md` §1 đến §4b — tổng quan, tech stack, layout 6 khối, quy tắc chung
3. `docs/STREAMS.md` — hiểu bức tranh toàn cảnh

---

## Danh sách files cần tạo

```
sector-hub/
├── app.py                        ← [A] FastAPI entry + APScheduler
├── requirements.txt              ← [A]
├── .env.example                  ← [A] template biến môi trường
├── routers/
│   ├── __init__.py               ← [A]
│   ├── sector.py                 ← [B] generic /api/sector/{code}/*
│   ├── macro.py                  ← [B] /api/macro/*
│   └── stock.py                  ← [B] /api/stock/{ticker}/*
├── collectors/
│   ├── __init__.py               ← [A]
│   └── base.py                   ← [A] FindicatorClient + WiChartClient
├── cache/                        ← [A] mkdir chỉ, không có file
├── static/
│   ├── index.html                ← [C] landing page
│   ├── sector.html               ← [C] *** TEMPLATE QUAN TRỌNG NHẤT ***
│   ├── macro.html                ← [C] skeleton macro dashboard
│   ├── css/
│   │   └── main.css              ← [D] *** DESIGN TOKENS + GRID ***
│   └── js/
│       └── charts.js             ← [D] *** HIGHCHARTS BASE THEME + FACTORY ***
```

**[A]** = Backend skeleton  
**[B]** = Router skeleton  
**[C]** = HTML templates  
**[D]** = Core UI files (quan trọng nhất — mọi sector đều import)

---

## [A] Backend skeleton

### `requirements.txt`
```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
python-dotenv>=1.0.0
httpx>=0.27.0
apscheduler>=3.10.4
```

### `app.py`
```python
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()

from routers import sector, macro, stock

app = FastAPI(title="Sector Hub")
app.include_router(sector.router, prefix="/api/sector")
app.include_router(macro.router, prefix="/api/macro")
app.include_router(stock.router, prefix="/api/stock")
app.mount("/static", StaticFiles(directory="static"), name="static")

scheduler = AsyncIOScheduler(timezone="Asia/Ho_Chi_Minh")

@app.on_event("startup")
async def startup():
    # Cron 7:30 sáng hàng ngày
    scheduler.add_job(refresh_all_caches, "cron", hour=7, minute=30)
    scheduler.start()

async def refresh_all_caches():
    """Gọi tất cả collectors để refresh cache JSON."""
    pass  # Từng collector sẽ được đăng ký ở đây

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/sector/{code}")
async def sector_page(code: str):
    return FileResponse("static/sector.html")

@app.get("/macro")
async def macro_page():
    return FileResponse("static/macro.html")
```

### `.env.example`
```
FINDICATOR_EMAIL=your@email.com
FINDICATOR_PASSWORD=yourpassword
WICHART_SECRET=yoursecret
```

### `collectors/base.py`

```python
"""
FindicatorClient và WiChartClient — base HTTP clients.

Findicator auth flow:
  POST /auth/sign-in → {accessToken, refreshToken}
  Dùng accessToken trong header: Authorization: Bearer {token}
  Token hết hạn → POST /auth/refresh-token với refreshToken

WiChart:
  Header: secret: {WICHART_SECRET}
  Base URL: https://wichart.vn/api/
"""
import os, json, asyncio
from pathlib import Path
import httpx

CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)

FINDICATOR_BASE = "https://findicator.vn/api"
WICHART_BASE = "https://wichart.vn/api"


class FindicatorClient:
    def __init__(self):
        self.email = os.getenv("FINDICATOR_EMAIL")
        self.password = os.getenv("FINDICATOR_PASSWORD")
        self.access_token: str | None = None
        self.refresh_token: str | None = None

    async def login(self):
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{FINDICATOR_BASE}/auth/sign-in",
                                  json={"email": self.email, "password": self.password})
            r.raise_for_status()
            data = r.json()
            self.access_token = data["accessToken"]
            self.refresh_token = data["refreshToken"]

    async def get(self, path: str, params: dict = None) -> dict:
        if not self.access_token:
            await self.login()
        headers = {"Authorization": f"Bearer {self.access_token}"}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(f"{FINDICATOR_BASE}/{path}",
                                  headers=headers, params=params)
            if r.status_code == 401:
                await self._refresh()
                headers["Authorization"] = f"Bearer {self.access_token}"
                r = await client.get(f"{FINDICATOR_BASE}/{path}",
                                      headers=headers, params=params)
            r.raise_for_status()
            return r.json()

    async def _refresh(self):
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{FINDICATOR_BASE}/auth/refresh-token",
                                  json={"refreshToken": self.refresh_token})
            r.raise_for_status()
            self.access_token = r.json()["accessToken"]

    def save_cache(self, filename: str, data: dict):
        path = CACHE_DIR / filename
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def load_cache(self, filename: str) -> dict | None:
        path = CACHE_DIR / filename
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return None


class WiChartClient:
    def __init__(self):
        self.secret = os.getenv("WICHART_SECRET", "")

    async def get(self, path: str, params: dict = None) -> dict:
        headers = {"secret": self.secret}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(f"{WICHART_BASE}/{path}",
                                  headers=headers, params=params)
            r.raise_for_status()
            return r.json()


# Singleton instances — import từ đây
findicator = FindicatorClient()
wichart = WiChartClient()
```

### `routers/sector.py` (skeleton)
```python
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()
CACHE_DIR = Path("cache")

@router.get("/{code}/cache")
async def get_sector_cache(code: str):
    """Trả về cache JSON cho một ngành."""
    cache_file = CACHE_DIR / f"sector_{code}.json"
    if not cache_file.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(cache_file.read_text(encoding="utf-8")))
```

---

## [C] HTML Templates

### `static/sector.html` — Template 6 khối (QUAN TRỌNG NHẤT)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title id="page-title">Sector Hub</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,800;1,400;1,600&family=Playfair+Display:wght@900&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="/static/css/main.css"/>
  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Highcharts Stock (includes all modules) -->
  <script src="https://code.highcharts.com/stock/highstock.js"></script>
  <script src="https://code.highcharts.com/stock/modules/heatmap.js"></script>
  <script src="https://code.highcharts.com/modules/exporting.js"></script>
</head>
<body>
  <!-- HEADER -->
  <header class="sh-header">
    <div class="sh-header-inner">
      <a href="/" class="sh-brand">Sector Hub</a>
      <div class="sh-header-meta">
        <span class="sh-sector-name" id="sector-name">—</span>
        <span class="sh-updated" id="last-updated">—</span>
      </div>
    </div>
  </header>

  <main class="sh-main">
    <!-- Khối A | B (2 cột) -->
    <div class="sector-grid-2" id="block-ab">
      <!-- [A] Giá đầu vào -->
      <section class="block-section" id="block-a">
        <div class="block-title">A — Giá đầu vào</div>
        <div id="block-a-charts"></div>
      </section>
      <!-- [B] Thị trường ngành -->
      <section class="block-section" id="block-b">
        <div class="block-title">B — Thị trường ngành</div>
        <div id="block-b-charts"></div>
      </section>
    </div>

    <!-- Khối C | D (2 cột) -->
    <div class="sector-grid-2" id="block-cd">
      <!-- [C] Giá bán / ASP -->
      <section class="block-section" id="block-c">
        <div class="block-title">C — Giá bán / ASP</div>
        <div id="block-c-charts"></div>
      </section>
      <!-- [D] Spread / Margin tracker -->
      <section class="block-section" id="block-d">
        <div class="block-title">D — Spread / Margin</div>
        <div id="block-d-charts"></div>
      </section>
    </div>

    <!-- Khối E — Bảng cổ phiếu (full width) -->
    <section class="block-section" id="block-e">
      <div class="block-title">E — Cổ phiếu ngành</div>
      <div id="block-e-table"></div>
    </section>

    <!-- Khối F — BCTC 8 quý (full width) -->
    <section class="block-section" id="block-f">
      <div class="block-title">F — BCTC so sánh 8 quý</div>
      <div id="block-f-charts"></div>
    </section>
  </main>

  <script src="/static/js/charts.js"></script>
  <!-- Sector-specific script được load động -->
  <script>
    (function() {
      const code = location.pathname.split('/').pop();
      const s = document.createElement('script');
      s.src = `/static/js/sector-${code}.js`;
      document.body.appendChild(s);
    })();
  </script>
</body>
</html>
```

---

## [D] Core UI Files

### `static/css/main.css`

```css
/* === DESIGN TOKENS (từ ocbs_style_guide.md + điều chỉnh cho dashboard) === */
:root {
  /* Brand */
  --green:       #008C44;
  --green-900:   #004B2C;
  --green-800:   #006633;
  --green-100:   #E8F5EE;
  --gold:        #E4A025;
  --gold-100:    #FFF4DA;

  /* Surfaces */
  --paper:       #FAFAF7;
  --paper-2:     #F2F4EF;
  --white:       #FFFFFF;

  /* Ink */
  --ink:         #161616;
  --muted:       #5F6460;

  /* Semantic */
  --red:         #B84B43;
  --red-100:     #FCEDEC;

  /* Borders */
  --line:        rgba(22,22,22,.10);
  --line-strong: rgba(22,22,22,.18);
  --shadow:      0 14px 42px rgba(0,0,0,.07);
  --shadow-soft: 0 8px 24px rgba(0,0,0,.05);

  /* Highcharts series colors — đồng bộ với charts.js HC_COLORS */
  --hc-0: #1d4ed8;   /* giá chính / price */
  --hc-1: #b91c1c;   /* chi phí / cost */
  --hc-2: #15803d;   /* spread / margin */
  --hc-3: #b45309;   /* volume / thị phần */
  --hc-4: #6d28d9;   /* tỷ giá / macro */
  --hc-5: #0369a1;   /* lãi suất / rate */
  --hc-6: #be185d;   /* phụ */
  --hc-7: #047857;   /* phụ */

  /* Layout */
  --grid-gap:     1rem;
  --card-radius:  6px;
  --section-gap:  1.5rem;
  --max-width:    1400px;
  --header-h:     56px;
}

/* === RESET & BASE === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  font-size: 14px;
  line-height: 1.6;
}

/* === HEADER === */
.sh-header {
  position: sticky; top: 0; z-index: 100;
  background: var(--white);
  border-bottom: 1px solid var(--line);
  height: var(--header-h);
  box-shadow: var(--shadow-soft);
}
.sh-header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.sh-brand {
  font-weight: 800;
  color: var(--green);
  text-decoration: none;
  font-size: 1rem;
  letter-spacing: -0.02em;
}
.sh-header-meta { display: flex; flex-direction: column; gap: 0; margin-left: 1.5rem; }
.sh-sector-name { font-weight: 600; font-size: 0.9rem; color: var(--ink); }
.sh-updated { font-size: 0.75rem; color: var(--muted); }

/* === MAIN LAYOUT === */
.sh-main {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

/* === GRID === */
.sector-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--grid-gap);
}
.sector-grid-1 {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--grid-gap);
}
@media (max-width: 1024px) {
  .sector-grid-2 { grid-template-columns: 1fr; }
}

/* === BLOCK SECTION === */
.block-section {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--card-radius);
  padding: 1rem 1.25rem 1.25rem;
  box-shadow: var(--shadow-soft);
}
.block-title {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--green-100);
}

/* === CHART CARD (bọc từng biểu đồ) === */
.chart-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--card-radius);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.chart-card:last-child { margin-bottom: 0; }
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}
.chart-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chart-container { min-height: 260px; }
.chart-container.chart-sm { min-height: 200px; }
.chart-container.chart-lg { min-height: 340px; }

/* === YEAR BUTTONS === */
.year-btns { display: flex; gap: 3px; flex-shrink: 0; }
.year-btns button {
  padding: 2px 7px;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 3px;
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--line-strong);
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.year-btns button:hover { color: var(--green); border-color: var(--green); }
.year-btns button.active {
  background: var(--green);
  color: white;
  border-color: var(--green);
}

/* === STALE BADGES === */
.stale-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.stale-badge.warn  { background: var(--gold-100); color: #92400e; border: 1px solid #fcd34d; }
.stale-badge.info  { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.stale-badge.error { background: var(--red-100); color: var(--red); border: 1px solid #fca5a5; }

/* === LOADING SKELETON === */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--line) 25%, var(--line-strong) 50%, var(--line) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  height: 100%;
  min-height: 260px;
}

/* === BLOCK E — BẢNG CỔ PHIẾU === */
.stock-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.stock-table th {
  text-align: right;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  padding: 0.4rem 0.75rem;
  border-bottom: 2px solid var(--line-strong);
}
.stock-table th:first-child { text-align: left; }
.stock-table td {
  padding: 0.5rem 0.75rem;
  text-align: right;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
.stock-table td:first-child { text-align: left; font-weight: 600; color: var(--green); }
.stock-table tr:hover td { background: var(--paper-2); }
.num-up   { color: #15803d; font-weight: 600; }
.num-down { color: var(--red); font-weight: 600; }
.num-neu  { color: var(--muted); }
.tag-buy  { background: var(--green-100); color: var(--green-800); font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
.tag-hold { background: var(--gold-100); color: #92400e; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
.tag-sell { background: var(--red-100); color: var(--red); font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 3px; }

/* === INDEX PAGE === */
.sector-grid-index {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.sector-card-index {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--card-radius);
  padding: 1rem 1.25rem;
  text-decoration: none;
  color: var(--ink);
  transition: box-shadow 0.2s, border-color 0.2s;
  display: block;
}
.sector-card-index:hover {
  box-shadow: var(--shadow);
  border-color: var(--green);
}
.sector-card-index .sector-code { font-size: 0.65rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.sector-card-index .sector-label { font-size: 0.95rem; font-weight: 600; margin-top: 0.25rem; }
```

### `static/js/charts.js`

```javascript
/**
 * charts.js — Highcharts base theme + factory functions
 * Import trước mọi sector-*.js
 * Phụ thuộc: Highcharts Stock đã được load qua CDN
 */

// === PALETTE (đồng bộ với --hc-* trong main.css) ===
const HC_COLORS = [
  '#1d4ed8',  // 0 — giá/price
  '#b91c1c',  // 1 — chi phí/cost
  '#15803d',  // 2 — spread/margin
  '#b45309',  // 3 — volume/thị phần
  '#6d28d9',  // 4 — tỷ giá/macro
  '#0369a1',  // 5 — lãi suất/rate
  '#be185d',  // 6 — phụ
  '#047857',  // 7 — phụ
  '#92400e',  // 8 — phụ
  '#1e40af',  // 9 — phụ
];

// === GLOBAL HIGHCHARTS THEME ===
Highcharts.setOptions({
  colors: HC_COLORS,
  chart: {
    backgroundColor: '#FAFAF7',   // --paper
    style: { fontFamily: "'Inter', system-ui, sans-serif" },
    animation: { duration: 250 },
  },
  title: { text: null },
  subtitle: { text: null },
  credits: { enabled: false },
  exporting: { enabled: false },
  legend: {
    itemStyle: { color: '#5F6460', fontSize: '11px', fontWeight: '600' },
    itemHoverStyle: { color: '#161616' },
  },
  xAxis: {
    type: 'datetime',
    lineColor: 'rgba(22,22,22,.10)',
    tickColor: 'rgba(22,22,22,.10)',
    labels: { style: { color: '#5F6460', fontSize: '11px' } },
    crosshair: { color: 'rgba(22,22,22,.15)', dashStyle: 'ShortDash' },
  },
  yAxis: {
    gridLineColor: 'rgba(22,22,22,.07)',
    labels: { style: { color: '#5F6460', fontSize: '11px' } },
    title: { text: null },
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(22,22,22,.12)',
    borderRadius: 6,
    shadow: { color: 'rgba(0,0,0,.08)', offsetX: 0, offsetY: 4, opacity: 1, width: 12 },
    style: { color: '#161616', fontSize: '12px' },
    shared: true,
    xDateFormat: '%d/%m/%Y',
    headerFormat: '<span style="font-size:10px;color:#5F6460">{point.key}</span><br/>',
    pointFormatter: function() {
      const val = this.y >= 1000
        ? Highcharts.numberFormat(this.y, 0, '.', ',')
        : Highcharts.numberFormat(this.y, 2, '.', ',');
      return `<span style="color:${this.color}">●</span> <b>${this.series.name}:</b> ${val}<br/>`;
    },
  },
  plotOptions: {
    series: {
      animation: { duration: 300 },
      states: { hover: { lineWidthPlus: 0 } },
    },
    line: {
      lineWidth: 1.5,
      marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
    },
    area: {
      fillOpacity: 0.08,
      lineWidth: 1.5,
      marker: { enabled: false },
    },
    column: {
      borderWidth: 0,
      borderRadius: 2,
      pointPadding: 0.05,
      groupPadding: 0.1,
    },
    pie: {
      borderWidth: 1,
      borderColor: '#FFFFFF',
      dataLabels: { style: { fontSize: '11px', fontWeight: '600', color: '#161616', textOutline: 'none' } },
    },
  },
  responsive: {
    rules: [{
      condition: { maxWidth: 600 },
      chartOptions: {
        legend: { enabled: false },
        xAxis: { labels: { style: { fontSize: '10px' } } },
        yAxis: { labels: { style: { fontSize: '10px' } } },
      },
    }],
  },
});

// === FACTORY FUNCTIONS ===

/**
 * Tạo chart thường (không có navigator/scrollbar)
 * @param {string} containerId
 * @param {object} config — Highcharts options, merge với base theme
 */
function createChart(containerId, config) {
  clearSkeleton(containerId);
  return Highcharts.chart(containerId, Highcharts.merge({
    chart: { renderTo: containerId },
  }, config));
}

/**
 * Tạo Stock chart (có navigator, dùng cho time-series dài)
 * @param {string} containerId
 * @param {object} config
 */
function createStockChart(containerId, config) {
  clearSkeleton(containerId);
  return Highcharts.stockChart(containerId, Highcharts.merge({
    rangeSelector: { enabled: false },
    navigator: {
      enabled: true,
      height: 30,
      outlineColor: 'rgba(22,22,22,.10)',
      handles: { backgroundColor: '#F2F4EF', borderColor: 'rgba(22,22,22,.25)' },
      series: { color: '#008C44', lineWidth: 1 },
    },
    scrollbar: { enabled: false },
  }, config));
}

// === UI HELPERS ===

/**
 * Khởi tạo year-range buttons từ data-year-options attribute
 * @param {HTMLElement} chartCard — .chart-card element có data-year-options
 * @param {function} onSelect — callback(yearString: '1Y'|'3Y'|'5Y'|'MAX')
 * @param {string} defaultYear — mặc định chọn (default: options[0])
 */
function initYearButtons(chartCard, onSelect, defaultYear = null) {
  const opts = (chartCard.dataset.yearOptions || '1Y,3Y,5Y').split(',');
  const container = chartCard.querySelector('.year-btns');
  if (!container) return;

  const activeYear = defaultYear || opts[0];
  opts.forEach(y => {
    const btn = document.createElement('button');
    btn.textContent = y;
    if (y === activeYear) btn.classList.add('active');
    btn.addEventListener('click', () => {
      container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(y);
    });
    container.appendChild(btn);
  });
}

/**
 * Hiển thị stale badge trên chart card
 * @param {HTMLElement} chartCard
 * @param {'warn'|'info'|'error'} type
 * @param {string} text
 */
function setStaleBadge(chartCard, type, text) {
  let badge = chartCard.querySelector('.stale-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'stale-badge';
    const header = chartCard.querySelector('.chart-header');
    if (header) header.insertBefore(badge, header.querySelector('.year-btns'));
  }
  badge.className = `stale-badge ${type}`;
  badge.textContent = text;
  badge.style.display = '';
}

/**
 * Hiển thị skeleton loading trong container
 * @param {string} containerId
 */
function showSkeleton(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '<div class="skeleton"></div>';
}

/**
 * Xoá skeleton (gọi trước khi render chart)
 * @param {string} containerId
 */
function clearSkeleton(containerId) {
  const el = document.getElementById(containerId);
  if (el && el.querySelector('.skeleton')) el.innerHTML = '';
}

/**
 * Hiển thị trạng thái lỗi / không có data
 * @param {string} containerId
 * @param {string} message
 */
function showEmpty(containerId, message = 'Không có dữ liệu') {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div style="height:100%;min-height:200px;display:flex;align-items:center;justify-content:center;color:#5F6460;font-size:12px;gap:6px">
      <span style="font-size:18px">○</span> ${message}
    </div>`;
}

/**
 * Format số theo đơn vị VN
 * @param {number} value
 * @param {string} unit — 'ty' | 'trieu' | 'usd' | 'pct' | ''
 */
function formatVN(value, unit = '') {
  if (value == null || isNaN(value)) return '—';
  if (unit === 'ty') return (value / 1e9).toFixed(1) + ' tỷ';
  if (unit === 'trieu') return (value / 1e6).toFixed(0) + ' tr';
  if (unit === 'pct') return value.toFixed(1) + '%';
  if (unit === 'usd') return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return value.toLocaleString('vi-VN');
}

/**
 * Parse dữ liệu Findicator time-series thành mảng [timestamp_ms, value]
 * Findicator trả về {date: 'MM/DD/YYYY', value: number}
 * @param {Array} rows
 * @param {string} dateField — tên field ngày (default: 'date')
 * @param {string} valueField — tên field giá trị (default: 'value')
 */
function parseFindicatorSeries(rows, dateField = 'date', valueField = 'value') {
  if (!rows || !rows.length) return [];
  return rows
    .map(row => {
      const d = new Date(row[dateField]);
      return [d.getTime(), row[valueField]];
    })
    .filter(([t, v]) => !isNaN(t) && v != null)
    .sort((a, b) => a[0] - b[0]);
}

/**
 * Parse dữ liệu WiChart thành mảng [timestamp_ms, value]
 * WiChart trả về {timestamp_ms: number, value: number}
 * @param {Array} rows
 * @param {number} cutoffMs — cắt data trước timestamp này (để filter year)
 */
function parseWiChartSeries(rows, cutoffMs = 0) {
  if (!rows || !rows.length) return [];
  return rows
    .filter(row => row.timestamp_ms >= cutoffMs && row.value != null)
    .map(row => [row.timestamp_ms, row.value])
    .sort((a, b) => a[0] - b[0]);
}

/**
 * Tính cutoff timestamp từ year string
 * @param {'1Y'|'3Y'|'5Y'|'MAX'} yearStr
 */
function yearToCutoff(yearStr) {
  const now = Date.now();
  const map = { '1Y': 365, '3Y': 365*3, '5Y': 365*5, 'MAX': 365*20 };
  const days = map[yearStr] || 365;
  return now - days * 24 * 3600 * 1000;
}
```

---

## Kiểm tra hoàn thành Luồng 0

Trước khi báo xong, kiểm tra:
- [ ] `uvicorn app:app --reload` chạy không lỗi
- [ ] `GET /` → trả `index.html`
- [ ] `GET /sector/steel` → trả `sector.html`
- [ ] `sector.html` load Highcharts CDN, `charts.js` không lỗi console
- [ ] `createChart()` và `createStockChart()` có trong `window`
- [ ] CSS classes `chart-card`, `sector-grid-2`, `year-btns` tồn tại
- [ ] `HC_COLORS[0]` = `'#1d4ed8'`

---

## Output bàn giao cho Luồng 1/2/3

Sau khi Luồng 0 xong, thông báo cho các luồng khác:
- `static/js/charts.js` đã có: `createChart`, `createStockChart`, `initYearButtons`, `setStaleBadge`, `showSkeleton`, `showEmpty`, `parseFindicatorSeries`, `parseWiChartSeries`, `yearToCutoff`, `HC_COLORS`, `formatVN`
- `static/css/main.css` đã có: `.chart-card`, `.chart-header`, `.chart-title`, `.chart-container`, `.year-btns`, `.stale-badge`, `.skeleton`, `.sector-grid-2`, `.block-section`, `.block-title`, `.stock-table`
- `static/sector.html` đã có: `block-a-charts`, `block-b-charts`, `block-c-charts`, `block-d-charts`, `block-e-table`, `block-f-charts` (div IDs)
- `collectors/base.py` đã có: `findicator` (FindicatorClient), `wichart` (WiChartClient)
- `routers/sector.py` đã có: `GET /api/sector/{code}/cache`
