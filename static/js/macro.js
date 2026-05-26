// static/js/macro.js
// Render Macro Dashboard — 6 blocks

(async function MacroDashboard() {
  // Load cả 2 cache song song
  const [vnRes, globalRes] = await Promise.all([
    fetch('/api/macro/vn').then(r => r.json()),
    fetch('/api/macro/global').then(r => r.json()),
  ]);

  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(vnRes.updated_at).toLocaleString('vi-VN');

  renderBlockI_Market(vnRes.market);
  renderBlockII_MacroVN(vnRes);
  renderBlockIII_Rates(vnRes, globalRes);
  renderBlockIV_Commodities(globalRes.commodities);
  renderBlockV_China(globalRes);
  renderBlockVI_Global(globalRes);
})();


function renderBlockI_Market(market) {
  const c = document.getElementById('market-charts');

  // VN-Index + Thanh khoản
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">VN-Index & Thanh khoản</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-vnindex"></div>
    </div>
  `);

  const card = c.querySelector('.chart-card');
  const vnIdx = parseFindicatorSeries(market?.filter(r => r.name_id === 3));  // VNINDEX
  const liquidity = parseFindicatorSeries(market?.filter(r => r.name_id === 1)); // thanh khoản

  function renderVNIndex(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-vnindex', {
      yAxis: [
        { title: { text: 'VN-Index' } },
        { title: { text: 'Tỷ VNĐ' }, opposite: true },
      ],
      series: [
        { name: 'VN-Index', data: vnIdx.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        {
          name: 'Thanh khoản (tỷ)',
          data: liquidity.filter(p => p[0] >= cutoff),
          type: 'column', color: HC_COLORS[3],
          yAxis: 1, opacity: 0.5,
        },
      ],
    });
  }

  initYearButtons(card, renderVNIndex);
  renderVNIndex('1Y');
}


function renderBlockII_MacroVN(vn) {
  const c = document.getElementById('macro-vn-charts');

  // GDP + CPI combo
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">GDP & CPI YoY (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gdp-cpi"></div>
    </div>
  `);

  const card = c.querySelector('.chart-card');
  const gdpData = parseFindicatorSeries(vn.gdp);
  const cpiData = parseFindicatorSeries(vn.cpi_vn);

  function renderGdpCpi(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-gdp-cpi', {
      chart: { type: 'line' },
      xAxis: { type: 'datetime' },
      series: [
        { name: 'GDP YoY (%)', data: gdpData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'CPI YoY (%)', data: cpiData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
      tooltip: { valueSuffix: '%' },
    });
  }

  initYearButtons(card, renderGdpCpi);
  renderGdpCpi('3Y');

  // PMI VN
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI sản xuất VN</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-pmi-vn"></div>
    </div>
  `);

  const card2 = c.querySelectorAll('.chart-card')[1];
  const pmiData = parseFindicatorSeries(vn.pmi_vn);
  // Thêm plotLine tại 50 (ngưỡng mở rộng/thu hẹp)
  function renderPmi(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-pmi-vn', {
      chart: { type: 'area' },
      xAxis: { type: 'datetime' },
      yAxis: {
        min: 40,
        plotLines: [{ value: 50, color: HC_COLORS[1], width: 1, dashStyle: 'ShortDash', label: { text: '50', style: { color: HC_COLORS[1] } } }],
      },
      series: [{ name: 'PMI VN', data: pmiData.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(card2, renderPmi);
  renderPmi('3Y');
}


function renderBlockIII_Rates(vn, global) {
  const c = document.getElementById('rates-charts');

  // Lãi suất huy động 12M
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất huy động 12M</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-deposit-rate"></div>
    </div>
  `);

  // Tỷ giá USD/VND
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ giá USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-usdvnd"></div>
    </div>
  `);

  // Stale: OMO dừng 31/12/2025
  if (vn.omo?.stale) {
    const omoCard = c.querySelector('[data-for="omo"]');
    if (omoCard) setStaleBadge(omoCard, 'warn', 'Dữ liệu đến 12/2025');
  }

  // TODO: implement renders
  showEmpty('chart-deposit-rate', 'Đang load...');
  showEmpty('chart-usdvnd', 'Đang load...');
}


function renderBlockIV_Commodities(commodities) {
  // Group commodities theo nhóm
  const groups = {
    energy:     { name: 'Năng lượng', nameIds: [65, 67, 66] },
    metal:      { name: 'Kim loại', nameIds: [82, 86] },
    agri:       { name: 'Nông sản', nameIds: [108, 87, 98, 95] },
    other:      { name: 'Khác', nameIds: [78, 50] },
  };

  const c = document.getElementById('commodities-charts');
  Object.entries(groups).forEach(([key, group]) => {
    const id = `chart-comdty-${key}`;
    c.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">${group.name}</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-sm" id="${id}"></div>
      </div>
    `);
    showEmpty(id, 'Đang load...');
  });
}


function renderBlockV_China(global) {
  const c = document.getElementById('china-charts');

  // PMI TQ
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI SX Trung Quốc</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-pmi-cn"></div>
    </div>
  `);

  // CPI/PPI TQ với stale badges
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">CPI & PPI Trung Quốc YoY</span>
        <div style="display:flex;gap:4px;align-items:center">
          <span class="stale-badge warn">CPI lag ~13 tháng</span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container chart-sm" id="chart-cpi-ppi-cn"></div>
    </div>
  `);
}


function renderBlockVI_Global(global) {
  const c = document.getElementById('global-charts');

  // Global PMI heatmap/multi-line
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI sản xuất toàn cầu</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-lg" id="chart-global-pmi"></div>
    </div>
  `);

  // nameIds PMI từ global_pmi:
  // 34=CN, 36=DE, 37=IN, 44=US, 45=VN, 49=Euro, 40=JP
  showEmpty('chart-global-pmi', 'Đang load...');
}
