// static/js/sector-logistics.js
(async function SectorLogistics() {
  let data;
  try {
    const res = await fetch('/api/sector/logistics/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Logistics — Lỗi tải dữ liệu';
    return;
  }
  document.getElementById('sector-name').textContent = 'Logistics & Cảng biển';
  document.getElementById('last-updated').textContent = 'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Logistics — Sector Hub';
  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_b);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();

function renderBlockA(blockA) {
  const c = document.getElementById('block-a-charts');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Freight Index (BDI & WCI)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-freight-idx"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const raw = blockA?.freight_indices || [];
  const bdi = parseFindicatorSeries(raw.filter(r => r.name_id === 681));
  const wci = parseFindicatorSeries(raw.filter(r => r.name_id === 688));

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-freight-idx', {
      yAxis: [
        { title: { text: 'BDI (pts)' } },
        { title: { text: 'WCI (USD/FEU)' }, opposite: true },
      ],
      series: [
        { name: 'BDI', data: bdi.filter(p => p[0] >= cut), color: HC_COLORS[0] },
        { name: 'WCI Container', data: wci.filter(p => p[0] >= cut), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card, render);
  render('1Y');

  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Dầu Brent (chi phí nhiên liệu)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-logistics-brent"></div>
    </div>
  `);
  const card2 = c.lastElementChild;
  const brent = parseFindicatorSeries(raw.filter(r => r.name_id === 65));
  function renderBrent(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-logistics-brent', {
      series: [{ name: 'Brent (USD/Bbl)', data: brent.filter(p => p[0] >= cut), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(card2, renderBrent);
  renderBrent('1Y');
}

// nameId → tên mặt hàng XK/NK (overview tabId=6/7)
const XK_NAMES = {
  12: 'Thủy sản', 13: 'Xi măng/Clinker', 14: 'Hóa chất', 15: 'SP hóa chất',
  16: 'Phân bón', 17: 'Cao su', 18: 'SP cao su', 19: 'Gỗ & SP gỗ',
  20: 'SP gỗ tinh chế', 21: 'Xơ sợi dệt', 22: 'Dệt & may',
  23: 'Sắt thép', 24: 'SP sắt thép', 25: 'Máy tính/Điện tử', 26: 'Điện thoại', 70: 'Tổng XK',
};
const NK_NAMES = {
  27: 'Hóa chất', 28: 'SP hóa chất', 29: 'Chất dẻo NL', 30: 'SP chất dẻo',
  31: 'Vải các loại', 32: 'NPL dệt may', 33: 'Sắt thép NK', 34: 'SP sắt thép NK',
  35: 'Máy tính/ĐT NK', 36: 'Điện thoại NK', 71: 'Tổng NK',
};

function parseOverviewSeries(data, nameId) {
  if (!Array.isArray(data)) return [];
  return data
    .filter(r => r.nameId === nameId)
    .map(r => [new Date(r.date).getTime(), r.value != null ? parseFloat(r.value) * 100 : null])
    .filter(([t, v]) => !isNaN(t) && v != null)
    .sort((a, b) => a[0] - b[0]);
}

function renderBlockB(blockB) {
  const c = document.getElementById('block-b-charts');

  // Chart 1: XNK VN tổng kim ngạch
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XNK VN tổng (proxy throughput cảng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-vn-trade"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const exp = parseFindicatorSeries(blockB?.xk_vn);
  const imp = parseFindicatorSeries(blockB?.nk_vn);

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-vn-trade', {
      series: [
        { name: 'XK VN (Tr USD)', data: exp.filter(p => p[0] >= cut), color: HC_COLORS[0] },
        { name: 'NK VN (Tr USD)', data: imp.filter(p => p[0] >= cut), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card, render);
  render('3Y');

  // Chart 2: XK VN YoY breakdown theo mặt hàng
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y">
      <div class="chart-header">
        <span class="chart-title">XK VN YoY theo mặt hàng (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-xk-breakdown"></div>
    </div>
  `);
  const cardXk = c.lastElementChild;
  const xkData = blockB?.xk_breakdown?.data || [];
  const XK_TOP = [26, 25, 22, 19, 12, 23, 70];
  const xkSeries = XK_TOP.map((nid, i) => ({
    name: XK_NAMES[nid] || String(nid),
    data: parseOverviewSeries(xkData, nid),
    color: HC_COLORS[i % HC_COLORS.length],
    ...(nid === 70 ? { dashStyle: 'ShortDash', lineWidth: 2 } : {}),
  })).filter(s => s.data.length);

  function renderXkBreakdown(year) {
    const cut = yearToCutoff(year);
    if (!xkSeries.length) { showEmpty('chart-xk-breakdown', 'Không có dữ liệu'); return; }
    createChart('chart-xk-breakdown', {
      chart: { type: 'line' },
      xAxis: { type: 'datetime' },
      yAxis: {
        title: { text: 'YoY (%)' },
        plotLines: [{ value: 0, color: '#666', width: 1, dashStyle: 'Dot' }],
      },
      tooltip: { valueSuffix: '%', valueDecimals: 1 },
      series: xkSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cut) })),
    });
  }
  initYearButtons(cardXk, renderXkBreakdown);
  renderXkBreakdown('1Y');

  // Chart 3: NK VN YoY breakdown theo nhóm NVL
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y">
      <div class="chart-header">
        <span class="chart-title">NK VN YoY theo nhóm NVL (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-nk-breakdown"></div>
    </div>
  `);
  const cardNk = c.lastElementChild;
  const nkData = blockB?.nk_breakdown?.data || [];
  const NK_TOP = [35, 36, 29, 33, 31, 71];
  const nkSeries = NK_TOP.map((nid, i) => ({
    name: NK_NAMES[nid] || String(nid),
    data: parseOverviewSeries(nkData, nid),
    color: HC_COLORS[i % HC_COLORS.length],
    ...(nid === 71 ? { dashStyle: 'ShortDash', lineWidth: 2 } : {}),
  })).filter(s => s.data.length);

  function renderNkBreakdown(year) {
    const cut = yearToCutoff(year);
    if (!nkSeries.length) { showEmpty('chart-nk-breakdown', 'Không có dữ liệu'); return; }
    createChart('chart-nk-breakdown', {
      chart: { type: 'line' },
      xAxis: { type: 'datetime' },
      yAxis: {
        title: { text: 'YoY (%)' },
        plotLines: [{ value: 0, color: '#666', width: 1, dashStyle: 'Dot' }],
      },
      tooltip: { valueSuffix: '%', valueDecimals: 1 },
      series: nkSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cut) })),
    });
  }
  initYearButtons(cardNk, renderNkBreakdown);
  renderNkBreakdown('1Y');

  // Chart 4: Cán cân thương mại VN & PMI Mỹ
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Cán cân TM VN (Tr USD) & PMI Mỹ</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-trade-balance"></div>
    </div>
  `);
  const cardBal = c.lastElementChild;
  const tradeBal = parseFindicatorSeries(Array.isArray(blockB?.trade_balance) ? blockB.trade_balance : []);
  const pmiUs = parseFindicatorSeries(Array.isArray(blockB?.pmi_us) ? blockB.pmi_us : []);

  function renderTradeBalance(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-trade-balance', {
      yAxis: [
        { title: { text: 'Cán cân TM (Tr USD)' }, plotLines: [{ value: 0, color: '#666', width: 1, dashStyle: 'Dot' }] },
        { title: { text: 'PMI Mỹ (pts)' }, opposite: true, plotLines: [{ value: 50, color: HC_COLORS[1], width: 1, dashStyle: 'ShortDash' }] },
      ],
      series: [
        { name: 'Cán cân TM VN', data: tradeBal.filter(p => p[0] >= cut), color: HC_COLORS[0], type: 'column' },
        { name: 'PMI Mỹ', data: pmiUs.filter(p => p[0] >= cut), color: HC_COLORS[3], yAxis: 1 },
      ],
    });
  }
  initYearButtons(cardBal, renderTradeBalance);
  renderTradeBalance('3Y');

  // Chart 5: PMI VN & FDI Logistics
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PMI VN & FDI Logistics (Tr USD)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-logistics-pmi-fdi"></div>
    </div>
  `);
  const card2 = c.lastElementChild;
  const pmi = parseFindicatorSeries(blockB?.pmi);
  const fdi = parseFindicatorSeries(blockB?.fdi_logistics);

  function render2(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-logistics-pmi-fdi', {
      yAxis: [
        { title: { text: 'PMI (pts)' }, plotLines: [{ value: 50, color: HC_COLORS[1], width: 1, dashStyle: 'ShortDash' }] },
        { title: { text: 'FDI (Tr USD)' }, opposite: true },
      ],
      series: [
        { name: 'PMI SX VN', data: pmi.filter(p => p[0] >= cut), color: HC_COLORS[2] },
        { name: 'FDI Logistics', data: fdi.filter(p => p[0] >= cut), color: HC_COLORS[3], yAxis: 1, type: 'column' },
      ],
    });
  }
  initYearButtons(card2, render2);
  render2('3Y');
}

function renderBlockC(blockC) {
  const c = document.getElementById('block-c-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Doanh thu per-DN</span></div>
      <div class="chart-container" id="chart-logistics-rev"></div>
    </div>
  `);
  showEmpty('chart-logistics-rev', 'DT thực tế — xem BCTC Khối F');
}

function renderBlockD(blockA, blockB) {
  const c = document.getElementById('block-d-charts');
  c.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Container Routes (Shanghai → LA / NY)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-logistics-spread"></div>
    </div>
  `);
  const card = c.lastElementChild;
  const containerRoutes = blockB?.container_routes || [];
  const shLa = parseFindicatorSeries(containerRoutes.filter(r => r.name_id === 691));
  const shNy = parseFindicatorSeries(containerRoutes.filter(r => r.name_id === 692));

  if (!shLa.length && !shNy.length) {
    showEmpty('chart-logistics-spread', 'Không có dữ liệu container routes');
    return;
  }

  function render(year) {
    const cut = yearToCutoff(year);
    createStockChart('chart-logistics-spread', {
      yAxis: [{ title: { text: 'USD/FEU' } }],
      series: [
        { name: 'Shanghai → LA', data: shLa.filter(p => p[0] >= cut), color: HC_COLORS[0] },
        { name: 'Shanghai → NY', data: shNy.filter(p => p[0] >= cut), color: HC_COLORS[1] },
      ].filter(s => s.data.length),
    });
  }
  initYearButtons(card, render);
  render('1Y');
}

function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, roa: 9, leverage: 22 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'roa', 'leverage'],
    pctFields: ['grossMargin', 'roe', 'roa'],
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