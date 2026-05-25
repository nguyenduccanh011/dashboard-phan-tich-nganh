// static/js/sector-shrimp.js
// Render trang ngành Tôm — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorShrimp() {
  let data;
  try {
    const res = await fetch('/api/sector/shrimp/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Tôm — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Tôm';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Tôm — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Giá tôm nguyên liệu VN (nameId=23,22,21) — VNĐ/kg
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá tôm nguyên liệu VN (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-shrimp-price"></div>
    </div>
  `);
  const cardShrimp = container.lastElementChild;
  const seriesThe50 = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 23));
  const seriesThe30 = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 22));
  const seriesSu    = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 21));
  function renderShrimpPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-shrimp-price', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: [
        { name: 'Tôm thẻ 50 con/kg', data: seriesThe50.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Tôm thẻ 30 con/kg', data: seriesThe30.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Tôm sú', data: seriesSu.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(cardShrimp, renderShrimpPrice);
  renderShrimpPrice('1Y');

  // Chart 2: Thức ăn — Ngô CBOT (108) + Đậu nành (87)
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
  const seriesCorn    = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 108));
  const seriesSoybean = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 87));
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
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Giá XK tôm thế giới (tôm thẻ nameId=28)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá XK tôm thế giới (USD/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-global-price"></div>
    </div>
  `);
  const cardGlobal = container.lastElementChild;
  const globalPriceData = parseFindicatorSeries(blockB.global_export_price);
  function renderGlobalPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-global-price', {
      series: [{ name: 'Giá XK tôm thẻ (USD/kg)', data: globalPriceData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardGlobal, renderGlobalPrice);
  renderGlobalPrice('1Y');

  // Chart 2: Tổng quan thị trường (Ecuador/Asia/VN volume) — dữ liệu tĩnh
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Tổng quan sản lượng tôm toàn cầu</span>
      </div>
      <div class="chart-container chart-sm" id="chart-overview"></div>
    </div>
  `);
  const overview = blockB.overview;
  if (overview && Array.isArray(overview) && overview.length) {
    const cats = overview.map(r => r.name || r.country || '');
    const vals = overview.map(r => r.value || r.volume || 0);
    createChart('chart-overview', {
      chart: { type: 'bar' },
      xAxis: { categories: cats },
      series: [{ name: 'Sản lượng (Nghìn tấn)', data: vals, color: HC_COLORS[1] }],
    });
  } else {
    showEmpty('chart-overview');
  }

  // Chart 3: Bán lẻ thực phẩm Mỹ (proxy demand tôm)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ thực phẩm Mỹ (Tr USD) — proxy demand</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-us-retail"></div>
    </div>
  `);
  const cardRetail = container.lastElementChild;
  const retailData = parseFindicatorSeries(blockB.retail_food_us);
  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-us-retail', {
      series: [{ name: 'Thực phẩm & Đồ uống Mỹ', data: retailData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardRetail, renderRetail);
  renderRetail('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  const tickers = Object.keys(blockC.export_price_tom_the || {});

  // ASP tôm thẻ per-DN (1 chart per DN)
  tickers.forEach((ticker, tIdx) => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">ASP tôm thẻ ${ticker} (USD/kg)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-asp-the-${ticker}"></div>
      </div>
    `);
    const card = container.lastElementChild;
    const priceData = blockC.export_price_tom_the[ticker] || [];
    const markets = [...new Set(priceData.map(r => r.name || r.market || ''))].filter(Boolean);

    function renderAsp(year) {
      const cutoff = yearToCutoff(year);
      if (!priceData.length) { showEmpty(`chart-asp-the-${ticker}`); return; }
      createStockChart(`chart-asp-the-${ticker}`, {
        series: markets.map((m, i) => ({
          name: m, color: HC_COLORS[i],
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
      <div class="chart-header"><span class="chart-title">Spread Tôm</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  showEmpty('chart-spread', 'Spread = ASP XK (USD/kg × USD_VND) − Giá tôm NL (VNĐ/kg)');
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
