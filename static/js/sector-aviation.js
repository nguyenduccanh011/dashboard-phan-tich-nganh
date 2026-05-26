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
  renderBlockD(data.block_a, data.block_b, data.block_f);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
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
  const brentRows = fuelRows.filter(r => r.nameId === 65 || r.nameId === 65);
  const jetV1Rows = fuelRows.filter(r => r.nameId === 623 || r.nameId === 623);
  const jetV2Rows = fuelRows.filter(r => r.nameId === 627 || r.nameId === 627);

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

  // Chart 4: Luân chuyển hành khách (Triệu HK.km)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Luân chuyển hành khách (Triệu HK.km)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-luanchuy-hk"></div>
    </div>
  `);

  const card4 = container.lastElementChild;
  const luanchuyhkRows = Array.isArray(blockB.luanchuy_hk) ? blockB.luanchuy_hk : [];

  function renderLuanchuy(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-luanchuy-hk', {
      series: [{
        name: 'Luân chuyển HK (Triệu HK.km)',
        color: HC_COLORS[2],
        data: parseFindicatorSeries(luanchuyhkRows, 'date', 'value').filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card4, renderLuanchuy);
  renderLuanchuy('1Y');

  // Chart 5: Khách quốc tế YoY (%)
  const yoyRaw = blockB.visitors_yoy || [];
  const yoyFlat = Array.isArray(yoyRaw[0]) ? yoyRaw[0] : yoyRaw;
  const yoyData = parseFindicatorSeries(yoyFlat);
  if (yoyData.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y">
        <div class="chart-header">
          <span class="chart-title">Khách quốc tế đến VN (YoY%)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-sm" id="chart-visitors-yoy"></div>
      </div>
    `);
    const cardYoy = container.lastElementChild;
    function renderVisitorsYoy(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-visitors-yoy', {
        series: [{ name: 'Khách QT YoY (%)', data: yoyData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
      });
    }
    initYearButtons(cardYoy, renderVisitorsYoy);
    renderVisitorsYoy('1Y');
  }
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


function renderBlockD(blockA, blockB, blockF) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Hàng không – Nhiên liệu (proxy margin / chuyến bay)</span></div>
      <div class="chart-container" id="chart-aviation-spread"></div>
    </div>
  `);

  // Hệ số quy đổi: ~100 bbl nhiên liệu / chuyến bay (trung bình nội địa + quốc tế ngắn VN)
  const BBL_PER_FLIGHT = 100;

  function dateToQuarter(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}Q${Math.floor(d.getMonth() / 3) + 1}`;
  }

  function avgByQuarter(rows, dateField, valueField) {
    const sum = {}, cnt = {};
    rows.forEach(r => {
      const q = dateToQuarter(r[dateField]);
      if (!q) return;
      const v = parseFloat(r[valueField]);
      if (isNaN(v)) return;
      sum[q] = (sum[q] || 0) + v;
      cnt[q] = (cnt[q] || 0) + 1;
    });
    const out = {};
    Object.keys(sum).forEach(q => out[q] = sum[q] / cnt[q]);
    return out;
  }

  const brentRows = (blockA?.fuel_prices || []).filter(r => r.name_id === 65);
  const brentByQ = avgByQuarter(brentRows, 'date', 'value');
  const usdByQ = avgByQuarter(blockA?.usd_vnd || [], 'date', 'value');

  const flightsData = blockB?.flights || {};
  const tickers = ['VJC', 'HVN', 'BAV'];

  // Tổng chuyến bay theo quý cho từng hãng
  const quarterlyFlights = {};
  tickers.forEach(t => {
    const sums = {};
    (flightsData[t] || []).forEach(r => {
      const q = dateToQuarter(r.date);
      if (!q) return;
      sums[q] = (sums[q] || 0) + (parseFloat(r.value) || 0);
    });
    quarterlyFlights[t] = sums;
  });

  // Doanh thu thuần (accountId=24) theo quý, dedupe theo id
  function revenueByQuarter(rows) {
    const seen = new Set(), map = {};
    (rows || []).forEach(r => {
      if (r.accountId !== 24) return;
      const key = `${r.year}Q${r.quarter}`;
      if (seen.has(r.id + key)) return;
      seen.add(r.id + key);
      map[key] = r.value;
    });
    return map;
  }

  const series = tickers.map((t, i) => {
    const td = blockF?.[t];
    const rows = Array.isArray(td) ? td : (td?.[t] || []);
    const revByQ = revenueByQuarter(rows);

    const points = [];
    Object.keys(revByQ).forEach(q => {
      const rev = revByQ[q];
      const flights = quarterlyFlights[t]?.[q];
      const brent = brentByQ[q];
      const rate = usdByQ[q];
      if (!rev || !flights || !brent || !rate) return;

      const revPerFlight = rev / flights;                         // VND / chuyến
      const fuelCostPerFlight = brent * BBL_PER_FLIGHT * rate;    // VND / chuyến
      const spreadTrieu = (revPerFlight - fuelCostPerFlight) / 1e6; // triệu VND / chuyến

      const [yr, qn] = q.split('Q');
      points.push([Date.UTC(+yr, (+qn - 1) * 3, 1), Math.round(spreadTrieu)]);
    });

    return { name: t, color: HC_COLORS[i], data: points.sort((a, b) => a[0] - b[0]) };
  }).filter(s => s.data.length > 0);

  if (!series.length) {
    showEmpty('chart-aviation-spread', 'Không đủ dữ liệu để tính spread (cần Brent, tỷ giá, chuyến bay và BCTC cùng quý)');
    return;
  }

  createStockChart('chart-aviation-spread', {
    yAxis: [{ title: { text: 'Triệu VNĐ / chuyến bay' } }],
    tooltip: { valueSuffix: ' triệu VNĐ/chuyến' },
    series,
  });
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