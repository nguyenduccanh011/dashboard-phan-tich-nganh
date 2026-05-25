// static/js/sector-oilgas.js
// Render trang ngành Dầu khí — 6 khối A–F

(async function SectorOilgas() {
  let data;
  try {
    const res = await fetch('/api/sector/oilgas/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Dầu khí — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Dầu khí';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Dầu khí — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart: Giá dầu Brent + WTI
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá dầu thô (USD/Bbl)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oil-price"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const macro35 = blockA?.macro_35 || [];
  const brent = parseFindicatorSeries(macro35.filter(r => r.nameId === 65));
  const wti   = parseFindicatorSeries(macro35.filter(r => r.nameId === 67));

  function renderOil(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oil-price', {
      series: [
        { name: 'Brent (USD/Bbl)', data: brent.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'WTI (USD/Bbl)',   data: wti.filter(p => p[0] >= cutoff),   color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(card1, renderOil);
  renderOil('1Y');

  // Chart: Giá khí Henry Hub
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Khí TN Henry Hub (USD/MMBtu)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gas-price"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const hh = parseFindicatorSeries(macro35.filter(r => r.nameId === 66));

  function renderGas(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gas-price', {
      series: [{ name: 'Henry Hub', data: hh.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card2, renderGas);
  renderGas('1Y');

  // Chart: USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oilgas-usd"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oilgas-usd', {
      series: [{ name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card3, renderUsd);
  renderUsd('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');
  const macro35 = blockB?.macro_35 || [];

  // Chart: Gas tanker rates (VLGC, LGC, MGC, HDY)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Gas Tanker Rates (USD/tháng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-lg" id="chart-gas-tanker"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const tankerMap = [
    { nameId: 312, name: 'VLGC' },
    { nameId: 313, name: 'LGC' },
    { nameId: 314, name: 'MGC' },
    { nameId: 315, name: 'HDY SR' },
    { nameId: 316, name: 'ETH' },
    { nameId: 317, name: 'SR' },
    { nameId: 318, name: 'COASTER Asia' },
    { nameId: 319, name: 'COASTER Europe' },
  ];

  const tankerSeries = tankerMap.map((t, i) => ({
    name: t.name,
    color: HC_COLORS[i % HC_COLORS.length],
    data: parseFindicatorSeries(macro35.filter(r => r.nameId === t.nameId)),
  }));

  function renderTanker(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gas-tanker', {
      series: tankerSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card1, renderTanker);
  renderTanker('1Y');

  // Chart: Tàu dầu MR + VLCC
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Oil Tanker Rates + BDTI/BCTI</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oil-tanker"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const oilTankerMap = [
    { nameId: 322, name: 'MR tanker', color: HC_COLORS[0] },
    { nameId: 341, name: 'VLCC', color: HC_COLORS[1] },
    { nameId: 679, name: 'BDTI', color: HC_COLORS[2] },
    { nameId: 680, name: 'BCTI', color: HC_COLORS[3] },
  ];

  const oilTankerSeries = oilTankerMap.map(t => ({
    name: t.name, color: t.color,
    data: parseFindicatorSeries(macro35.filter(r => r.nameId === t.nameId)),
  }));

  function renderOilTanker(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oil-tanker', {
      series: oilTankerSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card2, renderOilTanker);
  renderOilTanker('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  const macro35 = blockC?.macro_35 || [];

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá xăng dầu nội địa VN (VNĐ/Lít)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fuel-price"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const fuelMap = [
    { nameId: 612, name: 'RON95 vùng 1', color: HC_COLORS[0] },
    { nameId: 613, name: 'RON92 vùng 1', color: HC_COLORS[1] },
    { nameId: 614, name: 'RON95 vùng 2', color: HC_COLORS[2] },
    { nameId: 618, name: 'Dầu DO vùng 1', color: HC_COLORS[3] },
    { nameId: 622, name: 'Dầu hoả vùng 1', color: HC_COLORS[4] },
  ];

  const fuelSeries = fuelMap.map(f => ({
    name: f.name, color: f.color,
    data: parseFindicatorSeries(macro35.filter(r => r.nameId === f.nameId)),
  }));

  function renderFuel(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-fuel-price', {
      series: fuelSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card, renderFuel);
  renderFuel('1Y');
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Downstream (PLX)</span></div>
      <div class="chart-container" id="chart-oilgas-spread"></div>
    </div>
  `);
  showEmpty('chart-oilgas-spread', 'Spread = RON95 VNĐ/lít − Brent × USD_VND / 159 (lít/thùng)');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
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
      grossMargin: get(2), roe: get(8), roa: get(9),
      recommendation: rec?.recommend, upside: rec?.upside, targetPrice: rec?.targetPrice,
    };
  });

  const recTag = (r) => {
    if (!r) return '—';
    const map = { BUY: 'tag-buy', HOLD: 'tag-hold', SELL: 'tag-sell' };
    return `<span class="${map[r] || ''}">${r}</span>`;
  };
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v * 100).toFixed(1)}%</span>` : '—';
  const num = (v, dp = 1) => v != null ? Highcharts.numberFormat(v, dp) : '—';

  container.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th>Ticker</th><th>Vốn hóa (tỷ)</th><th>PE</th><th>PB</th>
          <th>Biên gộp</th><th>ROE</th><th>ROA</th>
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
            <td>${pct(r.roa)}</td>
            <td>${recTag(r.recommendation)}</td>
            <td>${r.upside != null ? pct(r.upside / 100) : '—'}</td>
            <td>${r.targetPrice ? num(r.targetPrice, 0) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
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
