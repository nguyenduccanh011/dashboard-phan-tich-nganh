// static/js/sector-food-beverage.js
// Render trang ngành Thực phẩm & Đồ uống — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorFoodBeverage() {
  let data;
  try {
    const res = await fetch('/api/sector/food-beverage/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Thực phẩm & Đồ uống — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Thực phẩm & Đồ uống';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Thực phẩm & Đồ uống — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = Array.isArray(blockA.macro_35) ? blockA.macro_35 : [];
  const byNameId = (id) => parseFindicatorSeries(macro35.filter(r => r.nameId === id));

  // Chart 1: Đường RS An Khê (685) & Đường ICE (97) & Đường TQ (220)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá đường (An Khê VNĐ / ICE USD / TQ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-sugar"></div>
    </div>
  `);

  const card1 = container.lastElementChild;

  function renderSugar(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-sugar', {
      yAxis: [
        { title: { text: 'USD cents/Lbs' } },
        { title: { text: 'VNĐ/kg' }, opposite: true },
      ],
      series: [
        { name: 'Đường ICE (USd/Lbs)', data: byNameId(97).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Đường TQ', data: byNameId(220).filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Đường RS An Khê (VNĐ/kg)', data: byNameId(685).filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderSugar);
  renderSugar('1Y');

  // Chart 2: Ngũ cốc — Lúa mỳ CBOT (88), Ngô CBOT (108), Đậu nành (87)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Ngũ cốc CBOT (Lúa mỳ / Ngô / Đậu nành)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-grains"></div>
    </div>
  `);

  const card2 = container.lastElementChild;

  function renderGrains(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-grains', {
      series: [
        { name: 'Lúa mỳ CBOT (USd/Bu)', data: byNameId(88).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Ngô CBOT (USd/Bu)', data: byNameId(108).filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Đậu nành CBOT (USd/Bu)', data: byNameId(87).filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(card2, renderGrains);
  renderGrains('1Y');

  // Chart 3: Dầu cọ Malaysia (90) — nguyên liệu dầu ăn/bánh kẹo
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Dầu cọ Malaysia (MYR/T)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-palm-oil"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const palmData = byNameId(90);

  function renderPalmOil(year) {
    const cutoff = yearToCutoff(year);
    if (!palmData.length) { showEmpty('chart-palm-oil'); return; }
    createStockChart('chart-palm-oil', {
      series: [{ name: 'Dầu cọ Malaysia (MYR/T)', data: palmData.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
    });
  }
  initYearButtons(card3, renderPalmOil);
  renderPalmOil('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Bán lẻ VN — proxy tiêu dùng nội địa
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ hàng hóa & dịch vụ VN (Tỷ VNĐ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-retail-vn"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const retailRows = parseFindicatorSeries(
    Array.isArray(blockB.retail_vn) ? blockB.retail_vn : [], 'date', 'value'
  );

  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-retail-vn', {
      series: [{ name: 'Bán lẻ VN (Tỷ VNĐ)', data: retailRows.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card1, renderRetail);
  renderRetail('1Y');

  // Chart 2: Thị phần bia (SAB/BHN/HABECO) — pie
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Tiêu thụ bia (SAB / BHN / HABECO)</span></div>
      <div class="chart-container chart-sm" id="chart-beer"></div>
    </div>
  `);

  const beerData = blockB.beer_data;
  if (!beerData || (Array.isArray(beerData) && !beerData.length)) {
    showEmpty('chart-beer');
  } else {
    const entries = Array.isArray(beerData)
      ? beerData
      : Object.entries(beerData).map(([k, v]) => ({ name: k, y: v }));
    createChart('chart-beer', {
      chart: { type: 'pie' },
      series: [{ name: 'Thị phần bia', data: entries }],
    });
  }

  // Chart 3: Thị phần sữa (Vinamilk vs Others) — pie
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Thị phần sữa (VNM ~40% — 2022)</span></div>
      <div class="chart-container chart-sm" id="chart-milk"></div>
    </div>
  `);

  const milkData = blockB.milk_data;
  if (!milkData || (Array.isArray(milkData) && !milkData.length)) {
    showEmpty('chart-milk');
  } else {
    const entries = Array.isArray(milkData)
      ? milkData
      : Object.entries(milkData).map(([k, v]) => ({ name: k, y: v }));
    createChart('chart-milk', {
      chart: { type: 'pie' },
      series: [{ name: 'Thị phần sữa', data: entries }],
    });
  }

  // Chart 4: Giá hàng hoá F&B VN (đường/gạo nội địa)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá hàng hoá F&B nội địa (đường / gạo)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-comdty-vn"></div>
    </div>
  `);

  const card4 = container.lastElementChild;
  const comdtyRows = Array.isArray(blockB.comdty_vn) ? blockB.comdty_vn : [];
  const comdtyNames = [...new Set(comdtyRows.map(r => r.name || r.commodity))];

  function renderComdtyVn(year) {
    const cutoff = yearToCutoff(year);
    if (!comdtyRows.length) { showEmpty('chart-comdty-vn'); return; }
    createStockChart('chart-comdty-vn', {
      series: comdtyNames.map((name, i) => ({
        name,
        color: HC_COLORS[i % HC_COLORS.length],
        data: parseFindicatorSeries(
          comdtyRows.filter(r => (r.name || r.commodity) === name), 'date', 'value'
        ).filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(card4, renderComdtyVn);
  renderComdtyVn('1Y');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE);
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
      grossMargin: get(2), roe: get(8), dtGrowth: get(163),
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
          <th>Biên gộp</th><th>ROE</th><th>DT YoY</th>
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
            <td>${pct(r.dtGrowth)}</td>
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
  const tickers = Object.keys(blockF);

  tickers.forEach(ticker => {
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
