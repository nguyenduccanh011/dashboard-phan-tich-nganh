// static/js/sector-rice.js
// Render trang ngành Lúa gạo — 6 khối A–F
// Khối A dùng WiChart (parseWiChartSeries) cho giá lúa VN

(async function SectorRice() {
  let data;
  try {
    const res = await fetch('/api/sector/rice/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Lúa gạo — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Lúa gạo';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Lúa gạo — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Giá lúa gạo VN (WiChart — PRIMARY)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá lúa gạo VN (Nghìn VNĐ/kg)</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="stale-badge" style="display:none"></span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container" id="chart-rice-price"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const wichart = blockA?.wichart_lua;
  const luaData = parseWiChartSeries(wichart?.data || [], yearToCutoff('MAX'));

  if (wichart?.stale) {
    setStaleBadge(card1, 'warn', wichart.stale_reason || 'WiChart stale');
  }

  function renderLua(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-rice-price', {
      series: [{ name: 'Giá lúa VN', data: luaData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card1, renderLua);
  renderLua('1Y');

  // Chart 2: Phân bón Urea (chi phí trồng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Phân bón Urea (VNĐ/50kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-urea"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const macro35 = blockA?.macro_35 || [];
  const urea12 = parseFindicatorSeries(macro35.filter(r => r.nameId === 12));
  const urea13 = parseFindicatorSeries(macro35.filter(r => r.nameId === 13));

  function renderUrea(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-urea', {
      series: [
        { name: 'Urea Phú Mỹ', data: urea12.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Urea Cà Mau', data: urea13.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card2, renderUrea);
  renderUrea('1Y');

  // Chart 3: USD/VND + Brent
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">USD/VND & Brent (logistics)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-rice-usd-brent"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);
  const brent  = parseFindicatorSeries(macro35.filter(r => r.nameId === 65));

  function renderUsdBrent(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-rice-usd-brent', {
      yAxis: [
        { title: { text: 'USD/VND' } },
        { title: { text: 'USD/Bbl' }, opposite: true },
      ],
      series: [
        { name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Brent', data: brent.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card3, renderUsdBrent);
  renderUsdBrent('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: XK gạo VN monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK gạo VN (Tr USD & Nghìn Tấn)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-rice-export"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const xk = blockB?.export_rice || [];
  const xkVal = parseFindicatorSeries(xk.filter(r => !r.valueType || r.valueType === 'value'));
  const xkVol = parseFindicatorSeries(xk.filter(r => r.valueType === 'volume'));

  function renderExport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-rice-export', {
      yAxis: [
        { title: { text: 'Tr USD' } },
        { title: { text: 'Nghìn Tấn' }, opposite: true },
      ],
      series: [
        { name: 'Kim ngạch XK (Tr USD)', data: xkVal.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Sản lượng XK (kT)', data: xkVol.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card, renderExport);
  renderExport('1Y');

  // Chart: XK gạo YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK gạo VN YoY (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-rice-export-yoy"></div>
    </div>
  `);

  const cardYoy = container.lastElementChild;
  const xkYoy = parseFindicatorSeries(xk.filter(r => r.valueType === 'yoy'));

  function renderYoy(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-rice-export-yoy', {
      series: [{ name: 'XK gạo YoY', data: xkYoy.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(cardYoy, renderYoy);
  renderYoy('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">ASP xuất khẩu — xem Khối D</span></div>
      <div class="chart-container chart-sm" id="chart-rice-c"></div>
    </div>
  `);
  showEmpty('chart-rice-c', 'Verify 04/2026: 513.9 Tr USD / 1107 kT = 464 USD/T');
}


function renderBlockD(blockA, blockB) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread ASP XK − Giá lúa nguyên liệu VN</span></div>
      <div class="chart-container" id="chart-rice-spread"></div>
    </div>
  `);
  showEmpty('chart-rice-spread', 'Spread = ASP XK (Tr USD / Nghìn tấn × tỷ giá) − Giá lúa VN (nghìn đ/kg)');
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
      inventory: get(11),
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
          <th>Biên gộp</th><th>ROE</th><th>ROA</th><th>V.quay HTK</th>
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
            <td>${num(r.inventory)}</td>
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
