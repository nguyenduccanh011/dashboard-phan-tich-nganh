// static/js/sector-cement.js
// Render trang ngành Xi măng — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorCement() {
  let data;
  try {
    const res = await fetch('/api/sector/cement/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Xi măng — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Xi măng';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Xi măng — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Giá than đầu vào
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá than đầu vào</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-coal-input"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const coalRows = Array.isArray(blockA.coal_price) ? blockA.coal_price : [];
  const coalIceRows = Array.isArray(blockA.coal_ice) ? blockA.coal_ice : [];

  function renderCoal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-coal-input', {
      series: [
        {
          name: 'Than đầu vào (USD/T)',
          color: HC_COLORS[0],
          data: parseFindicatorSeries(coalRows).filter(p => p[0] >= cutoff),
        },
        {
          name: 'Than ICE (USD/T)',
          color: HC_COLORS[2],
          data: parseFindicatorSeries(coalIceRows).filter(p => p[0] >= cutoff),
        },
      ],
    });
  }
  initYearButtons(card1, renderCoal);
  renderCoal('1Y');

  // Chart 2: Dầu Brent (logistics)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Dầu Brent (logistics)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-brent-cement"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const brentRows = Array.isArray(blockA.brent) ? blockA.brent : [];

  function renderBrent(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-brent-cement', {
      series: [{
        name: 'Brent (USD/Bbl)',
        color: HC_COLORS[3],
        data: parseFindicatorSeries(brentRows).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card2, renderBrent);
  renderBrent('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Sản lượng clinker + XK monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Sản lượng clinker & XK xi măng</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-clinker"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const clinkerRows = Array.isArray(blockB.clinker_value) ? blockB.clinker_value : [];

  function renderClinker(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-clinker', {
      series: [{
        name: 'Clinker & XK Xi măng',
        color: HC_COLORS[0],
        data: parseFindicatorSeries(clinkerRows).filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card1, renderClinker);
  renderClinker('1Y');

  // Chart 2: Vốn đầu tư NSNN (tín hiệu tiêu thụ xi măng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Vốn đầu tư NSNN (giải ngân đầu tư công)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-capex-public"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const capexRows = Array.isArray(blockB.capex_public) ? blockB.capex_public : [];

  function renderCapex(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-capex-public', {
      series: [{
        name: 'Vốn NSNN (Tỷ VNĐ)',
        color: HC_COLORS[1],
        data: parseFindicatorSeries(capexRows, 'date', 'value').filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card2, renderCapex);
  renderCapex('1Y');

  // Chart 3: Tiêu thụ & tồn kho clinker xi măng
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tiêu thụ & tồn kho clinker (Nghìn tấn)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-industry-index"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const consumRows = Array.isArray(blockB.consumption_index) ? blockB.consumption_index : [];
  const inventRows = Array.isArray(blockB.inventory_index) ? blockB.inventory_index : [];

  function renderIndustryIndex(year) {
    const cutoff = yearToCutoff(year);
    createChart('chart-industry-index', {
      chart: { type: 'line' },
      series: [
        {
          name: 'Tiêu thụ clinker (Nghìn tấn)',
          color: HC_COLORS[0],
          data: parseFindicatorSeries(consumRows, 'date', 'value').filter(p => p[0] >= cutoff),
        },
        {
          name: 'Tồn kho clinker (Nghìn tấn)',
          color: HC_COLORS[3],
          data: parseFindicatorSeries(inventRows, 'date', 'value').filter(p => p[0] >= cutoff),
        },
      ],
    });
  }
  initYearButtons(card3, renderIndustryIndex);
  renderIndustryIndex('1Y');

  // Chart 4: Sản lượng thép VN (proxy nhu cầu xây dựng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Sản lượng thép VN (proxy nhu cầu xây dựng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-steel-production"></div>
    </div>
  `);

  const card4 = container.lastElementChild;
  const steelRows = Array.isArray(blockB.steel_production) ? blockB.steel_production : [];

  function renderSteel(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-steel-production', {
      series: [{
        name: 'Sản lượng thép (Nghìn tấn)',
        color: HC_COLORS[4],
        data: parseFindicatorSeries(steelRows, 'date', 'value').filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card4, renderSteel);
  renderSteel('1Y');

  // Chart 5: IIP xi măng VN — sản lượng sản xuất (Triệu tấn, nested [[]])
  const iipFlat = (Array.isArray(blockB.iip_yoy) ? blockB.iip_yoy : []).flat();
  const iipSeries = parseFindicatorSeries(iipFlat, 'date', 'value');
  if (iipSeries.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">Sản lượng sản xuất xi măng VN (Triệu tấn)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-cement-iip"></div>
      </div>
    `);
    const card5 = container.lastElementChild;
    function renderIip(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-cement-iip', {
        series: [{ name: 'Sản lượng SX (Triệu tấn)', data: iipSeries.filter(p => p[0] >= cutoff), color: HC_COLORS[5] }],
      });
    }
    initYearButtons(card5, renderIip);
    renderIip('1Y');
  }

  // Chart 6: XK clinker (Triệu USD + Nghìn tấn, nested [[]])
  const clinkerYoyFlat = (Array.isArray(blockB.clinker_yoy) ? blockB.clinker_yoy : []).flat();
  const clinkerYoyVal = parseFindicatorSeries(clinkerYoyFlat, 'date', 'value');
  const clinkerYoyVol = parseFindicatorSeries(clinkerYoyFlat, 'date', 'volume');
  if (clinkerYoyVal.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">XK clinker VN (Triệu USD & Nghìn tấn)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-clinker-yoy"></div>
      </div>
    `);
    const card6 = container.lastElementChild;
    function renderClinkerYoy(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-clinker-yoy', {
        yAxis: [{ title: { text: 'Triệu USD' } }, { title: { text: 'Nghìn tấn' }, opposite: true }],
        series: [
          { name: 'Kim ngạch XK (Triệu USD)', data: clinkerYoyVal.filter(p => p[0] >= cutoff), color: HC_COLORS[0], yAxis: 0 },
          { name: 'Sản lượng XK (Nghìn tấn)', data: clinkerYoyVol.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
        ],
      });
    }
    initYearButtons(card6, renderClinkerYoy);
    renderClinkerYoy('1Y');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Chart: Giá xi măng nội địa + XK
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá xi măng nội địa & XK</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-cement-price"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const internalRows = Array.isArray(blockC.internal_price) ? blockC.internal_price : [];
  const exportRows = Array.isArray(blockC.avg_export_price) ? blockC.avg_export_price : [];

  function renderCementPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-cement-price', {
      yAxis: [
        { title: { text: 'VNĐ/kg' } },
        { title: { text: 'USD/T' }, opposite: true },
      ],
      series: [
        {
          name: 'Giá nội địa PCB40 (VNĐ/kg)',
          color: HC_COLORS[0],
          data: parseFindicatorSeries(internalRows).filter(p => p[0] >= cutoff),
        },
        {
          name: 'Giá XK TB (USD/T)',
          color: HC_COLORS[2],
          yAxis: 1,
          data: parseFindicatorSeries(exportRows).filter(p => p[0] >= cutoff),
        },
      ],
    });
  }
  initYearButtons(card, renderCementPrice);
  renderCementPrice('1Y');
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Spread Xi măng – Than (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-cement-spread"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const cementRows = Array.isArray(blockC.internal_price) ? blockC.internal_price : [];
  const coalRows = Array.isArray(blockA.coal_price) ? blockA.coal_price : [];

  // Build lookup: coal USD/T -> VNĐ/kg (dùng tỷ giá xấp xỉ 25,000 VNĐ/USD)
  const USD_VND = 25000;
  const coalByMonth = {};
  coalRows.forEach(r => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    coalByMonth[key] = (coalByMonth[key] || []);
    coalByMonth[key].push(parseFloat(r.value));
  });

  // Tính spread = giá xi măng (VNĐ/kg) - giá than quy đổi (VNĐ/kg)
  function buildSpreadSeries(cutoff) {
    const result = [];
    cementRows.forEach(r => {
      const ts = new Date(r.date).getTime();
      if (ts < cutoff) return;
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const coalArr = coalByMonth[key];
      if (!coalArr || !coalArr.length) return;
      const coalAvg = coalArr.reduce((a, b) => a + b, 0) / coalArr.length;
      const coalVnd = coalAvg * USD_VND / 1000;
      const spread = parseFloat(r.value) - coalVnd;
      result.push([ts, Math.round(spread)]);
    });
    return result.sort((a, b) => a[0] - b[0]);
  }

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    const spreadData = buildSpreadSeries(cutoff);
    const cementData = parseFindicatorSeries(cementRows).filter(p => p[0] >= cutoff);

    if (!spreadData.length) {
      showEmpty('chart-cement-spread', 'Không có dữ liệu spread');
      return;
    }
    createChart('chart-cement-spread', {
      chart: { type: 'line' },
      yAxis: [
        { title: { text: 'VNĐ/kg' } },
        { title: { text: 'VNĐ/kg' }, opposite: true },
      ],
      series: [
        {
          name: 'Spread Xi măng – Than (VNĐ/kg)',
          color: HC_COLORS[0],
          data: spreadData,
        },
        {
          name: 'Giá xi măng nội địa (VNĐ/kg)',
          color: HC_COLORS[2],
          yAxis: 1,
          dashStyle: 'ShortDash',
          data: cementData,
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