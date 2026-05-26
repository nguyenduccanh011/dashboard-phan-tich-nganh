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
  renderBlockC(data.block_b);
  renderBlockD(data.block_a, data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  window.window.renderBlockG(data.block_g, data.tickers, {});
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
  const wichart = blockA?.lua_price;
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
  const macro35 = blockA?.inputs || [];
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
  const xk = blockB?.xk_rice || [];
  const xkVal = parseFindicatorSeries(xk);
  const xkVol = parseFindicatorSeries(xk, 'date', 'volume');

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
  const xkYoy = parseFindicatorSeries(blockB?.xk_rice_yoy || []);

  function renderYoy(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-rice-export-yoy', {
      series: [{ name: 'XK gạo YoY', data: xkYoy.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(cardYoy, renderYoy);
  renderYoy('1Y');

  // Chart: PMI sản xuất Trung Quốc (proxy nhu cầu nhập khẩu gạo)
  const pmiData = parseFindicatorSeries(blockB?.pmi_china);
  if (pmiData.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">PMI Sản xuất Trung Quốc</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-sm" id="chart-pmi-china"></div>
      </div>
    `);
    const cardPmi = container.lastElementChild;
    function renderPmi(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-pmi-china', {
        yAxis: [{ plotLines: [{ value: 50, color: '#888', width: 1, dashStyle: 'Dash' }] }],
        series: [{ name: 'PMI TQ', data: pmiData.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
      });
    }
    initYearButtons(cardPmi, renderPmi);
    renderPmi('1Y');
  }
}


function renderBlockC(blockB) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">ASP XK gạo VN (USD/Tấn)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-rice-c"></div>
    </div>
  `);
  const card = container.lastElementChild;
  const aspPts = parseFindicatorSeries(blockB?.xk_rice || [], 'date', 'price');
  if (!aspPts.length) { showEmpty('chart-rice-c', 'Không có dữ liệu ASP'); return; }

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-rice-c', {
      series: [{ name: 'ASP XK gạo (USD/Tấn)', data: aspPts.filter(p => p[0] >= cut), color: HC_COLORS[3] }],
    });
  }
  initYearButtons(card, render);
  render('1Y');
}


function renderBlockD(blockA, blockB) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Spread ASP XK − Giá lúa VN (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-rice-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  const luaVnd = parseWiChartSeries(blockA?.lua_price?.data || []);
  const luaMap = new Map(luaVnd.map(([ts, v]) => {
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
  (blockB?.xk_rice || []).forEach(r => {
    if (!r.price) return;
    const d = new Date(r.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const usd = usdMap.get(k);
    const lua = luaMap.get(k);
    if (!usd || !lua) return;
    const aspVnd = r.price * usd / 1000; // USD/T → VNĐ/kg
    spreadPts.push([d.getTime(), Math.round(aspVnd - lua)]);
  });
  spreadPts.sort((a, b) => a[0] - b[0]);

  if (!spreadPts.length) {
    showEmpty('chart-rice-spread', 'Không đủ dữ liệu ASP/tỷ giá/giá lúa VN');
    return;
  }

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-rice-spread', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: [{ name: 'Spread XK (VNĐ/kg)', data: spreadPts.filter(p => p[0] >= cut), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(card, render);
  render('1Y');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, roa: 9, inventory: 11 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'roa', 'inventory'],
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