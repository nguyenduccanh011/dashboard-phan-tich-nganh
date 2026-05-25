# Luồng 1 — Sectors có Findicator Dashboard
> 16 ngành có prefix riêng trên Findicator API  
> Chạy song song với Luồng 2 và 3, SAU khi Luồng 0 hoàn thành

---

## Tài liệu cần đọc trước khi bắt đầu

1. `docs/stream-0-foundation.md` — xác nhận foundation đã xong (đặc biệt mục "Output bàn giao")
2. `docs/sector_hub_plan.md` §4 (layout 6 khối) + §4b (quy tắc chung, year buttons, stale badges)
3. `docs/findicator_api.md` — auth flow, endpoint structure, tableName/corpType/accountId
4. `docs/STREAMS.md` §"Nguyên tắc chung" — quy tắc UI bắt buộc

Khi làm **ngành cụ thể**, đọc thêm section tương ứng trong `sector_hub_plan.md`:

| Ngành | Section trong sector_hub_plan.md |
|---|---|
| Steel | §5.1 |
| Bank | §5.2 |
| Cement | §5.3 |
| Pangasius | §5.4 |
| Shrimp | §5.5 |
| Aviation | §5.6 |
| Rubber | §5.7 |
| Pig | §5.8 |
| Chemistry | §5.9 |
| Textile | §5.10 |
| Industry (KCN) | §5.11 |
| Real Estate | §5.12 |
| Transport | §5.13 |
| Securities | §5.14 |
| Food & Beverage | §5.15 |
| Electricity | §5.16 |

---

## Cấu trúc file mỗi ngành

Mỗi ngành sinh ra đúng **2 files**:

```
collectors/{sector}_collector.py     ← fetch API + save cache
static/js/sector-{code}.js           ← render 6 khối A–F
```

Router không cần file riêng — dùng generic endpoint `GET /api/sector/{code}/cache` từ Luồng 0.

---

## Template collector

```python
# collectors/steel_collector.py
"""
Collector cho ngành thép (/sector/steel).
Đọc: docs/sector_hub_plan.md §5.1 để biết đầy đủ mapping.
Output: cache/sector_steel.json
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

CACHE_FILE = Path("cache/sector_steel.json")
TICKERS = ["HPG", "HSG", "NKG", "TNA"]


async def collect():
    """Thu thập toàn bộ data ngành thép và lưu cache."""
    
    # === Khối A — Giá đầu vào ===
    # Findicator macro: macroItemId=35, nameId={82,243,153,158,86,161,61}
    # Findicator macro: macroItemId=52 (USD/VND), macroItemId=53 (CNY/VND)
    block_a = await _collect_block_a()

    # === Khối B — Thị trường ngành ===
    block_b = await _collect_block_b()

    # === Khối C — Giá bán ===
    block_c = await _collect_block_c()

    # === Khối D — Spread ===
    # Tính client-side từ B và C, không cần collect riêng
    block_d = {"computed_client_side": True}

    # === Khối E — Cổ phiếu (TRAILING corpType=4) ===
    block_e = await _collect_block_e()

    # === Khối F — BCTC 8 quý ===
    block_f = await _collect_block_f()

    cache = {
        "sector": "steel",
        "sector_name": "Thép",
        "updated_at": datetime.now().isoformat(),
        "tickers": TICKERS,
        "block_a": block_a,
        "block_b": block_b,
        "block_c": block_c,
        "block_d": block_d,
        "block_e": block_e,
        "block_f": block_f,
    }

    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[steel] cache saved → {CACHE_FILE}")
    return cache


async def _collect_block_a():
    # Quặng sắt CME, Than cốc, HRC, Thép phế, Tỷ giá
    # Xem sector_hub_plan.md §5.1 Khối A để biết đầy đủ nameIds
    macro_35 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "82,243,153,158,86,161,61", "year": "5Y"}
    )
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 1, "year": "5Y"}
    )
    # CNY/VND: macroItemId=53 chỉ có đến 31/12/2025, fallback steel/exchange-rate
    try:
        cny_vnd = await findicator.get("steel/exchange-rate")
    except Exception:
        cny_vnd = {"stale": True, "stale_reason": "macroItemId=53 dừng 31/12/2025"}

    return {
        "macro_35": macro_35,
        "usd_vnd": usd_vnd,
        "cny_vnd": cny_vnd,
    }


async def _collect_block_b():
    market_share = await findicator.get("steel/domestic-market-share", params={"year": "5Y"})
    inventory = await findicator.get(
        "steel/domestic-market-data",
        params={"seriesType": "TIME_SERIES", "type": "inventory"}
    )
    export_status = await findicator.get(
        "steel/demand-export-status",
        params={"seriesType": "TIME_SERIES", "year": "5Y"}
    )
    overview = await findicator.get("steel/overview/steel-data")
    return {
        "market_share": market_share,
        "inventory": inventory,
        "export_status": export_status,
        "overview": overview,
    }


async def _collect_block_c():
    # Giá thép bán VN: nameId=10,593,595,596 từ steel/input-price
    prices = await findicator.get(
        "steel/input-price",
        params={"macroIds": "47,49,159,167", "vnMacroIds": 11, "year": "5Y"}
    )
    return {"sell_prices": prices}


async def _collect_block_e():
    results = {}
    for ticker in TICKERS:
        trailing = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "TRAILING",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": "35,39,40,2,8,163,154,155,47",
            }
        )
        analyst = await findicator.get(
            "enterprise/report-analysis",
            params={"ticket": ticker}
        )
        results[ticker] = {"trailing": trailing, "analyst": analyst}
    return results


async def _collect_block_f():
    results = {}
    for ticker in TICKERS[:3]:  # HPG, HSG, NKG
        ts = await findicator.get(
            "enterprise/v2/finance-ticket-data",
            params={
                "tableName": "INCOME_STATEMENT",
                "corpType": 4,
                "ticket": f'["{ticker}"]',
                "accountIds": "24,28,43,2",
                "period": "quarter",
            }
        )
        results[ticker] = ts
    return results


if __name__ == "__main__":
    asyncio.run(collect())
```

---

## Template sector JS

```javascript
// static/js/sector-steel.js
// Render trang ngành Thép — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorSteel() {
  // --- Load cache ---
  let data;
  try {
    const res = await fetch('/api/sector/steel/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Thép — Lỗi tải dữ liệu';
    return;
  }

  // --- Metadata header ---
  document.getElementById('sector-name').textContent = 'Ngành Thép';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Thép — Sector Hub';

  // --- Render từng khối ---
  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);  // tính spread từ A+C
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Quặng sắt (CME USD + TQ CNY — dual axis)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Quặng sắt</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="stale-badge" style="display:none"></span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container" id="chart-iron-ore"></div>
    </div>
  `);

  const card = container.querySelector('[data-year-options]');
  const seriesCme = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 82));
  const seriesTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 243));

  function renderIronOre(year) {
    const cutoff = yearToCutoff(year);
    showSkeleton('chart-iron-ore');
    createStockChart('chart-iron-ore', {
      yAxis: [
        { title: { text: 'USD/T' }, labels: { format: '{value:,.0f}' } },
        { title: { text: 'CNY/T' }, labels: { format: '{value:,.0f}' }, opposite: true },
      ],
      series: [
        { name: 'CME (USD/T)', data: seriesCme.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TQ (CNY/T)', data: seriesTq.filter(p => p[0] >= cutoff), color: HC_COLORS[4], yAxis: 1 },
      ],
    });
  }

  initYearButtons(card, renderIronOre);
  renderIronOre('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: Thị phần 4 DN (pie)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Thị phần nội địa</span>
      </div>
      <div class="chart-container chart-sm" id="chart-market-share"></div>
    </div>
  `);

  const shareData = blockB.market_share;
  if (!shareData || !shareData.length) {
    showEmpty('chart-market-share');
    return;
  }

  // Lấy điểm mới nhất cho pie chart
  const latest = shareData[shareData.length - 1];
  createChart('chart-market-share', {
    chart: { type: 'pie' },
    series: [{
      name: 'Thị phần',
      data: Object.entries(latest.shares || {}).map(([name, y]) => ({ name, y })),
    }],
  });
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá thép nội địa</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-sell-price"></div>
    </div>
  `);

  const card = container.querySelector('.chart-card');
  const prices = blockC.sell_prices || [];

  // nameId=10 (CB300), 593 (CB400), 595 (cuộn 6), 596 (cuộn 8)
  const series = [
    { nameId: 10,  name: 'CB300-D10', color: HC_COLORS[0] },
    { nameId: 593, name: 'CB400-D10', color: HC_COLORS[1] },
    { nameId: 595, name: 'Cuộn D6',   color: HC_COLORS[2] },
    { nameId: 596, name: 'Cuộn D8',   color: HC_COLORS[3] },
  ].map(s => ({
    ...s,
    data: parseFindicatorSeries(prices.filter(r => r.nameId === s.nameId)),
  }));

  function renderSellPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-sell-price', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: series.map(s => ({
        name: s.name, color: s.color,
        data: s.data.filter(p => p[0] >= cutoff),
      })),
    });
  }

  initYearButtons(card, renderSellPrice);
  renderSellPrice('1Y');
}


function renderBlockD(blockA, blockC) {
  // Spread = Giá CB300 − [Quặng × 1.6 × USD_VND + Than × 0.5 × USD_VND]
  // Tính client-side, không có API riêng
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Thép – NVL</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  // TODO: implement spread calculation
  showEmpty('chart-spread', 'Spread = CB300 − (Quặng×1.6 + Than×0.5) × USD/VND');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE);
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  // Build bảng từ TRAILING data
  const rows = tickers.map(t => {
    const tr = blockE[t]?.trailing;
    const get = (id) => tr?.find(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = analyst?.recommendation;
    return {
      ticker: t,
      marketCap: get(35), pe: get(39), pb: get(40),
      grossMargin: get(2), roe: get(8),
      dtGrowth: get(163), peFwd: get(154), pbFwd: get(155),
      recommendation: rec?.type, upside: rec?.upside, targetPrice: rec?.targetPrice,
    };
  });

  const recTag = (r) => {
    if (!r) return '—';
    const map = { BUY: 'tag-buy', HOLD: 'tag-hold', SELL: 'tag-sell' };
    return `<span class="${map[r] || ''}">${r}</span>`;
  };
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v*100).toFixed(1)}%</span>` : '—';
  const num = (v, dp=1) => v != null ? Highcharts.numberFormat(v, dp) : '—';

  container.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Vốn hóa (tỷ)</th>
          <th>PE</th>
          <th>PB</th>
          <th>PE fwd</th>
          <th>Biên gộp</th>
          <th>ROE</th>
          <th>DT YoY</th>
          <th>Recommend</th>
          <th>Upside</th>
          <th>Target</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.ticker}</td>
            <td>${num(r.marketCap, 0)}</td>
            <td>${num(r.pe)}</td>
            <td>${num(r.pb)}</td>
            <td>${num(r.peFwd)}</td>
            <td>${pct(r.grossMargin)}</td>
            <td>${pct(r.roe)}</td>
            <td>${pct(r.dtGrowth)}</td>
            <td>${recTag(r.recommendation)}</td>
            <td>${r.upside != null ? pct(r.upside/100) : '—'}</td>
            <td>${r.targetPrice ? num(r.targetPrice, 0) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function renderBlockF(blockF) {
  const container = document.getElementById('block-f-charts');
  const tickers = Object.keys(blockF);

  tickers.forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);

    const rows = blockF[ticker];
    if (!rows?.length) { showEmpty(`chart-bctc-${ticker}`); return; }

    const quarters = [...new Set(rows.map(r => r.period))].sort().slice(-8);
    const getQ = (accId) => quarters.map(q => {
      const r = rows.find(x => x.period === q && x.accountId === accId);
      return r?.value ?? null;
    });

    createChart(`chart-bctc-${ticker}`, {
      chart: { type: 'column' },
      xAxis: { categories: quarters },
      yAxis: [
        { title: { text: 'Tỷ VNĐ' } },
        { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } },
      ],
      series: [
        { name: 'Doanh thu', type: 'column', data: getQ(24), color: HC_COLORS[0] },
        { name: 'LN gộp', type: 'column', data: getQ(28), color: HC_COLORS[2] },
        { name: 'LNST', type: 'column', data: getQ(43), color: HC_COLORS[3] },
        { name: 'Biên gộp %', type: 'line', data: getQ(2), color: HC_COLORS[1], yAxis: 1,
          tooltip: { valueSuffix: '%' } },
      ],
    });
  });
}
```

---

## Thứ tự ưu tiên ngành trong Luồng 1

Làm theo thứ tự này nếu làm tuần tự (hoặc phân phối cho agent riêng):

| Ưu tiên | Ngành | Lý do | corpType TRAILING |
|---|---|---|---|
| 1 | **Steel** | Nhiều data nhất, test đầy đủ pattern | 4 |
| 2 | **Bank** | corpType=1, KPI riêng — phải làm sớm | 1 |
| 3 | **Electricity** | Nhiều API đặc biệt (ENSO, lake, plant) | 4 |
| 4 | **Pangasius** | Pattern XNK per-market đại diện cho tôm, cá tra | 4 |
| 5 | **Shrimp** | Tương tự pangasius | 4 |
| 6 | **Chemistry** | Nhiều nameIds giá NVL | 4 |
| 7 | **Textile** | Nhiều repos khác nhau | 4 |
| 8 | **Transport** | Nhiều freight index nameIds | 4 |
| 9 | **Securities** | corpType=3 | 3 |
| 10 | Cement | Đơn giản | 4 |
| 11 | Aviation | Đơn giản | 4 |
| 12 | Rubber | Đơn giản, stale data | 4 |
| 13 | Pig | Đơn giản, fixed 1Y | 4 |
| 14 | Industry (KCN) | FDI data | 4 |
| 15 | Real Estate | Luật BĐS, không có supply/demand API | 4 |
| 16 | Food & Beverage | Đơn giản | 4 |

---

## Những điểm đặc biệt cần chú ý theo ngành

### Bank (§5.2) — khác biệt lớn nhất
- `corpType=1` — accountIds TRAILING **khác hoàn toàn** corpType=4
- PE=**89**, PB=**90**, ROE=**67**, ROA=**68** (KHÔNG phải 39, 40, 8, 9)
- WiChart `key=tien_te, name=lslnh` là PRIMARY cho lãi suất LNH (macroItemId=49 = 0 rows)
- Bank có thêm ~15 charts đặc biệt (xem §5.2 "Thêm — Bank-specific charts")
- `bank/bank-list` → dropdown 30 NH để chọn per-NH

### Electricity (§5.16)
- `electricity/electric-output-plant` và `output-resource-by-value` **không có year param** — trả full
- ENSO forecast cần gọi `enso-nearest-date` trước để lấy date, rồi gọi `enso-forecast?date=`
- Lake levels: gọi `lake-name` để lấy danh sách lakeId, sau đó gọi per lakeId
- `data-year-options="5Y,10Y,All"` cho `output-resource-by-proportion`

### Transport (§5.13)
- nameId=322 (MR tanker) và 341 (VLCC): **0 rows** — đã loại bỏ khỏi API call
- nameId=339 (Aframax) và 340 (Suezmax): **có data** ✅
- `data-year-options="1Y,3Y,5Y"` (MAX → null)

### Rubber (§5.7)
- WiChart `cao_su` stale ~15 tháng → set badge: `setStaleBadge(card, 'warn', 'Dữ liệu đến 02/2025')`
- `data-year-options="1Y,3Y,5Y"` (MAX → null)

### Pig (§5.8)
- `pig_farming_global`: **cố định year=1Y** trong collector (5Y/MAX → lỗi 400)
- Không có per-DN data (DBC/BAF/MML) — chỉ BCTC

### Bank deposit rate (§5.2)
- `macroItemId=50` (OMO): dừng 31/12/2025 → badge warn
- `macroItemId=54` (TPCP): max `5Y`, không có MAX

---

## Checklist mỗi ngành

- [ ] `collectors/{sector}_collector.py`: fetch tất cả blocks, save `cache/sector_{code}.json`
- [ ] `static/js/sector-{code}.js`: render đủ 6 khối A–F
- [ ] Stale badges đúng với bảng §4b sector_hub_plan.md
- [ ] Year buttons đúng `data-year-options` theo §4b
- [ ] Khối E: hiển thị đúng accountIds theo corpType (4/1/3)
- [ ] Khối F: 8 quý gần nhất, combo column+line
- [ ] Không có lỗi JS console khi mở `/sector/{code}`
- [ ] Chart reflow đúng khi resize cửa sổ
