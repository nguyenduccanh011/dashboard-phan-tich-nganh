// static/js/sector-industry.js
// Render trang ngành Khu công nghiệp — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorIndustry() {
  let data;
  try {
    const res = await fetch('/api/sector/industry/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Khu công nghiệp — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Khu công nghiệp (KCN)';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Khu công nghiệp — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: PMI sản xuất VN
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI Sản xuất Việt Nam</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pmi-vn"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const pmiRows = parseFindicatorSeries(
    Array.isArray(blockA.pmi_vn) ? blockA.pmi_vn : [], 'date', 'value'
  );

  function renderPmiVn(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-pmi-vn', {
      chart: { type: 'line' },
      yAxis: [{ title: { text: 'PMI' }, plotLines: [{ value: 50, color: '#888', dashStyle: 'dash', width: 1 }] }],
      series: [{ name: 'PMI SX VN', data: pmiRows.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card1, renderPmiVn);
  renderPmiVn('1Y');

  // Chart 2: IIP VN
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">IIP Sản xuất công nghiệp VN (YoY%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-iip-vn"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const iipRows = parseFindicatorSeries(
    Array.isArray(blockA.iip_vn) ? blockA.iip_vn : [], 'date', 'value'
  );

  function renderIipVn(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-iip-vn', {
      chart: { type: 'column' },
      series: [{ name: 'IIP VN (%)', data: iipRows.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card2, renderIipVn);
  renderIipVn('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: FDI đăng ký + thực hiện (tháng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">FDI đăng ký & thực hiện (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fdi-status"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const fdiStatus = blockB.fdi_status?.fdi_sector || [];
  const fdiRealized = parseFindicatorSeries(
    blockB.fdi_status?.fdi_realized || [], 'date', 'value'
  );

  function renderFdiStatus(year) {
    const cutoff = yearToCutoff(year);
    const registered = parseFindicatorSeries(fdiStatus, 'date', 'value').filter(p => p[0] >= cutoff);

    createStockChart('chart-fdi-status', {
      series: [
        { name: 'FDI đăng ký (Tr USD)', data: registered, color: HC_COLORS[0], type: 'column' },
        { name: 'FDI thực hiện (Tr USD)', data: fdiRealized.filter(p => p[0] >= cutoff), color: HC_COLORS[2], type: 'line' },
      ],
    });
  }
  initYearButtons(card1, renderFdiStatus);
  renderFdiStatus('1Y');

  // Chart 2: Vốn đầu tư NSNN (giải ngân CSHT → kích FDI)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Vốn đầu tư NSNN & Đầu tư xã hội</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-investment"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const capexRows = parseFindicatorSeries(
    Array.isArray(blockB.capex_public) ? blockB.capex_public : [], 'date', 'value'
  );
  const socialRows = parseFindicatorSeries(
    Array.isArray(blockB.social_investment) ? blockB.social_investment : [], 'date', 'value'
  );

  function renderInvestment(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-investment', {
      series: [
        { name: 'Vốn NSNN (Tỷ VNĐ)', data: capexRows.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Đầu tư xã hội (Tỷ VNĐ)', data: socialRows.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card2, renderInvestment);
  renderInvestment('1Y');

  // Chart 3: PMI TQ SX (tín hiệu dịch chuyển chuỗi cung ứng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI SX Trung Quốc (tín hiệu dịch chuyển FDI)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pmi-china"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const pmiChinaRows = parseFindicatorSeries(
    Array.isArray(blockB.pmi_china) ? blockB.pmi_china : []
  );
  // PMI global — CN(34), IN(37), US(44), VN(45); data uses camelCase nameId
  const pmiGlobalRows = blockB.pmi_global?.data || [];

  function renderPmiChina(year) {
    const cutoff = yearToCutoff(year);
    const byId = (id) => parseFindicatorSeries(pmiGlobalRows.filter(r => r.nameId === id)).filter(p => p[0] >= cutoff);
    createChart('chart-pmi-china', {
      chart: { type: 'line' },
      yAxis: [{ title: { text: 'PMI' }, plotLines: [{ value: 50, color: '#888', dashStyle: 'dash', width: 1 }] }],
      series: [
        { name: 'PMI TQ', data: pmiChinaRows.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'PMI Ấn Độ', data: byId(37), color: HC_COLORS[1] },
        { name: 'PMI Mỹ', data: byId(44), color: HC_COLORS[2] },
        { name: 'PMI VN', data: byId(45), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card3, renderPmiChina);
  renderPmiChina('1Y');

  // Chart 4: Giá đất KCN & occupancy (region-land) — bar
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Giá đất KCN & tỷ lệ lấp đầy theo vùng</span></div>
      <div class="chart-container" id="chart-region-land"></div>
    </div>
  `);

  const regionLand = blockB.region_land;
  if (!regionLand || (Array.isArray(regionLand) && !regionLand.length)) {
    showEmpty('chart-region-land');
  } else {
    const regions = Array.isArray(regionLand) ? regionLand : [];
    createChart('chart-region-land', {
      chart: { type: 'bar' },
      xAxis: { categories: regions.map(r => r.region || r.name || r.province) },
      yAxis: [
        { title: { text: 'USD/m²' } },
        { title: { text: 'Tỷ lệ lấp đầy %' }, opposite: true, max: 100 },
      ],
      series: [
        {
          name: 'Giá đất (USD/m²)',
          type: 'bar',
          data: regions.map(r => r.price || r.land_price || null),
          color: HC_COLORS[0],
        },
        {
          name: 'Tỷ lệ lấp đầy (%)',
          type: 'line',
          data: regions.map(r => r.occupancy || r.occupancy_rate || null),
          color: HC_COLORS[2],
          yAxis: 1,
          tooltip: { valueSuffix: '%' },
        },
      ],
    });
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Danh sách DN KCN (filter-company)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Danh sách DN KCN niêm yết</span></div>
      <div class="chart-container" id="chart-kcn-companies"></div>
    </div>
  `);

  const companies = blockC.filter_company?.result || [];
  if (!companies.length) {
    showEmpty('chart-kcn-companies');
  } else {
    createChart('chart-kcn-companies', {
      chart: { type: 'bar' },
      xAxis: { categories: companies.map(c => c.ticket || c.ticker) },
      series: [{
        name: 'Vốn hóa (Tỷ VNĐ)',
        data: companies.map(c => c.market_cap_tyvnd || 0),
        color: HC_COLORS[0],
      }],
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
