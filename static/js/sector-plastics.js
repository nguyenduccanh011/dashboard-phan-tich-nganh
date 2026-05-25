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
  renderBlockD(data.block_a);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
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
    data: parseFindicatorSeries(raw.filter(r => r.nameId === +id)),
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
  const wti  = parseFindicatorSeries(raw.filter(r => r.nameId === 67));
  const gas  = parseFindicatorSeries(raw.filter(r => r.nameId === 66));

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
  const imp22 = parseFindicatorSeries(imp.filter(r => r.nameId === 22 || r.nameId === '22'));
  const imp23 = parseFindicatorSeries(imp.filter(r => r.nameId === 23 || r.nameId === '23'));

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
    setStaleBadge(card, 'warn', 'sstock auth cần kiểm tra');
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


function renderBlockD(blockA) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Biên gộp vs Biến động NVL</span></div>
      <div class="chart-container" id="chart-plastics-spread"></div>
    </div>
  `);
  showEmpty('chart-plastics-spread', 'Spread = Biên gộp BCTC (%) vs Biến động PET/PP/PVC TQ × CNY/VND');
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
      grossMargin: get(2), roe: get(8), evEbitda: get(47),
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
          <th>Biên gộp</th><th>ROE</th><th>EV/EBITDA</th>
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
