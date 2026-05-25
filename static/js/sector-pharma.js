// static/js/sector-pharma.js
// Render trang ngành Dược phẩm & Y tế — 6 khối A–F

(async function SectorPharma() {
  let data;
  try {
    const res = await fetch('/api/sector/pharma/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Dược phẩm — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Dược phẩm & Y tế';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Dược phẩm — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: CPI Thuốc + DV Y tế YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">CPI Thuốc & DV Y tế (YoY %)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pharma-cpi"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const cpi16 = parseFindicatorSeries(blockA?.cpi_medicine);
  const cpi5  = parseFindicatorSeries(blockA?.cpi_medical_service);

  function renderCpi(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-pharma-cpi', {
      series: [
        { name: 'CPI Thuốc (+13.58%)', data: cpi16.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'CPI DV Y tế (+17.65%)', data: cpi5.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card1, renderCpi);
  renderCpi('1Y');

  // Chart 2: NK dược phẩm + NPL dược
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">NK Dược phẩm & NPL (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pharma-import"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const nkDuoc = parseFindicatorSeries(blockA?.import_pharma);
  const nkNpl  = parseFindicatorSeries(blockA?.import_pharma_material);

  function renderImport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-pharma-import', {
      series: [
        { name: 'NK dược phẩm', data: nkDuoc.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'NK NPL dược', data: nkNpl.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(card2, renderImport);
  renderImport('1Y');

  // Chart 3: USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pharma-usd"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-pharma-usd', {
      series: [{ name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card3, renderUsd);
  renderUsd('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: FDI Y tế + IIP dược
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">FDI Y tế/Dược (Tr USD) & IIP Dược (YoY %)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pharma-fdi-iip"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const fdi = parseFindicatorSeries(blockB?.fdi_pharma);
  const iip = parseFindicatorSeries(blockB?.iip_pharma);

  function renderFdiIip(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-pharma-fdi-iip', {
      yAxis: [
        { title: { text: 'Tr USD' } },
        { title: { text: 'YoY %' }, opposite: true },
      ],
      series: [
        { name: 'FDI Y tế (Tr USD)', data: fdi.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'IIP dược YoY (-10.2%)', data: iip.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card, renderFdiIip);
  renderFdiIip('1Y');

  // Chart: Bán lẻ VN (proxy tiêu dùng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ hàng hoá VN (Proxy tiêu dùng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pharma-retail"></div>
    </div>
  `);

  const cardR = container.lastElementChild;
  const retail = parseFindicatorSeries(blockB?.retail);

  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-pharma-retail', {
      series: [{ name: 'Bán lẻ HH VN', data: retail.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(cardR, renderRetail);
  renderRetail('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">ASP — xem BCTC Khối F</span></div>
      <div class="chart-container chart-sm" id="chart-pharma-c"></div>
    </div>
  `);
  showEmpty('chart-pharma-c', 'Không có per-DN ASP từ Findicator — xem DT BCTC ở Khối F');
}


function renderBlockD(blockA) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">CPI Thuốc vs Biên gộp BCTC</span></div>
      <div class="chart-container" id="chart-pharma-spread"></div>
    </div>
  `);
  showEmpty('chart-pharma-spread', 'CPI thuốc +13.58% YoY → pricing power. So sánh với biên gộp BCTC từ Khối F');
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
      grossMargin: get(2), roe: get(8), roa: get(9), current: get(27),
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
          <th>Biên gộp</th><th>ROE</th><th>ROA</th><th>Thanh toán HH</th>
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
            <td>${num(r.current)}</td>
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
