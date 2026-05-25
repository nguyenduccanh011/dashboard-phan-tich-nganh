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
  const xkMt  = parseFindicatorSeries((blockB?.export_electronics || []).filter(r => r.nameId === 43));
  const xkDt  = parseFindicatorSeries((blockB?.export_electronics || []).filter(r => r.nameId === 44));

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
  const retailUs  = parseFindicatorSeries(blockB?.retail_us);

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
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
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
      grossMargin: get(2), roe: get(8), roa: get(9), leverage: get(22), evEbitda: get(47),
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
          <th>Biên gộp</th><th>ROE</th><th>ROA</th><th>EV/EBITDA</th>
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
            <td>${pct(r.roa)}</td>
            <td>${num(r.evEbitda)}</td>
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
  Object.keys(blockF || {}).forEach(ticker => {
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
