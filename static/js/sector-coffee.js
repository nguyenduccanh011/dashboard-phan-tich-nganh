// static/js/sector-coffee.js
// Render trang ngành Cà phê — 6 khối A–F

(async function SectorCoffee() {
  let data;
  try {
    const res = await fetch('/api/sector/coffee/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Cà phê — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Cà phê';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Cà phê — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = blockA?.macro_35 || [];

  // Chart 1: Cà phê Arabica ICE
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Cà phê Arabica ICE (USd/Lbs)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-arabica"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const arabica = parseFindicatorSeries(macro35.filter(r => r.nameId === 95));

  function renderArabica(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-arabica', {
      series: [{ name: 'Arabica ICE', data: arabica.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
    });
  }
  initYearButtons(card1, renderArabica);
  renderArabica('1Y');

  // Chart 2: Cà phê Robusta VN (VNĐ/kg)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Cà phê hạt VN Robusta (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-robusta"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const robusta = parseFindicatorSeries(macro35.filter(r => r.nameId === 687));

  function renderRobusta(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-robusta', {
      series: [{ name: 'Robusta VN (VNĐ/kg)', data: robusta.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card2, renderRobusta);
  renderRobusta('1Y');

  // Chart 3: USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-coffee-usd"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-coffee-usd', {
      series: [{ name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card3, renderUsd);
  renderUsd('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: XK cà phê VN monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK cà phê VN (Tr USD & Nghìn Tấn)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-coffee-export"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const xk = blockB?.export_coffee || [];
  const xkValue  = parseFindicatorSeries(xk.filter(r => r.valueType === 'value'  || (!r.valueType && r.unit !== 'kT')));
  const xkVolume = parseFindicatorSeries(xk.filter(r => r.valueType === 'volume' || r.unit === 'kT'));

  function renderExport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-coffee-export', {
      yAxis: [
        { title: { text: 'Tr USD' } },
        { title: { text: 'Nghìn Tấn' }, opposite: true },
      ],
      series: [
        { name: 'Kim ngạch XK (Tr USD)', data: xkValue.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Sản lượng XK (kT)', data: xkVolume.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card, renderExport);
  renderExport('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">ASP xuất khẩu — xem Khối D</span></div>
      <div class="chart-container chart-sm" id="chart-coffee-c"></div>
    </div>
  `);
  showEmpty('chart-coffee-c', 'ASP = Kim ngạch XK / Sản lượng XK — tính trong Khối D');
}


function renderBlockD(blockA, blockB) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread XK vs Giá nguyên liệu hạt VN</span></div>
      <div class="chart-container" id="chart-coffee-spread"></div>
    </div>
  `);
  showEmpty('chart-coffee-spread', 'Spread = Giá XK bình quân (Tr USD / Nghìn tấn) − Giá hạt VN (VNĐ/kg × USD_VND)');
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
      grossMargin: get(2), roe: get(8),
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
          <th>Biên gộp</th><th>ROE</th>
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
