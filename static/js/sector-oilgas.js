// static/js/sector-oilgas.js
// Render trang ngành Dầu khí — 6 khối A–F

(async function SectorOilgas() {
  let data;
  try {
    const res = await fetch('/api/sector/oilgas/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Dầu khí — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Dầu khí';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Dầu khí — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  window.window.renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart: Giá dầu Brent + WTI
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá dầu thô (USD/Bbl)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oil-price"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const macro35 = blockA?.macro35 || [];
  const brent = parseFindicatorSeries(macro35.filter(r => r.nameId === 65));
  const wti   = parseFindicatorSeries(macro35.filter(r => r.nameId === 67));

  function renderOil(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oil-price', {
      series: [
        { name: 'Brent (USD/Bbl)', data: brent.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'WTI (USD/Bbl)',   data: wti.filter(p => p[0] >= cutoff),   color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(card1, renderOil);
  renderOil('1Y');

  // Chart: Giá khí Henry Hub
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Khí TN Henry Hub (USD/MMBtu)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gas-price"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const hh = parseFindicatorSeries(macro35.filter(r => r.nameId === 66));

  function renderGas(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gas-price', {
      series: [{ name: 'Henry Hub', data: hh.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card2, renderGas);
  renderGas('1Y');

  // Chart: USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oilgas-usd"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usdVnd);

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oilgas-usd', {
      series: [{ name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card3, renderUsd);
  renderUsd('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');
  const macro35 = blockB?.tanker_rates || [];

  // Chart: Gas tanker rates (VLGC, LGC, MGC, HDY)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Gas Tanker Rates (USD/tháng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-lg" id="chart-gas-tanker"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const tankerMap = [
    { nameId: 312, name: 'VLGC' },
    { nameId: 313, name: 'LGC' },
    { nameId: 314, name: 'MGC' },
    { nameId: 315, name: 'HDY SR' },
    { nameId: 316, name: 'ETH' },
    { nameId: 317, name: 'SR' },
    { nameId: 318, name: 'COASTER Asia' },
    { nameId: 319, name: 'COASTER Europe' },
  ];

  const tankerSeries = tankerMap.map((t, i) => ({
    name: t.name,
    color: HC_COLORS[i % HC_COLORS.length],
    data: parseFindicatorSeries(macro35.filter(r => r.nameId === t.nameId)),
  }));

  function renderTanker(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gas-tanker', {
      series: tankerSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card1, renderTanker);
  renderTanker('1Y');

  // Chart: Tàu dầu MR + VLCC
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Oil Tanker Rates + BDTI/BCTI</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oil-tanker"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const oilTankerMap = [
    { nameId: 339, name: 'Aframax', color: HC_COLORS[0] },
    { nameId: 340, name: 'Suezmax', color: HC_COLORS[1] },
    { nameId: 679, name: 'BDTI', color: HC_COLORS[2] },
    { nameId: 680, name: 'BCTI', color: HC_COLORS[3] },
  ];

  const oilTankerSeries = oilTankerMap.map(t => ({
    name: t.name, color: t.color,
    data: parseFindicatorSeries(macro35.filter(r => r.nameId === t.nameId)),
  }));

  function renderOilTanker(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oil-tanker', {
      series: oilTankerSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card2, renderOilTanker);
  renderOilTanker('1Y');

  // Chart 3: IIP Khai khoáng VN (YoY%)
  const iipMiningData = parseFindicatorSeries(blockB.iip_mining);
  if (iipMiningData.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">IIP Khai khoáng VN (YoY%)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-sm" id="chart-iip-mining"></div>
      </div>
    `);
    const cardIip = container.lastElementChild;
    function renderIipMining(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-iip-mining', {
        series: [{ name: 'IIP Khai khoáng (YoY%)', data: iipMiningData.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
      });
    }
    initYearButtons(cardIip, renderIipMining);
    renderIipMining('1Y');
  }

  // Chart 4: XK dầu thô & sản phẩm dầu VN (Triệu USD)
  const xkOilData = parseFindicatorSeries(blockB.xk_oil);
  if (xkOilData.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">XK dầu thô & sản phẩm dầu VN</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-sm" id="chart-xk-oil"></div>
      </div>
    `);
    const cardXk = container.lastElementChild;
    function renderXkOil(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-xk-oil', {
        series: [{ name: 'XK dầu (Triệu USD)', data: xkOilData.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
      });
    }
    initYearButtons(cardXk, renderXkOil);
    renderXkOil('1Y');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  const macro35 = blockC?.domestic_fuel || [];

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá xăng dầu nội địa VN (VNĐ/Lít)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fuel-price"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const fuelMap = [
    { nameId: 612, name: 'RON95 vùng 1', color: HC_COLORS[0] },
    { nameId: 613, name: 'RON92 vùng 1', color: HC_COLORS[1] },
    { nameId: 614, name: 'RON95 vùng 2', color: HC_COLORS[2] },
    { nameId: 618, name: 'Dầu DO vùng 1', color: HC_COLORS[3] },
    { nameId: 622, name: 'Dầu hoả vùng 1', color: HC_COLORS[4] },
  ];

  const fuelSeries = fuelMap.map(f => ({
    name: f.name, color: f.color,
    data: parseFindicatorSeries(macro35.filter(r => r.nameId === f.nameId)),
  }));

  function renderFuel(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-fuel-price', {
      series: fuelSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card, renderFuel);
  renderFuel('1Y');
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Spread Downstream — RON95 vs Chi phí Brent (VNĐ/lít)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oilgas-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  const macro35 = blockA?.macro35 || [];
  const brentRows = macro35.filter(r => r.nameId === 65);
  const usdRows = blockA?.usdVnd || [];
  const ron95Rows = (blockC?.domestic_fuel || []).filter(r => r.nameId === 612);

  function monthlyAvg(rows, dateField, valField) {
    const sum = {}, cnt = {};
    rows.forEach(r => {
      const d = new Date(r[dateField]);
      if (isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      sum[k] = (sum[k] || 0) + parseFloat(r[valField] || 0);
      cnt[k] = (cnt[k] || 0) + 1;
    });
    const out = {};
    Object.keys(sum).forEach(k => out[k] = sum[k] / cnt[k]);
    return out;
  }

  const brentByMonth = monthlyAvg(brentRows, 'date', 'value');
  const usdByMonth = monthlyAvg(usdRows, 'date', 'value');

  const ron95Pts = [], brentCostPts = [], spreadPts = [];
  ron95Rows.forEach(r => {
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return;
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const brent = brentByMonth[k];
    const usd = usdByMonth[k];
    const ron95 = parseFloat(r.value);
    if (!brent || !usd || !ron95) return;
    const ts = d.getTime();
    const brentVND = Math.round(brent * usd / 159);
    ron95Pts.push([ts, ron95]);
    brentCostPts.push([ts, brentVND]);
    spreadPts.push([ts, ron95 - brentVND]);
  });

  if (!spreadPts.length) {
    showEmpty('chart-oilgas-spread', 'Không đủ dữ liệu Brent/tỷ giá/RON95 cùng tháng');
    return;
  }

  const sort = arr => arr.sort((a, b) => a[0] - b[0]);

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-oilgas-spread', {
      yAxis: [
        { title: { text: 'VNĐ/lít' } },
        { title: { text: 'Spread (VNĐ/lít)' }, opposite: true },
      ],
      tooltip: { valueSuffix: ' VNĐ/lít' },
      series: [
        { name: 'RON95 bán lẻ', data: sort(ron95Pts).filter(p => p[0] >= cut), color: HC_COLORS[0] },
        { name: 'Brent×tỷ giá/159', data: sort(brentCostPts).filter(p => p[0] >= cut), color: HC_COLORS[3] },
        { name: 'Spread', data: sort(spreadPts).filter(p => p[0] >= cut), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card, render);
  render('1Y');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, roa: 9 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'roa'],
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
