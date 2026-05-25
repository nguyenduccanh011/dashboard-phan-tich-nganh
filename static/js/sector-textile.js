// static/js/sector-textile.js
// Render trang ngành Dệt may — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorTextile() {
  let data;
  try {
    const res = await fetch('/api/sector/textile/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Dệt may — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Dệt may';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Dệt may — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = Array.isArray(blockA.macro_35) ? blockA.macro_35 : [];
  const byNameId = (id) => parseFindicatorSeries(macro35.filter(r => r.nameId === id));
  const usdVndRows = Array.isArray(blockA.usd_vnd) ? blockA.usd_vnd : [];

  // Chart 1: Bông CBOT (98) và Xơ bông TQ (168) — dual axis
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá bông (CBOT USd/Lbs & TQ CNY/T)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-cotton"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const cbotData = byNameId(98);
  const cottonTqData = byNameId(168);

  function renderCotton(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-cotton', {
      yAxis: [
        { title: { text: 'USd/Lbs' } },
        { title: { text: 'CNY/T' }, opposite: true },
      ],
      series: [
        { name: 'Bông CBOT (USd/Lbs)', data: cbotData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Xơ bông TQ (CNY/T)', data: cottonTqData.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderCotton);
  renderCotton('1Y');

  // Chart 2: Sợi cotton TQ (185), Polyester DTY (163), Polyester POY (186)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá sợi TQ (Cotton / Polyester DTY / POY)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-yarn"></div>
    </div>
  `);

  const card2 = container.lastElementChild;

  function renderYarn(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-yarn', {
      series: [
        { name: 'Sợi cotton TQ', data: byNameId(185).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Polyester DTY TQ', data: byNameId(163).filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
        { name: 'Polyester POY TQ', data: byNameId(186).filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card2, renderYarn);
  renderYarn('1Y');

  // Chart 3: Tỷ giá USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-usd-vnd-textile"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdVndData = parseFindicatorSeries(usdVndRows);

  function renderUsdVnd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-usd-vnd-textile', {
      series: [{ name: 'USD/VND', data: usdVndData.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
    });
  }
  initYearButtons(card3, renderUsdVnd);
  renderUsdVnd('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: XK dệt may VN monthly (value + YoY)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK dệt may VN (Tr USD & YoY%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-export-monthly"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const xkRows = Array.isArray(blockB.xk_monthly) ? blockB.xk_monthly : [];
  const xkYoyRows = Array.isArray(blockB.xk_monthly_yoy) ? blockB.xk_monthly_yoy : [];

  function renderExport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-export-monthly', {
      yAxis: [
        { title: { text: 'Tr USD' } },
        { title: { text: 'YoY %' }, opposite: true, labels: { format: '{value}%' } },
      ],
      series: [
        {
          name: 'XK dệt may (Tr USD)',
          type: 'column',
          data: parseFindicatorSeries(xkRows, 'date', 'value').filter(p => p[0] >= cutoff),
          color: HC_COLORS[0],
        },
        {
          name: 'YoY %',
          type: 'line',
          data: parseFindicatorSeries(xkYoyRows, 'date', 'value').filter(p => p[0] >= cutoff),
          color: HC_COLORS[1],
          yAxis: 1,
          tooltip: { valueSuffix: '%' },
        },
      ],
    });
  }
  initYearButtons(card1, renderExport);
  renderExport('1Y');

  // Chart 2: XK theo thị trường (Mỹ/EU/TQ)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK dệt may theo thị trường</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-export-country"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const xkCountry = blockB.xk_country;
  if (!xkCountry || (Array.isArray(xkCountry) && !xkCountry.length)) {
    showEmpty('chart-export-country');
  } else {
    const markets = Array.isArray(xkCountry) ? xkCountry : [];
    const names = [...new Set(markets.map(r => r.market || r.name))];

    function renderExportCountry(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-export-country', {
        series: names.map((name, i) => ({
          name,
          color: HC_COLORS[i % HC_COLORS.length],
          data: parseFindicatorSeries(
            markets.filter(r => (r.market || r.name) === name),
            'date', 'value'
          ).filter(p => p[0] >= cutoff),
        })),
      });
    }
    initYearButtons(card2, renderExportCountry);
    renderExportCountry('1Y');
  }

  // Chart 3: So sánh XK đối thủ (Bangladesh / TQ / Ấn Độ / Thổ Nhĩ Kỳ)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK dệt may đối thủ (Bangladesh / TQ / Ấn Độ / Thổ Nhĩ Kỳ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-competitors"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const bdRows = parseFindicatorSeries(Array.isArray(blockB.xk_bangladesh) ? blockB.xk_bangladesh : [], 'date', 'value');
  const cnRows = parseFindicatorSeries(Array.isArray(blockB.xk_china) ? blockB.xk_china : [], 'date', 'value');
  const inRows = parseFindicatorSeries(Array.isArray(blockB.xk_india) ? blockB.xk_india : [], 'date', 'value');
  const trRows = parseFindicatorSeries(Array.isArray(blockB.xk_turkey) ? blockB.xk_turkey : [], 'date', 'value');

  function renderCompetitors(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-competitors', {
      series: [
        { name: 'Bangladesh', data: bdRows.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Trung Quốc', data: cnRows.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Ấn Độ', data: inRows.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
        { name: 'Thổ Nhĩ Kỳ', data: trRows.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card3, renderCompetitors);
  renderCompetitors('1Y');

  // Chart 4: PMI SX EU/US/Nhật (demand signal) — nameId: 36=DE, 44=US, 40=JP, 49=Euro
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI SX EU/Mỹ/Nhật (tín hiệu đơn hàng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pmi-demand"></div>
    </div>
  `);

  const card4 = container.lastElementChild;
  const pmiRows = Array.isArray(blockB.pmi_global) ? blockB.pmi_global : [];

  function renderPmi(year) {
    const cutoff = yearToCutoff(year);
    const pmiSeries = [
      { id: 36, name: 'PMI Đức', color: HC_COLORS[0] },
      { id: 44, name: 'PMI Mỹ', color: HC_COLORS[1] },
      { id: 40, name: 'PMI Nhật', color: HC_COLORS[2] },
      { id: 49, name: 'PMI Euro', color: HC_COLORS[3] },
    ].map(s => ({
      name: s.name,
      color: s.color,
      data: parseFindicatorSeries(pmiRows.filter(r => r.nameId === s.id)).filter(p => p[0] >= cutoff),
    }));
    createChart('chart-pmi-demand', {
      chart: { type: 'line' },
      yAxis: [{ title: { text: 'PMI' }, plotLines: [{ value: 50, color: '#888', dashStyle: 'dash', width: 1 }] }],
      series: pmiSeries,
    });
  }
  initYearButtons(card4, renderPmi);
  renderPmi('1Y');

  // Chart 5: Bán lẻ quần áo Mỹ (nameId=20, macroItemId=84)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ quần áo & phụ kiện Mỹ (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-us-apparel"></div>
    </div>
  `);

  const card5 = container.lastElementChild;
  const usApparelRows = parseFindicatorSeries(
    Array.isArray(blockB.us_apparel_retail) ? blockB.us_apparel_retail : []
  );

  function renderUsApparel(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-us-apparel', {
      series: [{ name: 'Bán lẻ quần áo Mỹ (Tr USD)', data: usApparelRows.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
    });
  }
  initYearButtons(card5, renderUsApparel);
  renderUsApparel('1Y');
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
