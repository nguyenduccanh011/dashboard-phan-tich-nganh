// static/js/sector-chemistry.js
// Render trang ngành Phân bón / Hóa chất — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorChemistry() {
  let data;
  try {
    const res = await fetch('/api/sector/chemistry/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Phân bón / Hóa chất — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Phân bón / Hóa chất';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Phân bón / Hóa chất — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = Array.isArray(blockA.macro_35) ? blockA.macro_35 : [];

  const byNameId = (id) => parseFindicatorSeries(macro35.filter(r => r.nameId === id));

  // Chart 1: Khí TN Henry Hub (66) — giá đầu vào chính DPM/DCM
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Khí TN Henry Hub & Than ICE</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gas-coal"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const gasData = byNameId(66);
  const coalData = byNameId(68);

  function renderGasCoal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gas-coal', {
      yAxis: [
        { title: { text: 'USD/MMBtu' } },
        { title: { text: 'USD/T' }, opposite: true },
      ],
      series: [
        { name: 'Henry Hub (USD/MMBtu)', data: gasData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Than ICE (USD/T)', data: coalData.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderGasCoal);
  renderGasCoal('1Y');

  // Chart 2: Lưu Huỳnh (182), Axit Sulfuric (253), Phốt pho vàng (213)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Hóa chất cơ bản TQ (Lưu Huỳnh / H₂SO₄ / P vàng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-chemicals"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const sulfurData = byNameId(182);
  const h2so4Data = byNameId(253);
  const phosphorData = byNameId(213);

  function renderChemicals(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-chemicals', {
      series: [
        { name: 'Lưu Huỳnh TQ', data: sulfurData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Axit Sulfuric TQ', data: h2so4Data.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Phốt pho vàng TQ', data: phosphorData.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card2, renderChemicals);
  renderChemicals('1Y');

  // Chart 3: Xút NaOH TQ Spot — đầu vào Chlor-Alkali (CSV, DDV)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Xút (NaOH) TQ Spot (CNY/T)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-naoh"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const naohRaw = blockA.naoh_tq;
  const naohStale = naohRaw?.stale;
  if (naohStale) setStaleBadge(card3, 'warn', naohRaw.stale_reason || 'Dữ liệu NaOH có vấn đề');

  const naohData = parseFindicatorSeries(
    Array.isArray(naohRaw?.dataSeriesValuesInfo) ? naohRaw.dataSeriesValuesInfo : []
  );

  function renderNaoh(year) {
    const cutoff = yearToCutoff(year);
    if (!naohData.length) { showEmpty('chart-naoh', 'Không có dữ liệu NaOH TQ'); return; }
    createStockChart('chart-naoh', {
      series: [{ name: 'NaOH TQ (CNY/T)', data: naohData.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
    });
  }
  initYearButtons(card3, renderNaoh);
  renderNaoh('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Giá phân bón VN theo tháng
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá phân bón VN (tháng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fertilizer-price"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const fertRows = Array.isArray(blockB.fertilizer_price) ? blockB.fertilizer_price : [];

  function renderFertPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-fertilizer-price', {
      series: [{
        name: 'Giá phân bón VN',
        data: parseFindicatorSeries(fertRows).filter(p => p[0] >= cutoff),
        color: HC_COLORS[0],
      }],
    });
  }
  initYearButtons(card1, renderFertPrice);
  renderFertPrice('1Y');

  // Chart 2: Cơ cấu chi phí SX phân bón — Overview pie/bar
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Cơ cấu SX phân bón Urea (gas/coal)</span></div>
      <div class="chart-container chart-sm" id="chart-fertilizer-struct"></div>
    </div>
  `);

  const fertData = blockB.fertilizer_data;
  if (!fertData || (Array.isArray(fertData) && !fertData.length)) {
    showEmpty('chart-fertilizer-struct');
  } else {
    const entries = Array.isArray(fertData) ? fertData : Object.entries(fertData).map(([k, v]) => ({ name: k, y: v }));
    createChart('chart-fertilizer-struct', {
      chart: { type: 'pie' },
      series: [{ name: 'Cơ cấu', data: entries }],
    });
  }

  // Chart 3: Cơ cấu chi phí Chlor-Alkali (Xút / NaOH)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Cơ cấu SX Xút (Chlor-Alkali)</span></div>
      <div class="chart-container chart-sm" id="chart-caustic-struct"></div>
    </div>
  `);

  const causticData = blockB.caustic_soda_data;
  if (!causticData || (Array.isArray(causticData) && !causticData.length)) {
    showEmpty('chart-caustic-struct');
  } else {
    const entries = Array.isArray(causticData) ? causticData : Object.entries(causticData).map(([k, v]) => ({ name: k, y: v }));
    createChart('chart-caustic-struct', {
      chart: { type: 'pie' },
      series: [{ name: 'Cơ cấu', data: entries }],
    });
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  const prices = Array.isArray(blockC.prices) ? blockC.prices : [];
  const byNameId = (id) => parseFindicatorSeries(prices.filter(r => r.nameId === id));

  // Chart 1: Giá Urea (CME USD, TQ USD, Phú Mỹ VNĐ, Cà Mau VNĐ)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá Urea (quốc tế & VN)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-urea-price"></div>
    </div>
  `);

  const card1 = container.lastElementChild;

  function renderUrea(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-urea-price', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'VNĐ/T' }, opposite: true },
      ],
      series: [
        { name: 'Urea CME (USD/T)', data: byNameId(50).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Urea TQ (USD/T)', data: byNameId(190).filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Urea Phú Mỹ (VNĐ/T)', data: byNameId(12).filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
        { name: 'Urea Cà Mau (VNĐ/T)', data: byNameId(13).filter(p => p[0] >= cutoff), color: HC_COLORS[3], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderUrea);
  renderUrea('1Y');

  // Chart 2: Giá DAP (TQ USD, Đình Vũ VNĐ) + Kali Phú Mỹ
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá DAP & Kali</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-dap-kali"></div>
    </div>
  `);

  const card2 = container.lastElementChild;

  function renderDapKali(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-dap-kali', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'VNĐ/T' }, opposite: true },
      ],
      series: [
        { name: 'DAP TQ (USD/T)', data: byNameId(156).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'DAP Đình Vũ (VNĐ/T)', data: byNameId(29).filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
        { name: 'Kali Phú Mỹ (VNĐ/T)', data: byNameId(30).filter(p => p[0] >= cutoff), color: HC_COLORS[3], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card2, renderDapKali);
  renderDapKali('1Y');
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Spread Urea – Khí đầu vào</span></div>
      <div class="chart-container" id="chart-urea-spread"></div>
    </div>
  `);
  showEmpty('chart-urea-spread', 'Spread = Giá Urea Phú Mỹ − Chi phí khí (Henry Hub × hệ số × USD/VND)');
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
