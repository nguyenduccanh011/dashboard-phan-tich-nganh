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
  const seriesCorn    = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 108));
  const seriesSoybean = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 87));
  const seriesWheat   = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 88));
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
  const seriesMeal = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 160));
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

  // Chart 1: Đàn heo VN + số heo nái — dữ liệu 1Y (cố định)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Đàn heo VN & Số heo nái (1 năm gần nhất)</span>
      </div>
      <div class="chart-container" id="chart-pig-herd"></div>
    </div>
  `);
  const farmingData = blockB.pig_farming || [];
  if (farmingData.length) {
    // macroIds=1 (tổng đàn) và macroIds=3 (heo nái)
    const herdSeries = [];
    const totalHerd = farmingData.filter(r => r.macroId === 1 || r.macro_id === 1);
    const sowHerd   = farmingData.filter(r => r.macroId === 3 || r.macro_id === 3);
    if (totalHerd.length) {
      herdSeries.push({ name: 'Tổng đàn heo VN', data: parseFindicatorSeries(totalHerd), color: HC_COLORS[0] });
    }
    if (sowHerd.length) {
      herdSeries.push({ name: 'Số heo nái', data: parseFindicatorSeries(sowHerd), color: HC_COLORS[1] });
    }
    if (herdSeries.length) {
      createStockChart('chart-pig-herd', { series: herdSeries });
    } else {
      showEmpty('chart-pig-herd');
    }
  } else {
    showEmpty('chart-pig-herd');
  }

  // Chart 2: NK thịt heo VN (từ legend)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">NK thịt heo VN</span>
      </div>
      <div class="chart-container chart-sm" id="chart-pork-import"></div>
    </div>
  `);
  const legend = blockB.pig_legend;
  const importData = legend?.macroGlobalDimImportComdty;
  if (importData && Array.isArray(importData) && importData.length) {
    const categories = importData.map(r => r.name || r.country || '');
    const values = importData.map(r => r.value || r.volume || 0);
    createChart('chart-pork-import', {
      chart: { type: 'bar' },
      xAxis: { categories },
      series: [{ name: 'NK thịt heo (Nghìn tấn)', data: values, color: HC_COLORS[2] }],
    });
  } else {
    showEmpty('chart-pork-import');
  }
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
  const wiData = parseFindicatorSeries(blockC.heo_hoi_wichart?.data || blockC.heo_hoi_wichart || []);
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
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Margin Chăn nuôi heo</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  showEmpty('chart-spread', 'Margin = Giá heo hơi (VNĐ/kg) − Giá vốn nuôi (VNĐ/kg)');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const rows = tickers.map(t => {
    const trRaw = blockE[t]?.trailing;
    const tickerData = trRaw?.[t] || (Array.isArray(trRaw) ? trRaw : []);
    const get = (id) => tickerData.find?.(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = Array.isArray(analyst) ? analyst[0] : analyst;
    return {
      ticker: t,
      marketCap: get(35), pe: get(39), pb: get(40),
      grossMargin: get(2), roe: get(8), dtGrowth: get(163), peFwd: get(154),
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
  const tickers = Object.keys(blockF || {});

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
