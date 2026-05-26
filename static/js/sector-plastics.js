// static/js/sector-plastics.js
// Render trang ngành Nhựa tổng hợp — 6 khối A–F

(async function SectorPlastics() {
  let data;
  try {
    const res = await fetch('/api/sector/plastics/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Nhựa tổng hợp — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Nhựa tổng hợp';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Nhựa tổng hợp — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_f);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Nhựa gốc TQ (PET, PP, PVC)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá nhựa nguyên liệu TQ (CNY/T)</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="stale-badge" style="display:none"></span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container" id="chart-plastics-raw"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const raw = blockA?.plastics_raw || [];
  const nameIdMap = {
    170: 'PET', 183: 'PP', 231: 'PVC', 203: 'LDPE', 204: 'HDPE', 232: 'LLDPE',
  };

  const series1 = Object.entries(nameIdMap).map(([id, name], i) => ({
    name,
    color: HC_COLORS[i],
    data: parseFindicatorSeries(raw.filter(r => r.name_id === +id)),
  }));

  function renderPlasticsRaw(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-plastics-raw', {
      series: series1.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card1, renderPlasticsRaw);
  renderPlasticsRaw('1Y');

  if (blockA?.cny_vnd?.stale) {
    setStaleBadge(card1, 'warn', 'CNY/VND đến 31/12/2025');
  }

  // Chart 2: Feedstock WTI + Khí HH
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Feedstock (WTI & Khí HH)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-feedstock"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const wti  = parseFindicatorSeries(raw.filter(r => r.name_id === 67));
  const gas  = parseFindicatorSeries(raw.filter(r => r.name_id === 66));

  function renderFeedstock(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-feedstock', {
      yAxis: [
        { title: { text: 'USD/Bbl' } },
        { title: { text: 'USD/MMBtu' }, opposite: true },
      ],
      series: [
        { name: 'WTI (USD/Bbl)', data: wti.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Khí HH (USD/MMBtu)', data: gas.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card2, renderFeedstock);
  renderFeedstock('1Y');

  // Chart 3: USD/VND
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-plastics-usd"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);

  function renderUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-plastics-usd', {
      series: [{ name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card3, renderUsd);
  renderUsd('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: NK nhựa nguyên liệu VN
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">NK nhựa nguyên liệu VN (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-plastics-import"></div>
    </div>
  `);

  const cardImp = container.lastElementChild;
  const imp = blockB?.import_plastic || [];
  const imp22 = parseFindicatorSeries(imp.filter(r => r.name_id === 22 || r.name_id === '22'));
  const imp23 = parseFindicatorSeries(imp.filter(r => r.name_id === 23 || r.name_id === '23'));

  function renderImport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-plastics-import', {
      series: [
        { name: 'Chất dẻo NL', data: imp22.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'SP từ chất dẻo', data: imp23.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(cardImp, renderImport);
  renderImport('1Y');

  // Chart: IIP cao su + nhựa YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">IIP Cao su & Nhựa VN (YoY %)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-plastics-iip"></div>
    </div>
  `);

  const cardIip = container.lastElementChild;
  const iip = parseFindicatorSeries(blockB?.iip);

  function renderIip(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-plastics-iip', {
      series: [{ name: 'IIP cao su + nhựa YoY', data: iip.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(cardIip, renderIip);
  renderIip('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  const pipes = blockC?.pipe_prices || {};
  const specs = [
    'Hàng hóa trong nước (tháng) - Ống nhựa 27 x 1.8mm',
    'Hàng hóa trong nước (tháng) - Ống nhựa 60 x 2mm',
    'Hàng hóa trong nước (tháng) - Ống nhựa 90 x 2,9mm',
  ];
  const labels = ['Ống 27x1.8mm', 'Ống 60x2mm', 'Ống 90x2.9mm'];

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá ống nhựa nội địa (Nghìn VNĐ/m)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pipe-price"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const seriesData = specs.map((spec, i) => {
    const raw = pipes[spec]?.data || [];
    return { name: labels[i], color: HC_COLORS[i], data: parseFindicatorSeries(raw) };
  });

  if (specs.some(s => pipes[s]?.stale)) {
    setStaleBadge(card, 'error', 'API giá ống nhựa không còn khả dụng (404)');
  }

  function renderPipe(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-pipe-price', {
      series: seriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(card, renderPipe);
  renderPipe('1Y');
}


function renderBlockD(blockA, blockF) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="8Q,16Q,All">
      <div class="chart-header">
        <span class="chart-title">Spread Biên gộp vs Biến động NVL</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-plastics-spread"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const raw = blockA?.plastics_raw || [];
  const cnyArr = blockA?.cny_vnd?.cnyExchangeRate || [];

  // CNY/VND: quarter → average rate
  const cnyByQ = {};
  for (const { date, value } of cnyArr) {
    const d = new Date(date);
    const q = `${d.getFullYear()}Q${Math.ceil((d.getMonth() + 1) / 3)}`;
    (cnyByQ[q] = cnyByQ[q] || []).push(parseFloat(value));
  }
  const cnyAvg = {};
  for (const [q, vals] of Object.entries(cnyByQ)) {
    cnyAvg[q] = vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  // NVL: aggregate PET(170)+PP(183)+PVC(231) daily → quarterly average CNY/T → Nghìn VNĐ/T
  const NVL_IDS = [170, 183, 231];
  const nvlSum = {}, nvlCnt = {};
  for (const r of raw) {
    if (!NVL_IDS.includes(r.name_id)) continue;
    const parts = r.date.split('/'); // "MM/DD/YYYY"
    const d = new Date(+parts[2], +parts[0] - 1, +parts[1]);
    const q = `${d.getFullYear()}Q${Math.ceil((d.getMonth() + 1) / 3)}`;
    nvlSum[q] = (nvlSum[q] || 0) + r.value;
    nvlCnt[q] = (nvlCnt[q] || 0) + 1;
  }
  const nvlQData = {};
  for (const q of Object.keys(nvlSum)) {
    const avgCny = nvlSum[q] / nvlCnt[q];
    const rate = cnyAvg[q];
    if (rate) nvlQData[q] = +(avgCny * rate / 1000).toFixed(0);
  }

  // Gross margin % per ticker per quarter
  const tickers = Object.keys(blockF || {}).filter(t => getTickerRows(blockF, t).length > 0);
  const gmData = {};
  const allQ = new Set(Object.keys(nvlQData));
  for (const ticker of tickers) {
    const rows = getTickerRows(blockF, ticker);
    const { quarters, getQ } = getQuarterRows(rows, 20);
    const rev = getQ(24), gp = getQ(28);
    gmData[ticker] = {};
    quarters.forEach((q, i) => {
      if (rev[i]) {
        gmData[ticker][q] = +((gp[i] / rev[i]) * 100).toFixed(2);
        allQ.add(q);
      }
    });
  }

  const sortedQ = [...allQ].sort();

  if (!sortedQ.length) {
    showEmpty('chart-plastics-spread', 'Chưa có dữ liệu BCTC');
    return;
  }

  function renderSpread(opt) {
    const n = opt === 'All' ? sortedQ.length : parseInt(opt);
    const cats = sortedQ.slice(-n);
    createChart('chart-plastics-spread', {
      chart: { type: 'column' },
      xAxis: { categories: cats },
      yAxis: [
        { title: { text: 'NVL Index (Nghìn VNĐ/T)' } },
        { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } },
      ],
      series: [
        {
          name: 'NVL Index (PET+PP+PVC × CNY/VND)',
          type: 'column',
          color: HC_COLORS[5],
          tooltip: { valueSuffix: ' Nghìn VNĐ/T' },
          data: cats.map(q => nvlQData[q] ?? null),
        },
        ...tickers.map((t, i) => ({
          name: `Biên gộp ${t} (%)`,
          type: 'line',
          yAxis: 1,
          color: HC_COLORS[i],
          tooltip: { valueSuffix: '%' },
          data: cats.map(q => gmData[t]?.[q] ?? null),
        })),
      ],
    });
  }

  initYearButtons(card, renderSpread, '8Q');
  renderSpread('8Q');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, evEbitda: 47 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'evEbitda'],
    pctFields: ['grossMargin', 'roe'],
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