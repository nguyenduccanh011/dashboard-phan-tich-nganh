// static/js/sector-steel.js
// Render trang ngành Thép — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorSteel() {
  let data;
  try {
    const res = await fetch('/api/sector/steel/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Thép — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Thép';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Thép — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Quặng sắt CME + TQ (dual axis)
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

  const card1 = container.lastElementChild;
  const seriesCme = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 82));
  const seriesTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 243));

  function renderIronOre(year) {
    const cutoff = yearToCutoff(year);
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
  initYearButtons(card1, renderIronOre);
  renderIronOre('1Y');

  // Chart 2: Than cốc SGX + TQ (dual axis)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Than cốc</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-coal"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const seriesCoalSgx = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 153));
  const seriesCoalTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 158));

  function renderCoal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-coal', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'CNY/T' }, opposite: true },
      ],
      series: [
        { name: 'SGX (USD/T)', data: seriesCoalSgx.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TQ (CNY/T)', data: seriesCoalTq.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card2, renderCoal);
  renderCoal('1Y');

  // Chart 3: HRC CME + TQ (dual axis)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">HRC (Thép cuộn cán nóng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-hrc"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const seriesHrcCme = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 86));
  const seriesHrcTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 161));

  function renderHrc(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-hrc', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'CNY/T' }, opposite: true },
      ],
      series: [
        { name: 'CME (USD/T)', data: seriesHrcCme.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TQ (CNY/T)', data: seriesHrcTq.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card3, renderHrc);
  renderHrc('1Y');

  // Badge stale cho CNY/VND nếu nguồn dữ liệu stale
  if (blockA.cny_vnd?.stale) {
    const badge = card1.querySelector('.stale-badge');
    setStaleBadge(card1, 'warn', 'CNY/VND đến 31/12/2025');
  }
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
  } else {
    const latest = shareData[shareData.length - 1];
    createChart('chart-market-share', {
      chart: { type: 'pie' },
      series: [{
        name: 'Thị phần',
        data: Object.entries(latest.shares || {}).map(([name, y]) => ({ name, y })),
      }],
    });
  }

  // Chart: Xuất khẩu thép monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Xuất khẩu thép (Nghìn tấn)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-steel-export"></div>
    </div>
  `);

  const cardExport = container.lastElementChild;
  const exportData = blockB.export_status || [];
  const exportSeriesIds = [
    { nameId: 18, name: 'Tổng XK' },
    { nameId: 19, name: 'Thép cuộn' },
    { nameId: 20, name: 'Thép thanh' },
    { nameId: 21, name: 'Ống thép' },
  ];

  function renderExport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-steel-export', {
      series: exportSeriesIds.map((s, i) => ({
        name: s.name,
        color: HC_COLORS[i],
        data: parseFindicatorSeries(exportData.filter(r => r.name_id === s.nameId)).filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(cardExport, renderExport);
  renderExport('1Y');

  // Chart: Tồn kho
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tồn kho thép nội địa</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-inventory"></div>
    </div>
  `);

  const cardInv = container.lastElementChild;
  const invData = blockB.inventory || [];

  function renderInventory(year) {
    const cutoff = yearToCutoff(year);
    const series = invData.map ? invData : [];
    createStockChart('chart-inventory', {
      series: [{
        name: 'Tồn kho',
        color: HC_COLORS[0],
        data: parseFindicatorSeries(series).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(cardInv, renderInventory);
  renderInventory('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá thép nội địa (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-sell-price"></div>
    </div>
  `);

  const card = container.querySelector('.chart-card');
  const prices = blockC.sell_prices || [];

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
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Thép – NVL</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  showEmpty('chart-spread', 'Spread = CB300 − (Quặng×1.6 + Than×0.5) × USD/VND');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE);
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const rows = tickers.map(t => {
    const tr = blockE[t]?.trailing;
    const tickerData = tr?.[t] || (Array.isArray(tr) ? tr : []);
    const get = (id) => tickerData.find?.(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = Array.isArray(analyst) ? analyst[0] : analyst;
    return {
      ticker: t,
      marketCap: get(35), pe: get(39), pb: get(40),
      grossMargin: get(2), roe: get(8),
      dtGrowth: get(163), peFwd: get(154),
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
  const tickers = Object.keys(blockF);

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
