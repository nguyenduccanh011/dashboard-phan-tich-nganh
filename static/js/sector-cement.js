// static/js/sector-cement.js
// Render trang ngành Xi măng — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorCement() {
  let data;
  try {
    const res = await fetch('/api/sector/cement/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Xi măng — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Xi măng';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Xi măng — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Giá than đầu vào
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá than đầu vào</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-coal-input"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const coalRows = Array.isArray(blockA.coal_price) ? blockA.coal_price : [];
  const coalIceRows = Array.isArray(blockA.coal_ice) ? blockA.coal_ice : [];

  function renderCoal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-coal-input', {
      series: [
        {
          name: 'Than đầu vào (USD/T)',
          color: HC_COLORS[0],
          data: parseFindicatorSeries(coalRows).filter(p => p[0] >= cutoff),
        },
        {
          name: 'Than ICE (USD/T)',
          color: HC_COLORS[2],
          data: parseFindicatorSeries(coalIceRows).filter(p => p[0] >= cutoff),
        },
      ],
    });
  }
  initYearButtons(card1, renderCoal);
  renderCoal('1Y');

  // Chart 2: Dầu Brent (logistics)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Dầu Brent (logistics)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-brent-cement"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const brentRows = Array.isArray(blockA.brent) ? blockA.brent : [];

  function renderBrent(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-brent-cement', {
      series: [{
        name: 'Brent (USD/Bbl)',
        color: HC_COLORS[3],
        data: parseFindicatorSeries(brentRows).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card2, renderBrent);
  renderBrent('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Sản lượng clinker + XK monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Sản lượng clinker & XK xi măng</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-clinker"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const clinkerRows = Array.isArray(blockB.clinker_value) ? blockB.clinker_value : [];

  function renderClinker(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-clinker', {
      series: [{
        name: 'Clinker & XK Xi măng',
        color: HC_COLORS[0],
        data: parseFindicatorSeries(clinkerRows).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card1, renderClinker);
  renderClinker('1Y');

  // Chart 2: Vốn đầu tư NSNN (tín hiệu tiêu thụ xi măng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Vốn đầu tư NSNN (giải ngân đầu tư công)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-capex-public"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const capexRows = Array.isArray(blockB.capex_public) ? blockB.capex_public : [];

  function renderCapex(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-capex-public', {
      series: [{
        name: 'Vốn NSNN (Tỷ VNĐ)',
        color: HC_COLORS[1],
        data: parseFindicatorSeries(capexRows, 'date', 'value').filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card2, renderCapex);
  renderCapex('1Y');

  // Chart 3: Chỉ số tiêu thụ & tồn kho CN
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Chỉ số tiêu thụ & tồn kho CN</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-industry-index"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const consumRows = Array.isArray(blockB.consumption_index) ? blockB.consumption_index : [];
  const inventRows = Array.isArray(blockB.inventory_index) ? blockB.inventory_index : [];

  function renderIndustryIndex(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-industry-index', {
      chart: { type: 'line' },
      series: [
        {
          name: 'Tiêu thụ CN',
          color: HC_COLORS[0],
          data: parseFindicatorSeries(consumRows, 'date', 'value').filter(p => p[0] >= cutoff),
        },
        {
          name: 'Tồn kho CN',
          color: HC_COLORS[3],
          data: parseFindicatorSeries(inventRows, 'date', 'value').filter(p => p[0] >= cutoff),
        },
      ],
    });
  }
  initYearButtons(card3, renderIndustryIndex);
  renderIndustryIndex('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Chart: Giá xi măng nội địa + XK
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá xi măng nội địa & XK</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-cement-price"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const internalRows = Array.isArray(blockC.internal_price) ? blockC.internal_price : [];
  const exportRows = Array.isArray(blockC.avg_export_price) ? blockC.avg_export_price : [];

  function renderCementPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-cement-price', {
      yAxis: [
        { title: { text: 'VNĐ/kg' } },
        { title: { text: 'USD/T' }, opposite: true },
      ],
      series: [
        {
          name: 'Giá nội địa PCB40 (VNĐ/kg)',
          color: HC_COLORS[0],
          data: parseFindicatorSeries(internalRows).filter(p => p[0] >= cutoff),
        },
        {
          name: 'Giá XK TB (USD/T)',
          color: HC_COLORS[2],
          yAxis: 1,
          data: parseFindicatorSeries(exportRows).filter(p => p[0] >= cutoff),
        },
      ],
    });
  }
  initYearButtons(card, renderCementPrice);
  renderCementPrice('1Y');
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Xi măng – Than</span></div>
      <div class="chart-container" id="chart-cement-spread"></div>
    </div>
  `);
  showEmpty('chart-cement-spread', 'Spread = Giá xi măng nội địa − Chi phí than đầu vào');
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
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v*100).toFixed(1)}%</span>` : '—';
  const num = (v, dp=1) => v != null ? Highcharts.numberFormat(v, dp) : '—';

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
            <td>${r.upside != null ? pct(r.upside/100) : '—'}</td>
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
