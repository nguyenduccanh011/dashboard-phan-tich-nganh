// static/js/sector-wood.js
// Render trang ngành Gỗ & Nội thất XK — 6 khối A–F

(async function SectorWood() {
  let data;
  try {
    const res = await fetch('/api/sector/wood/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Gỗ & Nội thất — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Gỗ & Nội thất XK';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Gỗ & Nội thất — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: USD/VND — driver chính (>90% DT XK)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND (Driver chính)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-wood-usd"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-wood-usd', {
      series: [{ name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card1, renderUsd);
  renderUsd('1Y');

  // Chart 2: Giá gỗ CME (timber USD/MBF)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá gỗ CME Timber (USD/MBF)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-timber-cme"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const timber = parseFindicatorSeries(blockA?.timber_price || []);

  function renderTimber(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-timber-cme', {
      series: [{ name: 'CME Timber', data: timber.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(card2, renderTimber);
  renderTimber('1Y');

  // Chart 3: IIP chế biến gỗ VN YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">IIP Chế biến gỗ VN (YoY %)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-wood-iip"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const iip = parseFindicatorSeries(blockA?.iip_wood);

  function renderIip(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-wood-iip', {
      series: [{ name: 'IIP chế biến gỗ YoY', data: iip.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card3, renderIip);
  renderIip('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: XK gỗ VN monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK gỗ VN (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-wood-export"></div>
    </div>
  `);

  const cardXk = container.lastElementChild;
  const xk = parseFindicatorSeries(blockB?.xk_wood);

  function renderXk(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-wood-export', {
      series: [{ name: 'XK gỗ (Tr USD)', data: xk.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardXk, renderXk);
  renderXk('1Y');

  // Chart: NK gỗ nguyên liệu VN
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">NK gỗ nguyên liệu VN (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-wood-import"></div>
    </div>
  `);

  const cardNk = container.lastElementChild;
  const nk = parseFindicatorSeries(blockB?.nk_wood);

  function renderNk(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-wood-import', {
      series: [{ name: 'NK gỗ (Tr USD)', data: nk.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(cardNk, renderNk);
  renderNk('1Y');

  // Chart: FDI vào ngành gỗ
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">FDI Chế biến gỗ (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-wood-fdi"></div>
    </div>
  `);

  const cardFdi = container.lastElementChild;
  const fdi = parseFindicatorSeries(blockB?.fdi_wood);

  function renderFdi(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-wood-fdi', {
      series: [{ name: 'FDI gỗ (Tr USD)', data: fdi.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
    });
  }
  initYearButtons(cardFdi, renderFdi);
  renderFdi('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">ASP xuất khẩu — xem BCTC Khối F</span></div>
      <div class="chart-container chart-sm" id="chart-wood-c"></div>
    </div>
  `);
  showEmpty('chart-wood-c', 'Không có per-DN ASP — xem DT BCTC (accountId=24) ở Khối F');
}


function renderBlockD(blockA, blockB) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">XK gỗ YoY & IIP gỗ</span></div>
      <div class="chart-container" id="chart-wood-spread"></div>
    </div>
  `);
  showEmpty('chart-wood-spread', 'XK gỗ YoY vs IIP chế biến gỗ — driver: USD/VND + cầu Mỹ/EU');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, leverage: 22 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'leverage'],
    pctFields: ['grossMargin', 'roe'],
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