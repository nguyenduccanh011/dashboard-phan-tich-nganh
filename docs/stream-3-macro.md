# Luồng 3 — Macro Dashboard
> Trang `/macro` — tổng hợp dữ liệu vĩ mô VN + global  
> Chạy song song với Luồng 1 và 2, SAU khi Luồng 0 hoàn thành

---

## Tài liệu cần đọc trước khi bắt đầu

1. `docs/stream-0-foundation.md` — xác nhận foundation đã xong
2. `docs/sector_hub_plan.md` §4b — stale badges + per-chart year options
3. `docs/findicator_api.md` — macroItemId list
4. `docs/STREAMS.md` §"Nguyên tắc chung"

---

## Files cần tạo

```
collectors/macro_collector.py        ← fetch macro data
cache/macro_vn.json                  ← VN macro cache
cache/macro_global.json              ← Global macro cache
static/macro.html                    ← Macro dashboard page
static/js/macro.js                   ← Render logic
```

---

## Cấu trúc trang Macro Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Macro Dashboard | Cập nhật: HH:MM DD/MM/YYYY   │
├───────────────┬──────────────────────────────────────────┤
│ [I] TTCK VN   │ [II] VĨ MÔ VN                           │
│ VN-Index      │ GDP, CPI, PMI, IIP, Bán lẻ, FDI         │
│ Thanh khoản   │ Tín dụng, M2, Tỷ giá                    │
│ PE/PB TTCK    │                                          │
├───────────────┼──────────────────────────────────────────┤
│ [III] LÃI SUẤT│ [IV] HÀNG HOÁ KEY                       │
│ Huy động VN   │ Brent, HRC, Quặng, Than, Urea            │
│ TPCP VN/US    │ Ngô, Đậu nành, Bông, Cà phê             │
│ FED, DXY      │ Vàng, Tỷ giá USD/VND, CNY               │
├───────────────┴──────────────────────────────────────────┤
│ [V] VĨ MÔ TRUNG QUỐC                                    │
│ PMI SX, CPI, PPI, XNK, Bán lẻ, Bất động sản            │
├──────────────────────────────────────────────────────────┤
│ [VI] VĨ MÔ MỸ + GLOBAL PMI                              │
│ FED rate, PMI US/EU/JP/VN, Bán lẻ Mỹ, XNK Mỹ           │
└──────────────────────────────────────────────────────────┘
```

---

## `collectors/macro_collector.py`

```python
"""
Macro collector — fetch tất cả dữ liệu vĩ mô.
Output: cache/macro_vn.json + cache/macro_global.json

Mapping macroItemId từ sector_hub_plan.md §5.1–§5.2 (tham chiếu chéo các ngành).
"""
import asyncio, json
from pathlib import Path
from datetime import datetime
from collectors.base import findicator, wichart

VN_CACHE = Path("cache/macro_vn.json")
GLOBAL_CACHE = Path("cache/macro_global.json")


async def collect():
    vn_data = await _collect_vn()
    global_data = await _collect_global()

    VN_CACHE.write_text(
        json.dumps({"updated_at": datetime.now().isoformat(), **vn_data}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    GLOBAL_CACHE.write_text(
        json.dumps({"updated_at": datetime.now().isoformat(), **global_data}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"[macro] VN cache saved → {VN_CACHE}")
    print(f"[macro] Global cache saved → {GLOBAL_CACHE}")


async def _collect_vn():
    """Vĩ mô trong nước."""

    # GDP tăng trưởng (macroItemId=1, quarter, yoy)
    gdp = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 1, "year": "5Y", "period": "quarter", "valueType": "yoy"}
    )

    # CPI VN (macroItemId=4, month, yoy)
    cpi_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 4, "nameId": 1, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # PMI sản xuất VN (macroItemId=6, month)
    pmi_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 6, "year": "5Y", "period": "month", "valueType": "value"}
    )

    # IIP tổng VN (macroItemId=7, month, yoy)
    iip_total = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 7, "nameId": 1, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # Chỉ số tiêu thụ CN (macroItemId=12, quarter, value+yoy)
    consumption_idx = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 12, "year": "5Y", "period": "quarter"}
    )

    # Chỉ số tồn kho CN (macroItemId=13, quarter, value+yoy)
    inventory_idx = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 13, "year": "5Y", "period": "quarter"}
    )

    # FDI thực hiện (macroItemId=18, month, value+yoy)
    fdi = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 18, "year": "5Y", "period": "month"}
    )

    # Vốn đầu tư NSNN (macroItemId=20, month, value+yoy)
    gov_invest = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 20, "year": "5Y", "period": "month"}
    )

    # Bán lẻ VN (macroItemId=23, month, value+yoy)
    retail_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 23, "nameId": 2, "year": "5Y", "period": "month"}
    )

    # XK VN tổng (macroItemId=25, month, value+yoy)
    export_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 25, "nameId": 1, "year": "5Y", "period": "month"}
    )

    # NK VN tổng (macroItemId=26, month, value+yoy)
    import_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 26, "nameId": 1, "year": "5Y", "period": "month"}
    )

    # Tín dụng toàn hệ thống (macroItemId=47, month, value+yoy)
    credit = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 47, "year": "5Y", "period": "month"}
    )

    # Lãi suất huy động (macroItemId=48, nhiều kỳ hạn)
    deposit_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 48, "year": "5Y", "period": "month"}
    )

    # Lãi suất LNH (WiChart PRIMARY)
    try:
        lslnh = await wichart.get("data/tien_te", params={"name": "lslnh"})
    except Exception as e:
        lslnh = {"error": str(e), "stale": True}

    # Cung tiền M2 (macroItemId=46, nameId=1, month, yoy)
    m2 = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 46, "nameId": 1, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # Tỷ giá USD/VND (macroItemId=52, nameId=1)
    usd_vnd = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 52, "nameId": 1, "year": "5Y"}
    )

    # Lợi suất TPCP VN 5Y + 10Y (macroItemId=54 — max 5Y, KHÔNG có MAX)
    tpcp_vn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 54, "nameId": "8,9", "year": "5Y"}
    )

    # OMO NHNN (macroItemId=50) — dừng 31/12/2025 → stale badge
    try:
        omo = await findicator.get(
            "macro-data/macro-item-detail",
            params={"macroItemId": 50, "year": "5Y"}
        )
        omo_meta = {"data": omo, "stale": False}
    except Exception:
        omo_meta = {"data": [], "stale": True, "stale_reason": "Dừng 31/12/2025"}

    # Dự trữ ngoại hối (macroItemId=55)
    forex_reserve = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 55, "year": "5Y"}
    )

    # Cán cân thanh toán (macroItemId=56, quarterly)
    balance_of_payments = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 56, "year": "5Y", "period": "quarter"}
    )

    # TTCK VN (macroItemId=134)
    market = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 134, "year": "5Y"}
    )

    return {
        "gdp": gdp,
        "cpi_vn": cpi_vn,
        "pmi_vn": pmi_vn,
        "iip_total": iip_total,
        "consumption_idx": consumption_idx,
        "inventory_idx": inventory_idx,
        "fdi": fdi,
        "gov_invest": gov_invest,
        "retail_vn": retail_vn,
        "export_vn": export_vn,
        "import_vn": import_vn,
        "credit": credit,
        "deposit_rate": deposit_rate,
        "lslnh": lslnh,
        "m2": m2,
        "usd_vnd": usd_vnd,
        "tpcp_vn": tpcp_vn,
        "omo": omo_meta,
        "forex_reserve": forex_reserve,
        "balance_of_payments": balance_of_payments,
        "market": market,
    }


async def _collect_global():
    """Vĩ mô toàn cầu."""

    # FED rate (macroItemId=96, nameId=1)
    fed_rate = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 96, "nameId": 1, "year": "5Y"}
    )

    # Lợi suất UST 2Y + 10Y (macroItemId=54 nameId=US_2Y/US_10Y)
    ust = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 54, "nameId": "3,4", "year": "5Y"}
    )

    # DXY index
    dxy = await findicator.get("bank/dxy-index", params={"year": "5Y"})

    # CPI TQ (macroItemId=107, month, yoy) — lag ~13 tháng
    cpi_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 107, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # PPI TQ (macroItemId=112, month, yoy) — lag ~5 tháng
    ppi_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 112, "year": "5Y", "period": "month", "valueType": "yoy"}
    )

    # PMI TQ (macroItemId=115, nameId=8 SX + nameId=9 XK orders)
    pmi_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 115, "nameId": "8,9", "year": "5Y", "period": "month"}
    )

    # Global PMI nhiều quốc gia (overview/overview-data?tabId=4)
    global_pmi = await findicator.get(
        "overview/overview-data",
        params={"tabId": 4}
    )

    # XNK TQ (macroItemId=127, month, value+yoy)
    trade_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 127, "year": "5Y", "period": "month"}
    )

    # Bán lẻ TQ (macroItemId=126, month, value+yoy)
    retail_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 126, "year": "5Y", "period": "month"}
    )

    # Bán lẻ Mỹ (macroItemId=84, nameId=1 tổng + nameId=14 thực phẩm)
    retail_us = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 84, "nameId": "1,14", "year": "5Y", "period": "month"}
    )

    # XNK Mỹ (macroItemId=87, month, value+yoy)
    trade_us = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 87, "year": "5Y", "period": "month"}
    )

    # Hàng hoá key (macroItemId=35, nameIds quan trọng nhất)
    # Brent=65, WTI=67, HH Gas=66, Quặng CME=82, HRC CME=86, Than ICE=68,
    # Ngô CBOT=108, ĐN CBOT=87, Bông CBOT=98, Arabica=95, Vàng ICE=78, Urea CME=50
    commodities = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": 35, "nameId": "65,67,66,82,86,68,108,87,98,95,78,50", "year": "5Y"}
    )

    # BĐS TQ (macroItemId=121-125)
    realestate_cn = await findicator.get(
        "macro-data/macro-item-detail",
        params={"macroItemId": "121,122,123,125", "year": "5Y", "period": "quarter"}
    )

    return {
        "fed_rate": fed_rate,
        "ust": ust,
        "dxy": dxy,
        "cpi_cn": {"data": cpi_cn, "stale": False, "lag_note": "Lag ~13 tháng"},
        "ppi_cn": {"data": ppi_cn, "stale": False, "lag_note": "Lag ~5 tháng"},
        "pmi_cn": pmi_cn,
        "global_pmi": global_pmi,
        "trade_cn": trade_cn,
        "retail_cn": retail_cn,
        "retail_us": retail_us,
        "trade_us": trade_us,
        "commodities": commodities,
        "realestate_cn": realestate_cn,
    }


if __name__ == "__main__":
    asyncio.run(collect())
```

---

## `static/macro.html`

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Macro Dashboard — Sector Hub</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,800;1,400;1,600&family=Playfair+Display:wght@900&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="/static/css/main.css"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.highcharts.com/stock/highstock.js"></script>
  <script src="https://code.highcharts.com/modules/exporting.js"></script>
</head>
<body>
  <header class="sh-header">
    <div class="sh-header-inner">
      <a href="/" class="sh-brand">Sector Hub</a>
      <div class="sh-header-meta">
        <span class="sh-sector-name">Macro Dashboard</span>
        <span class="sh-updated" id="last-updated">—</span>
      </div>
    </div>
  </header>

  <main class="sh-main">
    <!-- [I] TTCK VN | [II] Vĩ mô VN -->
    <div class="sector-grid-2">
      <section class="block-section" id="block-market">
        <div class="block-title">I — Thị trường chứng khoán VN</div>
        <div id="market-charts"></div>
      </section>
      <section class="block-section" id="block-macro-vn">
        <div class="block-title">II — Vĩ mô trong nước</div>
        <div id="macro-vn-charts"></div>
      </section>
    </div>

    <!-- [III] Lãi suất | [IV] Hàng hoá -->
    <div class="sector-grid-2">
      <section class="block-section" id="block-rates">
        <div class="block-title">III — Lãi suất & tỷ giá</div>
        <div id="rates-charts"></div>
      </section>
      <section class="block-section" id="block-commodities">
        <div class="block-title">IV — Hàng hoá key</div>
        <div id="commodities-charts"></div>
      </section>
    </div>

    <!-- [V] Vĩ mô TQ -->
    <section class="block-section" id="block-china">
      <div class="block-title">V — Vĩ mô Trung Quốc</div>
      <div class="sector-grid-2" id="china-charts"></div>
    </section>

    <!-- [VI] Vĩ mô Mỹ + Global PMI -->
    <section class="block-section" id="block-global">
      <div class="block-title">VI — Mỹ & PMI toàn cầu</div>
      <div class="sector-grid-2" id="global-charts"></div>
    </section>
  </main>

  <script src="/static/js/charts.js"></script>
  <script src="/static/js/macro.js"></script>
</body>
</html>
```

---

## `static/js/macro.js` — skeleton

```javascript
// static/js/macro.js
// Render Macro Dashboard — 6 blocks

(async function MacroDashboard() {
  // Load cả 2 cache song song
  const [vnRes, globalRes] = await Promise.all([
    fetch('/api/macro/vn').then(r => r.json()),
    fetch('/api/macro/global').then(r => r.json()),
  ]);

  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(vnRes.updated_at).toLocaleString('vi-VN');

  renderBlockI_Market(vnRes.market);
  renderBlockII_MacroVN(vnRes);
  renderBlockIII_Rates(vnRes, globalRes);
  renderBlockIV_Commodities(globalRes.commodities);
  renderBlockV_China(globalRes);
  renderBlockVI_Global(globalRes);
})();


function renderBlockI_Market(market) {
  const c = document.getElementById('market-charts');

  // VN-Index + Thanh khoản
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">VN-Index & Thanh khoản</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-vnindex"></div>
    </div>
  `);

  const card = c.querySelector('.chart-card');
  const vnIdx = parseFindicatorSeries(market?.filter(r => r.nameId === 3));  // VNINDEX
  const liquidity = parseFindicatorSeries(market?.filter(r => r.nameId === 1)); // thanh khoản

  function renderVNIndex(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-vnindex', {
      yAxis: [
        { title: { text: 'VN-Index' } },
        { title: { text: 'Tỷ VNĐ' }, opposite: true },
      ],
      series: [
        { name: 'VN-Index', data: vnIdx.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        {
          name: 'Thanh khoản (tỷ)',
          data: liquidity.filter(p => p[0] >= cutoff),
          type: 'column', color: HC_COLORS[3],
          yAxis: 1, opacity: 0.5,
        },
      ],
    });
  }

  initYearButtons(card, renderVNIndex);
  renderVNIndex('1Y');
}


function renderBlockII_MacroVN(vn) {
  const c = document.getElementById('macro-vn-charts');

  // GDP + CPI combo
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">GDP & CPI YoY (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gdp-cpi"></div>
    </div>
  `);

  const card = c.querySelector('.chart-card');
  const gdpData = parseFindicatorSeries(vn.gdp);
  const cpiData = parseFindicatorSeries(vn.cpi_vn);

  function renderGdpCpi(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-gdp-cpi', {
      chart: { type: 'line' },
      xAxis: { type: 'datetime' },
      series: [
        { name: 'GDP YoY (%)', data: gdpData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'CPI YoY (%)', data: cpiData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
      tooltip: { valueSuffix: '%' },
    });
  }

  initYearButtons(card, renderGdpCpi);
  renderGdpCpi('3Y');

  // PMI VN
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI sản xuất VN</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-pmi-vn"></div>
    </div>
  `);

  const card2 = c.querySelectorAll('.chart-card')[1];
  const pmiData = parseFindicatorSeries(vn.pmi_vn);
  // Thêm plotLine tại 50 (ngưỡng mở rộng/thu hẹp)
  function renderPmi(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-pmi-vn', {
      chart: { type: 'area' },
      xAxis: { type: 'datetime' },
      yAxis: {
        min: 40,
        plotLines: [{ value: 50, color: HC_COLORS[1], width: 1, dashStyle: 'ShortDash', label: { text: '50', style: { color: HC_COLORS[1] } } }],
      },
      series: [{ name: 'PMI VN', data: pmiData.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(card2, renderPmi);
  renderPmi('3Y');
}


function renderBlockIII_Rates(vn, global) {
  const c = document.getElementById('rates-charts');

  // Lãi suất huy động 12M
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất huy động 12M</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-deposit-rate"></div>
    </div>
  `);

  // Tỷ giá USD/VND
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-usdvnd"></div>
    </div>
  `);

  // Stale: OMO dừng 31/12/2025
  if (vn.omo?.stale) {
    const omoCard = c.querySelector('[data-for="omo"]');
    if (omoCard) setStaleBadge(omoCard, 'warn', 'Dữ liệu đến 12/2025');
  }

  // TODO: implement renders
  showEmpty('chart-deposit-rate', 'Đang load...');
  showEmpty('chart-usdvnd', 'Đang load...');
}


function renderBlockIV_Commodities(commodities) {
  // Group commodities theo nhóm
  const groups = {
    energy:     { name: 'Năng lượng', nameIds: [65, 67, 66] },
    metal:      { name: 'Kim loại', nameIds: [82, 86] },
    agri:       { name: 'Nông sản', nameIds: [108, 87, 98, 95] },
    other:      { name: 'Khác', nameIds: [78, 50] },
  };

  const c = document.getElementById('commodities-charts');
  Object.entries(groups).forEach(([key, group]) => {
    const id = `chart-comdty-${key}`;
    c.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">${group.name}</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-sm" id="${id}"></div>
      </div>
    `);
    showEmpty(id, 'Đang load...');
  });
}


function renderBlockV_China(global) {
  const c = document.getElementById('china-charts');

  // PMI TQ
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI SX Trung Quốc</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-pmi-cn"></div>
    </div>
  `);

  // CPI/PPI TQ với stale badges
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">CPI & PPI Trung Quốc YoY</span>
        <div style="display:flex;gap:4px;align-items:center">
          <span class="stale-badge warn">CPI lag ~13 tháng</span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container chart-sm" id="chart-cpi-ppi-cn"></div>
    </div>
  `);
}


function renderBlockVI_Global(global) {
  const c = document.getElementById('global-charts');

  // Global PMI heatmap/multi-line
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI sản xuất toàn cầu</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-lg" id="chart-global-pmi"></div>
    </div>
  `);

  // nameIds PMI từ global_pmi:
  // 34=CN, 36=DE, 37=IN, 44=US, 45=VN, 49=Euro, 40=JP
  showEmpty('chart-global-pmi', 'Đang load...');
}
```

---

## Router cần thêm vào `routers/macro.py`

```python
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()
CACHE_DIR = Path("cache")

@router.get("/vn")
async def get_macro_vn():
    f = CACHE_DIR / "macro_vn.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(f.read_text(encoding="utf-8")))

@router.get("/global")
async def get_macro_global():
    f = CACHE_DIR / "macro_global.json"
    if not f.exists():
        return JSONResponse({"error": "cache not found"}, status_code=404)
    return JSONResponse(json.loads(f.read_text(encoding="utf-8")))
```

---

## Stale badges cần hiển thị trong Macro Dashboard

| Chart | Badge | Type |
|---|---|---|
| OMO NHNN | "Dữ liệu đến 12/2025" | warn |
| macroItemId=53 (CNY khác) | "Nguồn: Findicator realtime" | info |
| CPI TQ (macroItemId=107) | "Lag ~13 tháng" | warn |
| PPI TQ (macroItemId=112) | "Lag ~5 tháng" | warn |
| China energy (macroItemId=119) | "Lag ~17 tháng" | warn |

---

## Checklist Luồng 3

- [ ] `macro_collector.py` chạy không lỗi, tạo được `cache/macro_vn.json` + `macro_global.json`
- [ ] `GET /api/macro/vn` trả đúng JSON
- [ ] `GET /api/macro/global` trả đúng JSON
- [ ] 6 blocks hiển thị đủ trong `/macro`
- [ ] Stale badges đúng (OMO, CPI TQ, PPI TQ)
- [ ] TPCP VN: chỉ có `data-year-options="1Y,3Y,5Y"` (KHÔNG có MAX)
- [ ] `Promise.all([fetch vn, fetch global])` — load song song
- [ ] PMI chart có plotLine tại 50
