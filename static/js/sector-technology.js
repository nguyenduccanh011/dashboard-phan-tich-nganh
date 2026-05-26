// static/js/sector-technology.js
// Render trang ngành Công nghệ & Điện tử — 6 khối A–F

(async function SectorTechnology() {
  let data;
  try {
    const res = await fetch('/api/sector/technology/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Công nghệ — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Công nghệ & Điện tử';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Công nghệ — Sector Hub';

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

  // Chart 1: USD/VND (revenue ngoại tệ FPT offshore)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">USD/VND (Driver FPT offshore revenue)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-tech-usd"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-tech-usd', {
      series: [{ name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card1, renderUsd);
  renderUsd('1Y');

  // Chart 2: FED rate + Lãi suất huy động VN
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">FED rate & Lãi suất huy động VN (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-tech-rates"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const fed     = parseFindicatorSeries(blockA?.fed_rate);
  const deposit = parseFindicatorSeries(blockA?.deposit_rate);

  function renderRates(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-tech-rates', {
      series: [
        { name: 'FED rate', data: fed.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
        { name: 'Lãi HĐ VN', data: deposit.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
      ],
    });
  }
  initYearButtons(card2, renderRates);
  renderRates('1Y');

  // Chart 3: CPI Mỹ (proxy purchasing power US clients)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">CPI Mỹ YoY (Proxy IT spend US)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-tech-cpi-us"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const cpiUs = parseFindicatorSeries(blockA?.cpi_us);

  function renderCpiUs(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-tech-cpi-us', {
      series: [{ name: 'CPI Mỹ YoY', data: cpiUs.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card3, renderCpiUs);
  renderCpiUs('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: XK điện tử VN (Samsung/Intel FDI — macro signal)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK Điện tử VN (~40% tổng XK) — Chủ yếu FDI</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-tech-export"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const xkMt  = parseFindicatorSeries(blockB?.xk_computer || []);
  const xkDt  = parseFindicatorSeries(blockB?.xk_phone || []);

  function renderExport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-tech-export', {
      series: [
        { name: 'XK Máy tính & LK (Tr USD)', data: xkMt.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'XK Điện thoại & LK (Tr USD)', data: xkDt.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card1, renderExport);
  renderExport('1Y');

  // Chart: PMI TQ (supply chain risk) + Bán lẻ Mỹ (proxy IT demand)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI SX TQ & Bán lẻ Mỹ (Demand/Risk signals)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-tech-pmi-retail"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const pmiCn     = parseFindicatorSeries(blockB?.pmi_china);
  const retailUs  = parseFindicatorSeries(blockB?.us_retail);

  function renderPmiRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-tech-pmi-retail', {
      yAxis: [
        { title: { text: 'PMI (pts)' }, plotLines: [
          { value: 50, color: 'gray', dashStyle: 'dash', width: 1, label: { text: '50' } }
        ]},
        { title: { text: 'Bán lẻ Mỹ' }, opposite: true },
      ],
      series: [
        { name: 'PMI SX TQ', data: pmiCn.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
        { name: 'Bán lẻ Mỹ', data: retailUs.filter(p => p[0] >= cutoff), color: HC_COLORS[0], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card2, renderPmiRetail);
  renderPmiRetail('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Revenue per-DN — xem BCTC Khối F</span></div>
      <div class="chart-container chart-sm" id="chart-tech-c"></div>
    </div>
  `);
  showEmpty('chart-tech-c', 'Không có per-DN ASP từ Findicator. DT BCTC ở Khối F là proxy revenue growth');
}


function renderBlockD(blockA, blockB) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">USD/VND vs DT FPT offshore</span></div>
      <div class="chart-container" id="chart-tech-spread"></div>
    </div>
  `);
  showEmpty('chart-tech-spread', 'Driver chính FPT: tỷ giá USD/VND × DT nước ngoài. FED rate → IT budget khách US');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, roa: 9, leverage: 22, evEbitda: 47 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'roa', 'leverage', 'evEbitda'],
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