// static/js/sector-pangasius.js
// Render trang ngành Cá tra — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorPangasius() {
  let data;
  try {
    const res = await fetch('/api/sector/pangasius/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Cá tra — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Cá tra';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Cá tra — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Giá cá tra nguyên liệu (nameId=3) + Giá giống (nameId=2) — VNĐ/kg
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá cá tra VN (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fish-price"></div>
    </div>
  `);
  const cardFish = container.lastElementChild;
  const seriesNguyenLieu = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 3));
  const seriesGiong      = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 2));
  function renderFishPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-fish-price', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: [
        { name: 'Cá tra NL', data: seriesNguyenLieu.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Cá tra giống', data: seriesGiong.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(cardFish, renderFishPrice);
  renderFishPrice('1Y');

  // Chart 2: Thức ăn — Ngô CBOT (nameId=108) + Đậu nành (nameId=87) — USD — dual axis với VNĐ
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Thức ăn chăn nuôi (CBOT)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-feed"></div>
    </div>
  `);
  const cardFeed = container.lastElementChild;
  const seriesCorn     = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 108));
  const seriesSoybean  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 87));
  function renderFeed(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-feed', {
      series: [
        { name: 'Ngô CBOT (USd/Bu)', data: seriesCorn.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Đậu nành CBOT', data: seriesSoybean.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(cardFeed, renderFeed);
  renderFeed('1Y');

  // Chart 3: Bán lẻ thực phẩm Mỹ (proxy demand cá tra)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ thực phẩm Mỹ (Tr USD) — proxy demand XK</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-us-retail"></div>
    </div>
  `);
  const cardRetail = container.lastElementChild;
  const seriesFood  = parseFindicatorSeries(blockA.retail_food_us);
  const seriesTotal = parseFindicatorSeries(blockA.retail_total_us);
  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-us-retail', {
      yAxis: [
        { title: { text: 'Thực phẩm (Tr USD)' } },
        { title: { text: 'Tổng BL (Tr USD)' }, opposite: true },
      ],
      series: [
        { name: 'Thực phẩm & Đồ uống (Tr USD)', data: seriesFood.filter(p => p[0] >= cutoff), color: HC_COLORS[0], yAxis: 0 },
        { name: 'Tổng bán lẻ Mỹ (Tr USD)', data: seriesTotal.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(cardRetail, renderRetail);
  renderRetail('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: XK cá tra theo thị trường (4 nước) — year-options="1Y,3Y,5Y"
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK cá tra theo thị trường</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-export-markets"></div>
    </div>
  `);
  const cardMarkets = container.lastElementChild;
  const mktData = blockB.export_qty_markets || [];
  function renderExportMarkets(year) {
    const cutoff = yearToCutoff(year);
    if (!mktData.length) { showEmpty('chart-export-markets'); return; }
    createStockChart('chart-export-markets', {
      series: mktData.map((r, i) => ({
        name: r.country_name,
        color: HC_COLORS[i],
        data: parseFindicatorSeries(r.data || [], 'date', 'turnover').filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(cardMarkets, renderExportMarkets);
  renderExportMarkets('1Y');

  // Chart 2: XK cá tra toàn ngành YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK cá tra toàn ngành YoY (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-export-yoy"></div>
    </div>
  `);
  const cardYoy = container.lastElementChild;
  const yoyRaw = blockB.export_yoy || [];
  const yoyFlat = Array.isArray(yoyRaw[0]) ? yoyRaw.flat() : yoyRaw;
  const yoyData = parseFindicatorSeries(yoyFlat, 'date', 'turnover');
  function renderYoy(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-export-yoy', {
      series: [{ name: 'XK YoY (%)', data: yoyData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(cardYoy, renderYoy);
  renderYoy('1Y');

  // Chart 3: Turnover per-DN monthly (dropdown selector)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Turnover XK per-DN (Tr USD)</span>
      </div>
      <div class="chart-container" id="chart-dn-export"></div>
    </div>
  `);
  const exportStatus = blockB.export_status || {};
  const dnSeries = Object.entries(exportStatus)
    .map(([ticker, rows], i) => {
      const flat = Array.isArray(rows) ? rows.flat() : [];
      return {
        name: ticker,
        color: HC_COLORS[i],
        data: parseFindicatorSeries(flat, 'date', 'turnover'),
      };
    })
    .filter(s => s.data.length);
  if (dnSeries.length) {
    createStockChart('chart-dn-export', { series: dnSeries });
  } else {
    showEmpty('chart-dn-export');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  const tickers = Object.keys(blockC.export_price_markets || {});

  // Hiển thị ASP per-DN × thị trường — 1 chart per DN
  tickers.forEach((ticker, tIdx) => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">ASP XK ${ticker} (USD/kg)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-asp-${ticker}"></div>
      </div>
    `);
    const card = container.lastElementChild;
    const priceData = blockC.export_price_markets[ticker] || [];

    function renderAsp(year) {
      const cutoff = yearToCutoff(year);
      if (!priceData.length) { showEmpty(`chart-asp-${ticker}`); return; }
      createStockChart(`chart-asp-${ticker}`, {
        series: priceData.map((r, i) => ({
          name: r.country_name || r.name || r.market || `TT${i+1}`,
          color: HC_COLORS[i],
          data: parseFindicatorSeries(r.data || [], 'date', 'price').filter(p => p[0] >= cutoff),
        })),
      });
    }
    initYearButtons(card, renderAsp);
    renderAsp('1Y');
  });

  // XK Turnover theo thị trường per-DN (export_status_markets)
  const smTickers = Object.keys(blockC.export_status_markets || {});
  smTickers.forEach((ticker, tIdx) => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">Turnover XK ${ticker} theo thị trường (Tr USD)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-turn-mkt-${ticker}"></div>
      </div>
    `);
    const card2 = container.lastElementChild;
    const smData = blockC.export_status_markets[ticker] || [];

    function renderTurnMkt(year) {
      const cutoff = yearToCutoff(year);
      if (!smData.length) { showEmpty(`chart-turn-mkt-${ticker}`); return; }
      createStockChart(`chart-turn-mkt-${ticker}`, {
        series: smData.map((r, i) => ({
          name: r.country_name || `TT${i+1}`,
          color: HC_COLORS[i],
          data: parseFindicatorSeries((r.data || []).flat(), 'date', 'turnover').filter(p => p[0] >= cutoff),
        })),
      });
    }
    initYearButtons(card2, renderTurnMkt);
    renderTurnMkt('1Y');
  });
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Spread Cá tra (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  // Snap timestamp về UTC day boundary để tránh lệch timezone giữa ISO UTC và MM/DD/YYYY local
  const snapDay = ts => Math.floor(ts / 86400000) * 86400000;

  // Giá cá tra NL (name_id=3) từ block_a
  const seriesNL = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 3));
  // Tỷ giá USD/VND
  const seriesUsd = parseFindicatorSeries(blockA.usd_vnd);

  // ASP XK VHC (USD/kg) — gộp trung bình tất cả thị trường
  const vhcPriceData = (blockC.export_price_markets?.VHC) || [];
  const aspByDate = {};
  vhcPriceData.forEach(market => {
    (market.data || []).forEach(r => {
      const t = snapDay(new Date(r.date).getTime());
      if (!aspByDate[t]) aspByDate[t] = [];
      aspByDate[t].push(r.price);
    });
  });
  const aspSeries = Object.entries(aspByDate)
    .map(([t, vals]) => [Number(t), vals.reduce((a, b) => a + b, 0) / vals.length])
    .sort((a, b) => a[0] - b[0]);

  // Build lookup maps với snapped keys
  const usdMap = {};
  seriesUsd.forEach(([t, v]) => { usdMap[snapDay(t)] = v; });
  const nlMap = {};
  seriesNL.forEach(([t, v]) => { nlMap[snapDay(t)] = v; });

  // Tính spread: ASP (USD/kg) × tỷ giá − giá NL (VNĐ/kg)
  // Match theo tháng gần nhất
  const spreadSeries = aspSeries.map(([t, asp]) => {
    // Tìm USD/VND gần nhất (±45 ngày)
    let usdRate = null;
    for (let d = 0; d <= 45; d++) {
      usdRate = usdMap[t + d * 86400000] || usdMap[t - d * 86400000] || null;
      if (usdRate) break;
    }
    let nlPrice = null;
    for (let d = 0; d <= 45; d++) {
      nlPrice = nlMap[t + d * 86400000] || nlMap[t - d * 86400000] || null;
      if (nlPrice) break;
    }
    if (!usdRate || !nlPrice) return null;
    return [t, asp * usdRate - nlPrice];
  }).filter(Boolean);

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    if (!spreadSeries.length) {
      showEmpty('chart-spread', 'Spread = ASP XK VHC (USD/kg × USD_VND) − Giá cá tra NL (VNĐ/kg)');
      return;
    }
    createStockChart('chart-spread', {
      series: [
        { name: 'Spread VHC (VNĐ/kg)', data: spreadSeries.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card, renderSpread);
  renderSpread('1Y');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE);
}
function renderBlockF(blockF) {
  const container = document.getElementById('block-f-charts');
  Object.keys(blockF || {}).forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);
    renderBctcChart(`chart-bctc-${ticker}`, ticker, blockF);
  });
}