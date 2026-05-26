// static/js/sector-pig.js
// Render trang ngành Chăn nuôi heo — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)
// Lưu ý: pig_farming_global cố định year=1Y trong collector

(async function SectorPig() {
  let data;
  try {
    const res = await fetch('/api/sector/pig/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Chăn nuôi heo — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Chăn nuôi heo';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Chăn nuôi heo — Sector Hub';

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

  // Chart 1: Thức ăn chăn nuôi — Ngô CBOT (108) + Đậu nành (87) + Lúa mỳ (88)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Thức ăn chăn nuôi CBOT (USd/Bu)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-feed-cbot"></div>
    </div>
  `);
  const cardCbot = container.lastElementChild;
  const seriesCorn    = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 108));
  const seriesSoybean = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 87));
  const seriesWheat   = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 88));
  function renderFeedCbot(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-feed-cbot', {
      series: [
        { name: 'Ngô CBOT', data: seriesCorn.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Đậu nành CBOT', data: seriesSoybean.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Lúa mỳ CBOT', data: seriesWheat.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(cardCbot, renderFeedCbot);
  renderFeedCbot('1Y');

  // Chart 2: Bã đậu nành TQ (nameId=160)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Bã đậu nành TQ (CNY/T)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-soybean-meal"></div>
    </div>
  `);
  const cardMeal = container.lastElementChild;
  const seriesMeal = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 160));
  function renderMeal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-soybean-meal', {
      yAxis: [{ title: { text: 'CNY/T' } }],
      series: [{ name: 'Bã đậu nành TQ', data: seriesMeal.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
    });
  }
  initYearButtons(cardMeal, renderMeal);
  renderMeal('1Y');

  // Chart 3: Giá heo giống + Giá vốn nuôi VN — không có year buttons (full history)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Giá heo giống & Giá vốn nuôi VN (VNĐ/kg)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-breeding-cost"></div>
    </div>
  `);
  const breedingData = parseFindicatorSeries(blockA.pig_breeding_price);
  const costData     = parseFindicatorSeries(blockA.cost_of_raising);
  if (breedingData.length || costData.length) {
    createStockChart('chart-breeding-cost', {
      series: [
        { name: 'Giá heo giống (VNĐ/kg)', data: breedingData, color: HC_COLORS[0] },
        { name: 'Giá vốn nuôi (VNĐ/kg)', data: costData, color: HC_COLORS[1] },
      ],
    });
  } else {
    showEmpty('chart-breeding-cost');
  }
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Heo nái (id=3) + Giết mổ/tháng (id=5) — 1Y cố định (id=1 tổng đàn không có data từ API)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Heo nái & Heo giết mổ/tháng VN (Triệu con, 1Y)</span>
      </div>
      <div class="chart-container" id="chart-pig-herd"></div>
    </div>
  `);
  const farmingData = blockB.pig_farming || [];
  if (farmingData.length) {
    const herdSeries = [];
    const sowHerd      = farmingData.filter(r => r.name_id === 3);
    const slaughterHerd = farmingData.filter(r => r.name_id === 5);
    if (sowHerd.length) {
      herdSeries.push({ name: 'Số heo nái', data: parseFindicatorSeries(sowHerd), color: HC_COLORS[0] });
    }
    if (slaughterHerd.length) {
      herdSeries.push({ name: 'Heo giết mổ/tháng', data: parseFindicatorSeries(slaughterHerd), color: HC_COLORS[1] });
    }
    if (herdSeries.length) {
      createStockChart('chart-pig-herd', { series: herdSeries });
    } else {
      showEmpty('chart-pig-herd');
    }
  } else {
    showEmpty('chart-pig-herd');
  }

  // Chart 2: NK thịt heo VN — API findicator không có endpoint time-series cho dữ liệu này
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">NK thịt heo VN</span>
      </div>
      <div class="chart-container chart-sm" id="chart-pork-import"></div>
    </div>
  `);
  showEmpty('chart-pork-import', 'Chưa có dữ liệu nhập khẩu thịt heo từ API');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Chart 1: Giá heo hơi VN (3 miền avg) — macroIds=9
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Giá heo hơi VN (VNĐ/kg)</span>
      </div>
      <div class="chart-container" id="chart-pig-price-vn"></div>
    </div>
  `);
  const vnData = parseFindicatorSeries(blockC.heo_hoi_vn);
  const wiData = (blockC.heo_hoi_wichart?.chart?.series?.[0]?.data || []).slice().sort((a, b) => a[0] - b[0]);
  const vnSeries = [];
  if (vnData.length) {
    vnSeries.push({ name: 'Heo hơi VN (Findicator)', data: vnData, color: HC_COLORS[0] });
  }
  if (wiData.length) {
    vnSeries.push({ name: 'Heo hơi VN (WiChart)', data: wiData, color: HC_COLORS[1], dashStyle: 'Dot' });
  }
  if (vnSeries.length) {
    createStockChart('chart-pig-price-vn', { series: vnSeries });
  } else {
    showEmpty('chart-pig-price-vn');
  }

  // Chart 2: Giá heo TQ (CNY/kg) — macroIds=260
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Giá heo TQ (CNY/kg)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-pig-price-cn"></div>
    </div>
  `);
  const cnData = parseFindicatorSeries(blockC.heo_tq);
  if (cnData.length) {
    createStockChart('chart-pig-price-cn', {
      yAxis: [{ title: { text: 'CNY/kg' } }],
      series: [{ name: 'Heo TQ (CNY/kg)', data: cnData, color: HC_COLORS[2] }],
    });
  } else {
    showEmpty('chart-pig-price-cn');
  }
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y">
      <div class="chart-header">
        <span class="chart-title">Margin Chăn nuôi heo (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-lg" id="chart-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  const heoData  = parseFindicatorSeries(blockC.heo_hoi_vn);
  const costData = parseFindicatorSeries(blockA.cost_of_raising);

  if (!heoData.length || !costData.length) {
    showEmpty('chart-spread', 'Thiếu dữ liệu giá heo hơi hoặc giá vốn nuôi');
    return;
  }

  // Index cost_of_raising by YYYY-MM-DD
  const costMap = new Map(costData.map(([ts, v]) => [new Date(ts).toISOString().slice(0, 10), v]));

  const marginData = heoData
    .map(([ts, heo]) => {
      const key = new Date(ts).toISOString().slice(0, 10);
      const cost = costMap.get(key);
      return cost != null ? [ts, heo - cost] : null;
    })
    .filter(Boolean);

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-spread', {
      yAxis: [{ title: { text: 'VNĐ/kg' }, plotLines: [{ value: 0, color: '#888', width: 1 }] }],
      series: [
        {
          name: 'Giá heo hơi',
          data: heoData.filter(p => p[0] >= cutoff),
          color: HC_COLORS[0],
          type: 'line',
        },
        {
          name: 'Giá vốn nuôi',
          data: costData.filter(p => p[0] >= cutoff),
          color: HC_COLORS[1],
          type: 'line',
          dashStyle: 'Dash',
        },
        {
          name: 'Margin',
          data: marginData.filter(p => p[0] >= cutoff),
          color: HC_COLORS[2],
          type: 'area',
          fillOpacity: 0.2,
          threshold: 0,
          negativeColor: HC_COLORS[1],
          negativeFillColor: 'rgba(185,28,28,0.1)',
        },
      ],
    });
  }
  initYearButtons(card, renderSpread);
  renderSpread('1Y');
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