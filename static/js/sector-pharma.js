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
  window.renderBlockG(data.block_g, 'pharma', data.tickers);
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
  const cpi16 = parseFindicatorSeries((blockA?.cpi_pharma || []).filter(r => r.nameId === 16));
  const cpi5  = parseFindicatorSeries((blockA?.cpi_pharma || []).filter(r => r.nameId === 5));

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
  const nkDuoc = parseFindicatorSeries((blockA?.nk_pharma || []).filter(r => r.nameId === 63));
  const nkNpl  = parseFindicatorSeries((blockA?.nk_pharma || []).filter(r => r.nameId === 62));

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
  const fdi = parseFindicatorSeries(blockB?.fdi_health);
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
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, roa: 9, current: 27 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'roa', 'current'],
    pctFields: ['grossMargin', 'roe', 'roa'],
  });
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