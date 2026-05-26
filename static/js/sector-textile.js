// static/js/sector-textile.js
// Render trang ngành Dệt may — 6 khối A–F
// Phụ thuộc: charts.js, sector-utils.js (đã load qua sector.html)

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
  renderBlockC(data.block_b);
  renderBlockD(data.block_f);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = Array.isArray(blockA.macro_35) ? blockA.macro_35 : [];
  const byNameId = (id) => parseFindicatorSeries(macro35.filter(r => r.name_id === id));
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

  // Build country id → name map from overview
  const countryMap = {};
  ((blockB.overview || {}).country || []).forEach(c => { countryMap[c.id] = c.country; });

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

  // Chart 2: XK theo thị trường — bar chart với % tỷ trọng (dữ liệu 2023)
  // xk_country: [{importedCountryId, value (0-1), nameId: 44}]
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">XK dệt may theo thị trường (% tỷ trọng 2023)</span>
      </div>
      <div class="chart-container" id="chart-export-country"></div>
    </div>
  `);

  const destRows = (blockB.xk_country || []).filter(r => r.nameId === 44);
  if (!destRows.length) {
    showEmpty('chart-export-country');
  } else {
    const sorted = [...destRows].sort((a, b) => b.value - a.value);
    const cats = sorted.map(r => countryMap[r.importedCountryId] || `ID ${r.importedCountryId}`);
    const vals = sorted.map(r => +(r.value * 100).toFixed(1));
    createChart('chart-export-country', {
      chart: { type: 'bar' },
      xAxis: { categories: cats },
      yAxis: { title: { text: '% tổng XK' }, labels: { format: '{value}%' } },
      series: [{ name: 'Tỷ trọng XK (2023)', data: vals, color: HC_COLORS[0] }],
      tooltip: { valueSuffix: '%' },
    });
  }

  // Chart 3: Thị phần XK dệt may toàn cầu — bar chart (textileExportOverall nameId=697)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Thị phần XK dệt may toàn cầu (%)</span>
      </div>
      <div class="chart-container" id="chart-competitors"></div>
    </div>
  `);

  const globalShare = ((blockB.overview || {}).textileExportOverall || [])
    .filter(r => r.nameId === 697)
    .sort((a, b) => b.value - a.value);

  if (!globalShare.length) {
    showEmpty('chart-competitors');
  } else {
    const gCats = globalShare.map(r => countryMap[r.exportedCountryId] || `ID ${r.exportedCountryId}`);
    const gVals = globalShare.map((r, i) => ({
      y: +(r.value * 100).toFixed(1),
      color: r.exportedCountryId === 7 ? HC_COLORS[4] : HC_COLORS[0],
    }));
    createChart('chart-competitors', {
      chart: { type: 'bar' },
      xAxis: { categories: gCats },
      yAxis: { title: { text: '% thị phần toàn cầu' }, labels: { format: '{value}%' } },
      series: [{ name: 'Thị phần XK dệt may', data: gVals, colorByPoint: true }],
      tooltip: { valueSuffix: '%', pointFormat: '<b>{point.y}%</b>' },
    });
  }

  // Chart 4: PMI SX EU/Mỹ/Nhật (tín hiệu đơn hàng) — FIX: unwrap pmi_global[0].data + nameId
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
  const pmiRaw = blockB.pmi_global;
  const pmiRows = (pmiRaw && Array.isArray(pmiRaw.data)) ? pmiRaw.data : [];

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

  // Chart 6: FDI vào dệt may (Triệu USD)
  const fdiRows = parseFindicatorSeries(
    Array.isArray(blockB.fdi) ? blockB.fdi : [], 'date', 'value'
  );
  if (fdiRows.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">FDI thực hiện VN (Tr USD)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-fdi-textile"></div>
      </div>
    `);
    const card6 = container.lastElementChild;
    function renderFdi(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-fdi-textile', {
        series: [{ name: 'FDI thực hiện VN (Tr USD)', data: fdiRows.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
      });
    }
    initYearButtons(card6, renderFdi);
    renderFdi('1Y');
  }
}


function renderBlockC(blockB) {
  const container = document.getElementById('block-c-charts');
  const overview = blockB.overview || {};
  const countryMap = {};
  (overview.country || []).forEach(c => { countryMap[c.id] = c.country; });

  // Chart 1: Cơ cấu sản phẩm XK dệt may (textileApplication)
  const appRows = Array.isArray(overview.textileApplication) ? overview.textileApplication : [];
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Cơ cấu sản phẩm XK dệt may (%)</span>
      </div>
      <div class="chart-container" id="chart-product-mix"></div>
    </div>
  `);
  if (!appRows.length) {
    showEmpty('chart-product-mix');
  } else {
    const sorted = [...appRows].sort((a, b) => b.value - a.value);
    createChart('chart-product-mix', {
      chart: { type: 'bar' },
      xAxis: { categories: sorted.map(r => r.name) },
      yAxis: { title: { text: '% cơ cấu' }, labels: { format: '{value}%' } },
      series: [{
        name: 'Tỷ trọng sản phẩm',
        data: sorted.map(r => +(r.value * 100).toFixed(1)),
        color: HC_COLORS[2],
      }],
      tooltip: { valueSuffix: '%' },
    });
  }

  // Chart 2: Tiêu thụ bông toàn cầu top-country (textileExportOverall nameId=102, đơn vị Tấn)
  const cottonRows = (overview.textileExportOverall || [])
    .filter(r => r.nameId === 102)
    .sort((a, b) => b.value - a.value);
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Tiêu thụ bông toàn cầu theo quốc gia (Nghìn tấn)</span>
      </div>
      <div class="chart-container" id="chart-cotton-consumption"></div>
    </div>
  `);
  if (!cottonRows.length) {
    showEmpty('chart-cotton-consumption');
  } else {
    const ccCats = cottonRows.map(r => countryMap[r.exportedCountryId] || `ID ${r.exportedCountryId}`);
    const ccVals = cottonRows.map(r => +(r.value / 1000).toFixed(0));
    createChart('chart-cotton-consumption', {
      chart: { type: 'bar' },
      xAxis: { categories: ccCats },
      yAxis: { title: { text: 'Nghìn tấn' } },
      series: [{
        name: 'Tiêu thụ bông (Nghìn tấn)',
        data: ccVals.map((v, i) => ({
          y: v,
          color: cottonRows[i].exportedCountryId === 7 ? HC_COLORS[4] : HC_COLORS[0],
        })),
        colorByPoint: true,
      }],
    });
  }
}


function renderBlockD(blockF) {
  const container = document.getElementById('block-d-charts');
  const TICKERS_F = ['TCM', 'TNG', 'MSH', 'VGT'];

  // Thu thập dữ liệu từng ticker
  const label = r => `${r.year}Q${r.quarter}`;
  const allQ = new Set();
  const byTicker = {};

  TICKERS_F.forEach(t => {
    const rows = getTickerRows(blockF, t);
    const byQ = {};
    rows.forEach(r => {
      const q = label(r);
      allQ.add(q);
      if (!byQ[q]) byQ[q] = {};
      byQ[q][r.accountId] = r.value;
    });
    byTicker[t] = byQ;
  });

  const sortedQ = [...allQ].sort().slice(-10);

  // Chart 1: Biên gộp % so sánh DN (accountId 28/24 * 100)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Biên gộp % so sánh DN (Gross Margin)</span>
      </div>
      <div class="chart-container" id="chart-gross-margin"></div>
    </div>
  `);

  const grossSeries = TICKERS_F.map((t, i) => ({
    name: t,
    color: HC_COLORS[i],
    data: sortedQ.map(q => {
      const d = byTicker[t]?.[q];
      if (!d || !d[24] || d[28] == null) return null;
      return +(d[28] / d[24] * 100).toFixed(1);
    }),
  })).filter(s => s.data.some(v => v != null));

  if (!grossSeries.length) {
    showEmpty('chart-gross-margin');
  } else {
    createChart('chart-gross-margin', {
      chart: { type: 'line' },
      xAxis: { categories: sortedQ },
      yAxis: [{ title: { text: 'Biên gộp %' }, labels: { format: '{value}%' } }],
      tooltip: { valueSuffix: '%' },
      series: grossSeries,
    });
  }

  // Chart 2: Biên ròng % so sánh DN (accountId 43/24 * 100 = LNST/Doanh thu)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Biên ròng % so sánh DN (Net Margin)</span>
      </div>
      <div class="chart-container" id="chart-net-margin"></div>
    </div>
  `);

  const netSeries = TICKERS_F.map((t, i) => ({
    name: t,
    color: HC_COLORS[i],
    data: sortedQ.map(q => {
      const d = byTicker[t]?.[q];
      if (!d || !d[24] || d[43] == null) return null;
      return +(d[43] / d[24] * 100).toFixed(1);
    }),
  })).filter(s => s.data.some(v => v != null));

  if (!netSeries.length) {
    showEmpty('chart-net-margin');
  } else {
    createChart('chart-net-margin', {
      chart: { type: 'line' },
      xAxis: { categories: sortedQ },
      yAxis: [{ title: { text: 'Biên ròng %' }, labels: { format: '{value}%' } }],
      tooltip: { valueSuffix: '%' },
      series: netSeries,
    });
  }

  // Chart 3: Doanh thu so sánh DN (Tỷ VNĐ per quarter)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Doanh thu theo quý so sánh DN (Tỷ VNĐ)</span>
      </div>
      <div class="chart-container" id="chart-revenue-compare"></div>
    </div>
  `);

  const revSeries = TICKERS_F.map((t, i) => ({
    name: t,
    color: HC_COLORS[i],
    data: sortedQ.map(q => {
      const d = byTicker[t]?.[q];
      if (!d || d[24] == null) return null;
      return +(d[24] / 1e9).toFixed(1);
    }),
  })).filter(s => s.data.some(v => v != null));

  if (!revSeries.length) {
    showEmpty('chart-revenue-compare');
  } else {
    createChart('chart-revenue-compare', {
      chart: { type: 'column' },
      xAxis: { categories: sortedQ },
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: revSeries,
    });
  }
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
