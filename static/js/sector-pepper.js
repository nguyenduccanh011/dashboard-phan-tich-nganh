// static/js/sector-pepper.js
(async function SectorPepper() {
  let data;
  try {
    const res = await fetch('/api/sector/pepper/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Hồ tiêu — Lỗi tải dữ liệu';
    return;
  }
  document.getElementById('sector-name').textContent = 'Ngành Hồ tiêu';
  document.getElementById('last-updated').textContent = 'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Hồ tiêu — Sector Hub';
  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();

function renderBlockA(blockA) {
  const c = document.getElementById('block-a-charts');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá hồ tiêu VN (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pepper-price"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const tieu = parseWiChartSeries(blockA?.wichart_tieu?.data || []);

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-pepper-price', {
      series: [{ name: 'Hồ tiêu VN (VNĐ/kg)', data: tieu.filter(p => p[0] >= cut), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card, render);
  render('1Y');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND & Brent</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pepper-fx"></div>
    </div>
  `);
  const card2 = c.lastElementChild;
  const usd   = parseFindicatorSeries(blockA?.usd_vnd);
  const brent = parseFindicatorSeries((blockA?.macro_35 || []).filter(r => r.nameId === 65));

  function renderFx(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-pepper-fx', {
      yAxis: [{ title: { text: 'USD/VND' } }, { title: { text: 'USD/Bbl' }, opposite: true }],
      series: [
        { name: 'USD/VND', data: usd.filter(p => p[0] >= cut), color: HC_COLORS[4] },
        { name: 'Brent', data: brent.filter(p => p[0] >= cut), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card2, renderFx);
  renderFx('1Y');
}

function renderBlockB(blockB) {
  const c = document.getElementById('block-b-charts');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK hồ tiêu VN (Tr USD & USD/T)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pepper-export"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const exp = blockB?.export_pepper || [];
  const val = parseFindicatorSeries(exp.filter(r => !r.valueType || r.valueType === 'value'));
  const yoy = parseFindicatorSeries(exp.filter(r => r.valueType === 'yoy'));

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-pepper-export', {
      yAxis: [{ title: { text: 'Tr USD' } }, { title: { text: 'YoY %' }, opposite: true }],
      series: [
        { name: 'XK tiêu (Tr USD)', type: 'column', data: val.filter(p => p[0] >= cut), color: HC_COLORS[0] },
        { name: 'YoY %', type: 'line', data: yoy.filter(p => p[0] >= cut), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card, render);
  render('3Y');
}

function renderBlockC(blockC) {
  const c = document.getElementById('block-c-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">ASP xuất khẩu</span></div>
      <div class="chart-container" id="chart-pepper-asp"></div>
    </div>
  `);
  showEmpty('chart-pepper-asp', 'ASP = DT XK / Sản lượng XK (USD/T) — verify 04/2026: 6,265 USD/T');
}

function renderBlockD(blockA, blockB) {
  const c = document.getElementById('block-d-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread ASP XK − Giá tiêu VN</span></div>
      <div class="chart-container" id="chart-pepper-spread"></div>
    </div>
  `);
  showEmpty('chart-pepper-spread', 'Spread = ASP XK (USD/T × tỷ giá) − Giá tiêu VN (VNĐ/kg)');
}

function renderBlockE(blockE) {
  const c = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { c.innerHTML = '<p>Không có dữ liệu</p>'; return; }
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v * 100).toFixed(1)}%</span>` : '—';
  const num = (v, dp = 1) => v != null ? Highcharts.numberFormat(v, dp) : '—';
  const rows = tickers.map(t => {
    const arr = Array.isArray(blockE[t]?.trailing) ? blockE[t].trailing : [];
    const get = id => arr.find(r => r.accountId === id)?.value;
    return { ticker: t, marketCap: get(35), pe: get(39), pb: get(40), margin: get(2), roe: get(8) };
  });
  c.innerHTML = `<table class="stock-table"><thead><tr><th>Ticker</th><th>Vốn hóa</th><th>PE</th><th>PB</th><th>Biên gộp</th><th>ROE</th></tr></thead><tbody>${
    rows.map(r => `<tr><td>${r.ticker}</td><td>${num(r.marketCap,0)}</td><td>${num(r.pe)}</td><td>${num(r.pb)}</td><td>${pct(r.margin)}</td><td>${pct(r.roe)}</td></tr>`).join('')
  }</tbody></table>`;
}

function renderBlockF(blockF) {
  const c = document.getElementById('block-f-charts');
  Object.keys(blockF || {}).forEach(ticker => {
    c.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);
    const rows = Array.isArray(blockF[ticker]) ? blockF[ticker] : [];
    if (!rows.length) { showEmpty(`chart-bctc-${ticker}`); return; }
    const quarters = [...new Set(rows.map(r => r.period || `${r.year}Q${r.quarter}`))].sort().slice(-8);
    const getQ = id => quarters.map(q => rows.find(x => (x.period || `${x.year}Q${x.quarter}`) === q && x.accountId === id)?.value ?? null);
    createChart(`chart-bctc-${ticker}`, {
      chart: { type: 'column' }, xAxis: { categories: quarters },
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }, { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } }],
      series: [
        { name: 'Doanh thu', type: 'column', data: getQ(24), color: HC_COLORS[0] },
        { name: 'LN gộp', type: 'column', data: getQ(28), color: HC_COLORS[2] },
        { name: 'LNST', type: 'column', data: getQ(43), color: HC_COLORS[3] },
        { name: 'Biên gộp %', type: 'line', data: getQ(2), color: HC_COLORS[1], yAxis: 1, tooltip: { valueSuffix: '%' } },
      ],
    });
  });
}
