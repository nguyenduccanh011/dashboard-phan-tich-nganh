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
  window.window.window.renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = blockA?.coffee_prices || [];

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
  const xk = blockB?.xk_coffee || [];
  const xkValue  = parseFindicatorSeries(xk);
  const xkVolume = parseFindicatorSeries(xk, 'date', 'volume');

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

  // Chart: ASP XK cà phê (USD/Tấn) — trường price từ xk_coffee
  const xkPrice = parseFindicatorSeries(xk, 'date', 'price');
  if (xkPrice.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">ASP XK cà phê VN (USD/Tấn)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-coffee-asp"></div>
      </div>
    `);
    const cardAsp = container.lastElementChild;
    function renderAsp(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-coffee-asp', {
        series: [{ name: 'ASP XK (USD/Tấn)', data: xkPrice.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
      });
    }
    initYearButtons(cardAsp, renderAsp);
    renderAsp('1Y');
  }
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

  // Spread = ASP XK (USD/tấn × USD/VND) − Giá Robusta VN (VNĐ/kg × 1000 → VNĐ/tấn)
  // usd_vnd: daily {date: MM/DD/YYYY, value}
  // xk_coffee.price: monthly {date: MM/DD/YYYY, price USD/tấn}
  // coffee_prices nameId=687 (Robusta VN): daily {date: MM/DD/YYYY, value VNĐ/kg}

  const usdvndMonthly = {};
  (blockA.usd_vnd || []).forEach(r => {
    const d = new Date(r.date);
    const k = d.getFullYear() * 100 + d.getMonth();
    if (!usdvndMonthly[k]) usdvndMonthly[k] = { sum: 0, n: 0 };
    usdvndMonthly[k].sum += parseFloat(r.value);
    usdvndMonthly[k].n++;
  });
  const usdvndMap = new Map(Object.entries(usdvndMonthly).map(([k, v]) => [+k, v.sum / v.n]));

  const robustaMonthly = {};
  (blockA.coffee_prices || []).filter(r => r.nameId === 687).forEach(r => {
    const d = new Date(r.date);
    const k = d.getFullYear() * 100 + d.getMonth();
    if (!robustaMonthly[k]) robustaMonthly[k] = { sum: 0, n: 0 };
    robustaMonthly[k].sum += parseFloat(r.value);
    robustaMonthly[k].n++;
  });
  const robustaMap = new Map(Object.entries(robustaMonthly).map(([k, v]) => [+k, v.sum / v.n]));

  const xk = blockB?.xk_coffee || [];
  const spreadPts = [];
  xk.forEach(r => {
    if (!r.price) return;
    const d = new Date(r.date);
    const k = d.getFullYear() * 100 + d.getMonth();
    const rate    = usdvndMap.get(k);
    const robusta = robustaMap.get(k);
    if (!rate || !robusta) return;
    spreadPts.push([d.getTime(), Math.round(r.price * rate - robusta * 1000)]);
  });
  spreadPts.sort((a, b) => a[0] - b[0]);

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header"><span class="chart-title">Spread XK cà phê (VNĐ/tấn)</span></div>
      <div class="chart-container" id="chart-coffee-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    const filtered = spreadPts.filter(p => p[0] >= cutoff);
    if (!filtered.length) {
      showEmpty('chart-coffee-spread', 'Spread = ASP XK (USD/tấn × USD/VND) − Giá Robusta VN (VNĐ/tấn)');
      return;
    }
    createStockChart('chart-coffee-spread', {
      yAxis: [{ title: { text: 'VNĐ/tấn' } }],
      series: [{ name: 'Spread (VNĐ/tấn)', data: filtered, color: HC_COLORS[2] }],
    });
  }
  initYearButtons(card, renderSpread);
  renderSpread('1Y');
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