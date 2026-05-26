// static/js/sector-shrimp.js
// Render trang ngành Tôm — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorShrimp() {
  let data;
  try {
    const res = await fetch('/api/sector/shrimp/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Tôm — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Tôm';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Tôm — Sector Hub';

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

  // Chart 1: Giá tôm nguyên liệu VN (nameId=23,22,21) — VNĐ/kg
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá tôm nguyên liệu VN (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-shrimp-price"></div>
    </div>
  `);
  const cardShrimp = container.lastElementChild;
  const seriesThe50 = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 23));
  const seriesThe30 = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 22));
  const seriesSu    = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 21));
  function renderShrimpPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-shrimp-price', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: [
        { name: 'Tôm thẻ 50 con/kg', data: seriesThe50.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Tôm thẻ 30 con/kg', data: seriesThe30.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Tôm sú', data: seriesSu.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(cardShrimp, renderShrimpPrice);
  renderShrimpPrice('1Y');

  // Chart 2: Thức ăn — Ngô CBOT (108) + Đậu nành (87)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Thức ăn chăn nuôi (CBOT)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-feed"></div>
    </div>
  `);
  const cardFeed = container.lastElementChild;
  const seriesCorn    = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 108));
  const seriesSoybean = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 87));
  function renderFeed(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-feed', {
      series: [
        { name: 'Ngô CBOT (USd/Bu)', data: seriesCorn.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Đậu nành CBOT', data: seriesSoybean.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(cardFeed, renderFeed);
  renderFeed('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Giá XK tôm thế giới (tôm thẻ nameId=28)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá XK tôm thế giới (USD/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-global-price"></div>
    </div>
  `);
  const cardGlobal = container.lastElementChild;
  const globalPriceData = parseFindicatorSeries(blockB.global_export_price);
  function renderGlobalPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-global-price', {
      series: [{ name: 'Giá XK tôm thẻ (USD/kg)', data: globalPriceData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardGlobal, renderGlobalPrice);
  renderGlobalPrice('1Y');

  // Chart 2: Tổng quan thị trường (Ecuador/Asia/VN volume) — dữ liệu tĩnh
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Tổng quan sản lượng tôm toàn cầu</span>
      </div>
      <div class="chart-container chart-sm" id="chart-overview"></div>
    </div>
  `);
  const overview = blockB.overview;
  if (overview && typeof overview === 'object') {
    const vnData  = (overview.shrimpVolumeAreaVietNam  || []).slice(-8);
    const indData = (overview.shrimpVolumeAreaIndia    || []).slice(-8);
    const ecuData = (overview.shrimpVolumeAreaEcuador  || []).slice(-8);
    const allYears = [...new Set([...vnData, ...indData, ...ecuData].map(r => r.year))].sort();
    const byYear = (arr) => allYears.map(y => { const r = arr.find(x => x.year === y); return r ? (r.volume ?? r.value ?? null) : null; });
    createChart('chart-overview', {
      chart: { type: 'column' },
      xAxis: { categories: allYears },
      series: [
        { name: 'Việt Nam (kT)', data: byYear(vnData),  color: HC_COLORS[0] },
        { name: 'Ấn Độ (kT)',    data: byYear(indData), color: HC_COLORS[1] },
        { name: 'Ecuador (kT)',  data: byYear(ecuData), color: HC_COLORS[2] },
      ],
    });
  } else {
    showEmpty('chart-overview');
  }

  // Chart 3: Bán lẻ thực phẩm Mỹ (proxy demand tôm)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ thực phẩm Mỹ (Tr USD) — proxy demand</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-us-retail"></div>
    </div>
  `);
  const cardRetail = container.lastElementChild;
  const retailData = parseFindicatorSeries(blockB.retail_food_us);
  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-us-retail', {
      series: [{ name: 'Thực phẩm & Đồ uống Mỹ', data: retailData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardRetail, renderRetail);
  renderRetail('1Y');

  // Chart 4: XK tôm toàn cầu (Tr USD + nghìn tấn) — global_export_yoy flatten
  const gyoyRaw = blockB.global_export_yoy || [];
  const gyoyFlat = gyoyRaw.flat();
  const gyoyTurnover = parseFindicatorSeries(gyoyFlat, 'date', 'turnover');
  const gyoyQty      = parseFindicatorSeries(gyoyFlat, 'date', 'quantity');
  if (gyoyTurnover.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y">
        <div class="chart-header">
          <span class="chart-title">XK tôm VN (Tr USD / Nghìn tấn)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-export-global"></div>
      </div>
    `);
    const cardGlobal2 = container.lastElementChild;
    function renderExportGlobal(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-export-global', {
        yAxis: [{ title: { text: 'Tr USD' } }, { title: { text: 'Nghìn tấn' }, opposite: true }],
        series: [
          { name: 'Giá trị XK (Tr USD)', data: gyoyTurnover.filter(p => p[0] >= cutoff), color: HC_COLORS[0], yAxis: 0 },
          { name: 'Sản lượng XK (Nghìn tấn)', data: gyoyQty.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
        ],
      });
    }
    initYearButtons(cardGlobal2, renderExportGlobal);
    renderExportGlobal('1Y');
  }

  // Chart 5: ASP tôm XK theo sản phẩm — tôm thẻ (28) vs tôm sú (29)
  const gbpRaw = blockB.global_by_product || [];
  const gbpThe = parseFindicatorSeries(gbpRaw.filter(r => r.name_id === 28), 'date', 'price');
  const gbpSu  = parseFindicatorSeries(gbpRaw.filter(r => r.name_id === 29), 'date', 'price');
  if (gbpThe.length || gbpSu.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y">
        <div class="chart-header">
          <span class="chart-title">ASP XK tôm thẻ vs tôm sú (USD/kg)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-asp-product"></div>
      </div>
    `);
    const cardAsp = container.lastElementChild;
    function renderAspProduct(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-asp-product', {
        series: [
          { name: 'Tôm thẻ (USD/kg)', data: gbpThe.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
          { name: 'Tôm sú (USD/kg)',  data: gbpSu.filter(p => p[0] >= cutoff),  color: HC_COLORS[2] },
        ],
      });
    }
    initYearButtons(cardAsp, renderAspProduct);
    renderAspProduct('1Y');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  const tickers = Object.keys(blockC.export_price_tom_the || {});

  // Helper: render ASP chart per DN — API trả [{country_name, data:[{date, price}]}]
  function renderAspChart(container, ticker, productKey, labelProduct) {
    const chartId = `chart-asp-${productKey}-${ticker}`;
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">ASP ${labelProduct} ${ticker} (USD/kg)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="${chartId}"></div>
      </div>
    `);
    const card = container.lastElementChild;
    const markets = (blockC[`export_price_${productKey}`] || {})[ticker] || [];

    function render(year) {
      const cutoff = yearToCutoff(year);
      if (!markets.length) { showEmpty(chartId); return; }
      createStockChart(chartId, {
        series: markets.map((m, i) => ({
          name: m.country_name || '',
          color: HC_COLORS[i],
          data: parseFindicatorSeries(m.data || [], 'date', 'price').filter(p => p[0] >= cutoff),
        })),
      });
    }
    initYearButtons(card, render);
    render('1Y');
  }

  // ASP tôm thẻ per DN
  tickers.forEach(ticker => renderAspChart(container, ticker, 'tom_the', 'tôm thẻ'));

  // ASP tôm sú per DN
  tickers.forEach(ticker => renderAspChart(container, ticker, 'tom_su', 'tôm sú'));

  // Kim ngạch + sản lượng XK per DN
  tickers.forEach(ticker => {
    const statusRaw = (blockC.export_status || {})[ticker] || [];
    const flat = statusRaw.flat();
    const turnover = parseFindicatorSeries(flat, 'date', 'turnover');
    const qty      = parseFindicatorSeries(flat, 'date', 'quantity');
    if (!turnover.length) return;

    const chartId = `chart-status-${ticker}`;
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">Kim ngạch XK ${ticker} (Tr USD / Nghìn tấn)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="${chartId}"></div>
      </div>
    `);
    const card = container.lastElementChild;

    function renderStatus(year) {
      const cutoff = yearToCutoff(year);
      createStockChart(chartId, {
        yAxis: [
          { title: { text: 'Tr USD' } },
          { title: { text: 'Nghìn tấn' }, opposite: true },
        ],
        series: [
          { name: 'Kim ngạch (Tr USD)', data: turnover.filter(p => p[0] >= cutoff), color: HC_COLORS[0], yAxis: 0 },
          { name: 'Sản lượng (Nghìn tấn)', data: qty.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
        ],
      });
    }
    initYearButtons(card, renderStatus);
    renderStatus('1Y');
  });
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');

  // Tỷ giá USD/VND daily → aggregate sang monthly avg
  // usd_vnd format: {date: 'MM/DD/YYYY', value: '25000.000'}
  const usdvndMonthly = {};
  (blockA.usd_vnd || []).forEach(r => {
    const d = new Date(r.date);
    const key = d.getFullYear() * 100 + d.getMonth(); // 0-indexed
    if (!usdvndMonthly[key]) usdvndMonthly[key] = { sum: 0, n: 0 };
    usdvndMonthly[key].sum += parseFloat(r.value);
    usdvndMonthly[key].n++;
  });
  const usdvndMap = new Map(
    Object.entries(usdvndMonthly).map(([k, v]) => [+k, v.sum / v.n])
  );

  // Giá tôm NL 50 con/kg (name_id=23) — monthly, format MM/DD/YYYY
  const nlMap = new Map();
  parseFindicatorSeries((blockA.macro_35 || []).filter(r => r.name_id === 23)).forEach(([ts, v]) => {
    const d = new Date(ts);
    nlMap.set(d.getFullYear() * 100 + d.getMonth(), v);
  });

  // Spread per ticker: trung bình ASP tất cả thị trường × USD/VND - Giá NL
  const tickers = Object.keys(blockC.export_price_tom_the || {});
  const spreadSeries = tickers.map((ticker, tIdx) => {
    const markets = blockC.export_price_tom_the[ticker] || [];
    const byMonth = {};
    markets.forEach(market => {
      (market.data || []).forEach(r => {
        const d = new Date(r.date);
        const key = d.getUTCFullYear() * 100 + d.getUTCMonth(); // ISO date → UTC
        if (!byMonth[key]) byMonth[key] = { sum: 0, n: 0 };
        byMonth[key].sum += r.price;
        byMonth[key].n++;
      });
    });
    const pts = [];
    Object.entries(byMonth).forEach(([k, { sum, n }]) => {
      const mk = +k;
      const rate = usdvndMap.get(mk);
      const nl   = nlMap.get(mk);
      if (rate && nl) {
        const yr = Math.floor(mk / 100);
        const mo = mk % 100;
        pts.push([Date.UTC(yr, mo, 1), (sum / n) * rate - nl]);
      }
    });
    pts.sort((a, b) => a[0] - b[0]);
    return { name: `Spread ${ticker}`, data: pts, color: HC_COLORS[tIdx] };
  }).filter(s => s.data.length > 0);

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header"><span class="chart-title">Spread Tôm (VNĐ/kg)</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    if (!spreadSeries.length) {
      showEmpty('chart-spread', 'Không đủ dữ liệu để tính Spread');
      return;
    }
    createStockChart('chart-spread', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: spreadSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
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
