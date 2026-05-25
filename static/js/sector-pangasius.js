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
  const seriesNguyenLieu = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 3));
  const seriesGiong      = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 2));
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
  const seriesCorn     = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 108));
  const seriesSoybean  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 87));
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
  const seriesFood = parseFindicatorSeries(blockA.retail_food_us);
  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-us-retail', {
      series: [
        { name: 'Thực phẩm & Đồ uống Mỹ (Tr USD)', data: seriesFood.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
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
    const markets = [...new Set(mktData.map(r => r.name || r.market))];
    createStockChart('chart-export-markets', {
      series: markets.map((m, i) => ({
        name: m,
        color: HC_COLORS[i],
        data: parseFindicatorSeries(mktData.filter(r => (r.name || r.market) === m)).filter(p => p[0] >= cutoff),
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
  const yoyData = parseFindicatorSeries(blockB.export_yoy);
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
    .map(([ticker, rows], i) => ({
      name: ticker,
      color: HC_COLORS[i],
      data: parseFindicatorSeries(Array.isArray(rows) ? rows.filter(r => r.type === 'turnover' || r.seriesType === 'turnover') : []),
    }))
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
    const markets = [...new Set(priceData.map(r => r.name || r.market || ''))].filter(Boolean);

    function renderAsp(year) {
      const cutoff = yearToCutoff(year);
      if (!priceData.length) { showEmpty(`chart-asp-${ticker}`); return; }
      createStockChart(`chart-asp-${ticker}`, {
        series: markets.map((m, i) => ({
          name: m,
          color: HC_COLORS[i],
          data: parseFindicatorSeries(priceData.filter(r => (r.name || r.market) === m)).filter(p => p[0] >= cutoff),
        })),
      });
    }
    initYearButtons(card, renderAsp);
    renderAsp('1Y');
  });
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Cá tra</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  showEmpty('chart-spread', 'Spread = ASP XK (USD/kg × USD_VND) − Giá cá tra NL (VNĐ/kg)');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const rows = tickers.map(t => {
    const trRaw = blockE[t]?.trailing;
    const tickerData = trRaw?.[t] || (Array.isArray(trRaw) ? trRaw : []);
    const get = (id) => tickerData.find?.(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = Array.isArray(analyst) ? analyst[0] : analyst;
    return {
      ticker: t,
      marketCap: get(35), pe: get(39), pb: get(40),
      grossMargin: get(2), roe: get(8), dtGrowth: get(163), peFwd: get(154),
      recommendation: rec?.recommend, upside: rec?.upside, targetPrice: rec?.targetPrice,
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
          <th>Ticker</th><th>Vốn hóa (tỷ)</th><th>PE</th><th>PB</th>
          <th>Biên gộp</th><th>ROE</th><th>DT YoY</th>
          <th>Recommend</th><th>Upside</th><th>Target</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.ticker}</td>
            <td>${num(r.marketCap, 0)}</td>
            <td>${num(r.pe)}</td>
            <td>${num(r.pb)}</td>
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
  const tickers = Object.keys(blockF || {});

  tickers.forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);

    const tickerData = blockF[ticker];
    const rows = tickerData?.[ticker] || (Array.isArray(tickerData) ? tickerData : []);
    if (!rows?.length) { showEmpty(`chart-bctc-${ticker}`); return; }

    const quarters = [...new Set(rows.map(r => r.period || `${r.year}Q${r.quarter}`))].sort().slice(-8);
    const getQ = (accId) => quarters.map(q => {
      const r = rows.find(x => (x.period || `${x.year}Q${x.quarter}`) === q && x.accountId === accId);
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
