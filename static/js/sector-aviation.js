// static/js/sector-aviation.js
// Render trang ngành Hàng không — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorAviation() {
  let data;
  try {
    const res = await fetch('/api/sector/aviation/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Hàng không — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Hàng không';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Hàng không — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c, data.block_f);
  renderBlockD(data.block_a, data.block_f);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Giá nhiên liệu (Brent + Jet Fuel proxy VN)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá nhiên liệu bay</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fuel"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const fuelRows = Array.isArray(blockA.fuel_prices) ? blockA.fuel_prices : [];
  const brentRows = fuelRows.filter(r => r.nameId === 65 || r.name_id === 65);
  const jetV1Rows = fuelRows.filter(r => r.nameId === 623 || r.name_id === 623);
  const jetV2Rows = fuelRows.filter(r => r.nameId === 627 || r.name_id === 627);

  function renderFuel(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-fuel', {
      yAxis: [
        { title: { text: 'USD/Bbl' } },
        { title: { text: 'VNĐ/Lít' }, opposite: true },
      ],
      series: [
        {
          name: 'Dầu Brent (USD/Bbl)',
          color: HC_COLORS[0],
          data: parseFindicatorSeries(brentRows).filter(p => p[0] >= cutoff),
        },
        {
          name: 'Dầu hỏa vùng 1 VN (VNĐ/Lít)',
          color: HC_COLORS[2],
          yAxis: 1,
          data: parseFindicatorSeries(jetV1Rows).filter(p => p[0] >= cutoff),
        },
        {
          name: 'Dầu hỏa vùng 2 VN (VNĐ/Lít)',
          color: HC_COLORS[3],
          yAxis: 1,
          data: parseFindicatorSeries(jetV2Rows).filter(p => p[0] >= cutoff),
        },
      ],
    });
  }
  initYearButtons(card1, renderFuel);
  renderFuel('1Y');

  // Chart 2: Tỷ giá USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-usd-vnd-avi"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const usdRows = Array.isArray(blockA.usd_vnd) ? blockA.usd_vnd : [];

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-usd-vnd-avi', {
      series: [{
        name: 'USD/VND',
        color: HC_COLORS[1],
        data: parseFindicatorSeries(usdRows).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card2, renderUsd);
  renderUsd('1Y');

  // Chart 3: Lãi suất FED
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất FED (chi phí thuê máy bay)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fed-rate-avi"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const fedRows = Array.isArray(blockA.fed_rate) ? blockA.fed_rate : [];

  function renderFed(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-fed-rate-avi', {
      series: [{
        name: 'FED Rate (%)',
        color: HC_COLORS[4],
        data: parseFindicatorSeries(fedRows).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card3, renderFed);
  renderFed('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Số chuyến bay monthly per-hãng
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Số chuyến bay monthly (VJC/HVN/BAV)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-flights"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const flightsData = blockB.flights || {};
  const flightTickers = ['VJC', 'HVN', 'BAV'];

  function renderFlights(year) {
    const cutoff = yearToCutoff(year);
    const series = flightTickers.map((t, i) => {
      const rows = Array.isArray(flightsData[t]) ? flightsData[t] : [];
      return {
        name: t,
        color: HC_COLORS[i],
        data: parseFindicatorSeries(rows).filter(p => p[0] >= cutoff),
      };
    }).filter(s => s.data.length > 0);

    if (!series.length) { showEmpty('chart-flights'); return; }
    createStockChart('chart-flights', { series });
  }
  initYearButtons(card1, renderFlights);
  renderFlights('1Y');

  // Chart 2: Khách quốc tế đến VN
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Khách quốc tế đến VN</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-intl-visitors"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const visitorRows = Array.isArray(blockB.international_visitors) ? blockB.international_visitors : [];

  function renderVisitors(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-intl-visitors', {
      series: [{
        name: 'Khách QT (người)',
        color: HC_COLORS[0],
        data: parseFindicatorSeries(visitorRows).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card2, renderVisitors);
  renderVisitors('1Y');

  // Chart 3: Vận chuyển hành khách (macro VN)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Vận chuyển hành khách VN (triệu lượt)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-transport-passenger"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const transportRows = Array.isArray(blockB.transport_passenger) ? blockB.transport_passenger : [];

  function renderTransport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-transport-passenger', {
      series: [{
        name: 'Vận chuyển HK (triệu lượt)',
        color: HC_COLORS[1],
        data: parseFindicatorSeries(transportRows, 'date', 'value').filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card3, renderTransport);
  renderTransport('1Y');
}


function renderBlockC(blockC, blockF) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Doanh thu per-DN (proxy yield)</span></div>
      <div class="chart-container" id="chart-revenue-proxy"></div>
    </div>
  `);

  // Không có per-DN ASP từ Findicator, dùng DT từ BCTC (accountId=24) làm proxy
  if (!blockF || !Object.keys(blockF).length) {
    showEmpty('chart-revenue-proxy', 'Dùng BCTC Khối F để xem doanh thu per-DN');
    return;
  }

  const tickers = Object.keys(blockF);
  const quarterSets = tickers.map(t => {
    const td = blockF[t];
    const rows = td?.[t] || (Array.isArray(td) ? td : []);
    return rows.filter(r => r.accountId === 24);
  });

  if (!quarterSets.some(s => s.length)) {
    showEmpty('chart-revenue-proxy', 'Dùng BCTC Khối F để xem doanh thu per-DN');
    return;
  }

  const allQs = [...new Set(quarterSets.flat().map(r => r.period || `${r.year}Q${r.quarter}`))].sort().slice(-8);
  createChart('chart-revenue-proxy', {
    chart: { type: 'column' },
    xAxis: { categories: allQs },
    yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
    series: tickers.map((t, i) => {
      const td = blockF[t];
      const rows = (td?.[t] || (Array.isArray(td) ? td : [])).filter(r => r.accountId === 24);
      return {
        name: t,
        color: HC_COLORS[i],
        data: allQs.map(q => rows.find(r => (r.period || `${r.year}Q${r.quarter}`) === q)?.value ?? null),
      };
    }),
  });
}


function renderBlockD(blockA, blockF) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Hàng không – Nhiên liệu</span></div>
      <div class="chart-container" id="chart-aviation-spread"></div>
    </div>
  `);
  showEmpty('chart-aviation-spread', 'Proxy margin = DT thuần / chuyến bay − (Brent × hệ số × tỷ giá)');
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
