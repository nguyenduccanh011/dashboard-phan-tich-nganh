// static/js/sector-logistics.js
(async function SectorLogistics() {
  let data;
  try {
    const res = await fetch('/api/sector/logistics/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Logistics — Lỗi tải dữ liệu';
    return;
  }
  document.getElementById('sector-name').textContent = 'Logistics & Cảng biển';
  document.getElementById('last-updated').textContent = 'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Logistics — Sector Hub';
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
        <span class="chart-title">Freight Index (BDI & WCI)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-freight-idx"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const raw = blockA?.macro_35 || [];
  const bdi = parseFindicatorSeries(raw.filter(r => r.nameId === 681));
  const wci = parseFindicatorSeries(raw.filter(r => r.nameId === 688));

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-freight-idx', {
      yAxis: [
        { title: { text: 'BDI (pts)' } },
        { title: { text: 'WCI (USD/FEU)' }, opposite: true },
      ],
      series: [
        { name: 'BDI', data: bdi.filter(p => p[0] >= cut), color: HC_COLORS[0] },
        { name: 'WCI Container', data: wci.filter(p => p[0] >= cut), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card, render);
  render('1Y');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Dầu Brent (chi phí nhiên liệu)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-logistics-brent"></div>
    </div>
  `);
  const card2 = c.lastElementChild;
  const brent = parseFindicatorSeries(raw.filter(r => r.nameId === 65));
  function renderBrent(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-logistics-brent', {
      series: [{ name: 'Brent (USD/Bbl)', data: brent.filter(p => p[0] >= cut), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card2, renderBrent);
  renderBrent('1Y');
}

function renderBlockB(blockB) {
  const c = document.getElementById('block-b-charts');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XNK VN tổng (proxy throughput cảng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-vn-trade"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const exp = parseFindicatorSeries(blockB?.export_vn);
  const imp = parseFindicatorSeries(blockB?.import_vn);

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-vn-trade', {
      series: [
        { name: 'XK VN (Tr USD)', data: exp.filter(p => p[0] >= cut), color: HC_COLORS[0] },
        { name: 'NK VN (Tr USD)', data: imp.filter(p => p[0] >= cut), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card, render);
  render('3Y');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI VN & FDI Logistics (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-logistics-pmi-fdi"></div>
    </div>
  `);
  const card2 = c.lastElementChild;
  const pmi = parseFindicatorSeries(blockB?.pmi_vn);
  const fdi = parseFindicatorSeries(blockB?.fdi_logistics);

  function render2(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-logistics-pmi-fdi', {
      yAxis: [
        { title: { text: 'PMI (pts)' }, plotLines: [{ value: 50, color: HC_COLORS[1], width: 1, dashStyle: 'ShortDash' }] },
        { title: { text: 'FDI (Tr USD)' }, opposite: true },
      ],
      series: [
        { name: 'PMI SX VN', data: pmi.filter(p => p[0] >= cut), color: HC_COLORS[2] },
        { name: 'FDI Logistics', data: fdi.filter(p => p[0] >= cut), color: HC_COLORS[3], yAxis: 1, type: 'column' },
      ],
    });
  }
  initYearButtons(card2, render2);
  render2('3Y');
}

function renderBlockC(blockC) {
  const c = document.getElementById('block-c-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Doanh thu per-DN</span></div>
      <div class="chart-container" id="chart-logistics-rev"></div>
    </div>
  `);
  showEmpty('chart-logistics-rev', 'DT thực tế — xem BCTC Khối F');
}

function renderBlockD(blockA, blockB) {
  const c = document.getElementById('block-d-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">BDI/WCI vs DT ngành</span></div>
      <div class="chart-container" id="chart-logistics-spread"></div>
    </div>
  `);
  showEmpty('chart-logistics-spread', 'So sánh Freight Index với DT từ BCTC per-DN');
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
    const rec = Array.isArray(blockE[t]?.analyst) ? blockE[t].analyst[0] : blockE[t]?.analyst;
    return { ticker: t, marketCap: get(35), pe: get(39), pb: get(40), margin: get(2), roe: get(8), roa: get(9), debt: get(22), rec: rec?.recommend, upside: rec?.upside };
  });
  c.innerHTML = `<table class="stock-table"><thead><tr><th>Ticker</th><th>Vốn hóa</th><th>PE</th><th>PB</th><th>Biên gộp</th><th>ROE</th><th>ROA</th><th>Nợ/VCS</th><th>Rec</th><th>Upside</th></tr></thead><tbody>${
    rows.map(r => `<tr><td>${r.ticker}</td><td>${num(r.marketCap,0)}</td><td>${num(r.pe)}</td><td>${num(r.pb)}</td><td>${pct(r.margin)}</td><td>${pct(r.roe)}</td><td>${pct(r.roa)}</td><td>${num(r.debt)}</td><td>${r.rec||'—'}</td><td>${r.upside!=null?pct(r.upside/100):'—'}</td></tr>`).join('')
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
