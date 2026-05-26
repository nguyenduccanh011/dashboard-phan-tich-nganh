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
  renderBlockC(data.block_b);
  renderBlockD(data.block_a, data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  window.renderBlockG(data.block_g, 'pepper', data.tickers);
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
  const tieu = parseWiChartSeries(blockA?.pepper_price?.data || []);

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
  const brent = parseFindicatorSeries(blockA?.brent || []);

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
  const exp = blockB?.xk_pepper || [];
  const val = parseFindicatorSeries(exp);
  const yoy = parseFindicatorSeries(blockB?.xk_pepper_yoy || []);

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

function renderBlockC(blockB) {
  const c = document.getElementById('block-c-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">ASP XK hồ tiêu VN (USD/Tấn)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pepper-asp"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const aspPts = parseFindicatorSeries(blockB?.xk_pepper || [], 'date', 'price');
  if (!aspPts.length) { showEmpty('chart-pepper-asp', 'Không có dữ liệu ASP'); return; }

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-pepper-asp', {
      series: [{ name: 'ASP XK (USD/Tấn)', data: aspPts.filter(p => p[0] >= cut), color: HC_COLORS[3] }],
    });
  }
  initYearButtons(card, render);
  render('1Y');
}

function renderBlockD(blockA, blockB) {
  const c = document.getElementById('block-d-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Spread ASP XK − Giá tiêu VN (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pepper-spread"></div>
    </div>
  `);
  const card = c.lastElementChild;

  const pepperVnd = parseWiChartSeries(blockA?.pepper_price?.data || []);
  const pepperMap = new Map(pepperVnd.map(([ts, v]) => {
    const d = new Date(ts);
    return [`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, v];
  }));

  const usdByMonth = {};
  (blockA?.usd_vnd || []).forEach(r => {
    const d = new Date(r.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!usdByMonth[k]) usdByMonth[k] = { s: 0, n: 0 };
    usdByMonth[k].s += parseFloat(r.value); usdByMonth[k].n++;
  });
  const usdMap = new Map(Object.entries(usdByMonth).map(([k, v]) => [k, v.s / v.n]));

  const spreadPts = [];
  (blockB?.xk_pepper || []).forEach(r => {
    if (!r.price) return;
    const d = new Date(r.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const usd = usdMap.get(k);
    const pepper = pepperMap.get(k);
    if (!usd || !pepper) return;
    const aspVnd = r.price * usd / 1000; // USD/T → VNĐ/kg
    spreadPts.push([d.getTime(), Math.round(aspVnd - pepper)]);
  });
  spreadPts.sort((a, b) => a[0] - b[0]);

  if (!spreadPts.length) {
    showEmpty('chart-pepper-spread', 'Không đủ dữ liệu ASP/tỷ giá/giá tiêu VN');
    return;
  }

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-pepper-spread', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: [{ name: 'Spread XK (VNĐ/kg)', data: spreadPts.filter(p => p[0] >= cut), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(card, render);
  render('1Y');
}

function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE);
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