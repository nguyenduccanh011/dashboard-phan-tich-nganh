// static/js/sector-transport.js
// Render trang ngành Vận tải biển — 6 khối A–F
// nameId=339 (Aframax) / 340 (Suezmax) có data; 322/341 đã loại bỏ

(async function SectorTransport() {
  let data;
  try {
    const res = await fetch('/api/sector/transport/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Vận tải biển — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Vận tải biển';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Vận tải biển — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderMacroTransport(data.macro_transport);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  window.window.renderBlockG(data.block_g, data.tickers, {});
})();

// nameId → label mapping cho freight indices
const FREIGHT_LABELS = {
  679:  { name: 'BDTI (dầu thô)',         group: 'tanker',    color: HC_COLORS[0] },
  680:  { name: 'BCTI (dầu sản phẩm)',    group: 'tanker',    color: HC_COLORS[1] },
  681:  { name: 'BDI',                    group: 'dry_bulk',  color: HC_COLORS[2] },
  688:  { name: 'WCI (container)',        group: 'container', color: HC_COLORS[3] },
  308:  { name: 'Supramax',              group: 'dry_bulk',  color: HC_COLORS[4] },
  309:  { name: 'Capesize',              group: 'dry_bulk',  color: HC_COLORS[0] },
  310:  { name: 'Panamax',               group: 'dry_bulk',  color: HC_COLORS[1] },
  311:  { name: 'Handysize',             group: 'dry_bulk',  color: HC_COLORS[2] },
  339:  { name: 'Aframax (USD/ngày)',     group: 'tanker',    color: HC_COLORS[3] },
  340:  { name: 'Suezmax (USD/ngày)',     group: 'tanker',    color: HC_COLORS[4] },
  689:  { name: 'SCFI→Rotterdam',        group: 'container', color: HC_COLORS[0] },
  690:  { name: 'SCFI→Genoa',            group: 'container', color: HC_COLORS[1] },
  691:  { name: 'SCFI→LA',               group: 'container', color: HC_COLORS[2] },
  692:  { name: 'SCFI→NY',               group: 'container', color: HC_COLORS[3] },
  693:  { name: 'Rotterdam→Shanghai',    group: 'container', color: HC_COLORS[4] },
  694:  { name: 'LA→Shanghai',           group: 'container', color: HC_COLORS[0] },
  695:  { name: 'NY→Rotterdam',          group: 'container', color: HC_COLORS[1] },
  696:  { name: 'Rotterdam→NY',          group: 'container', color: HC_COLORS[2] },
  312:  { name: 'Gas VLGC (USD/tháng)',  group: 'gas',       color: HC_COLORS[0] },
  313:  { name: 'Gas LGC',               group: 'gas',       color: HC_COLORS[1] },
  314:  { name: 'Gas MGC',               group: 'gas',       color: HC_COLORS[2] },
  315:  { name: 'Gas HDY SR',            group: 'gas',       color: HC_COLORS[3] },
  316:  { name: 'Gas ETH',               group: 'gas',       color: HC_COLORS[4] },
  317:  { name: 'Gas SR',                group: 'gas',       color: HC_COLORS[0] },
  318:  { name: 'Gas COASTER Asia',      group: 'gas',       color: HC_COLORS[1] },
  319:  { name: 'Gas COASTER Europe',    group: 'gas',       color: HC_COLORS[2] },
};


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const oilRows = blockA?.oil || [];

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá dầu Brent & WTI</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oil-price"></div>
    </div>
  `);
  const card = container.querySelector('[id="chart-oil-price"]').closest('.chart-card');
  const brentData = parseFindicatorSeries(oilRows.filter(r => r.nameId === 65));
  const wtiData   = parseFindicatorSeries(oilRows.filter(r => r.nameId === 67));

  function renderOil(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oil-price', {
      yAxis: [{ title: { text: 'USD/Bbl' } }],
      series: [
        { name: 'Brent', data: brentData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'WTI',   data: wtiData.filter(p => p[0] >= cutoff),   color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card, renderOil);
  renderOil('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');
  const freightRows = blockB?.freight || [];

  if (!freightRows.length) {
    container.insertAdjacentHTML('beforeend', '<p class="text-muted">Không có dữ liệu freight index</p>');
    return;
  }

  // Nhóm theo group
  const groups = {
    dry_bulk:  { label: 'Dry Bulk',      nameIds: [681, 309, 310, 308, 311] },
    tanker:    { label: 'Tanker',         nameIds: [679, 680, 339, 340] },
    container: { label: 'Container SCFI', nameIds: [688, 689, 690, 691, 692] },
    gas:       { label: 'Gas Tanker',     nameIds: [312, 313, 314, 315, 316, 317, 318, 319] },
  };

  Object.entries(groups).forEach(([groupKey, groupMeta]) => {
    const chartId = `chart-freight-${groupKey}`;
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">Freight Index — ${groupMeta.label}</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="${chartId}"></div>
      </div>
    `);
    const card = container.querySelector(`[id="${chartId}"]`).closest('.chart-card');

    const seriesData = groupMeta.nameIds
      .filter(nid => FREIGHT_LABELS[nid])
      .map(nid => {
        const meta = FREIGHT_LABELS[nid];
        return {
          name: meta.name,
          data: parseFindicatorSeries(freightRows.filter(r => r.nameId === nid)),
          color: meta.color,
        };
      })
      .filter(s => s.data.length > 0);

    function renderFreight(year) {
      const cutoff = yearToCutoff(year);
      createStockChart(chartId, {
        yAxis: [{ title: { text: groupKey === 'gas' ? 'USD/tháng' : 'Points / USD/ngày' } }],
        series: seriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
      });
    }
    initYearButtons(card, renderFreight);
    renderFreight('1Y');
  });

  // Các routes container chi tiết
  const routeChartId = 'chart-container-routes';
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Container Routes chi tiết</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="${routeChartId}"></div>
    </div>
  `);
  const routeCard = container.querySelector(`[id="${routeChartId}"]`).closest('.chart-card');
  const routeNameIds = [689, 690, 691, 692, 693, 694, 695, 696];
  const routeSeriesData = routeNameIds.map((nid, i) => ({
    name: FREIGHT_LABELS[nid]?.name || `Route ${nid}`,
    data: parseFindicatorSeries(freightRows.filter(r => r.nameId === nid)),
    color: HC_COLORS[i % HC_COLORS.length],
  })).filter(s => s.data.length > 0);

  function renderRoutes(year) {
    const cutoff = yearToCutoff(year);
    createStockChart(routeChartId, {
      yAxis: [{ title: { text: 'USD/FEU' } }],
      series: routeSeriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(routeCard, renderRoutes);
  renderRoutes('1Y');
}


function renderMacroTransport(macro) {
  if (!macro) return;
  const container = document.getElementById('block-b-charts');

  // XNK Mỹ + TQ (proxy volume cảng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XNK Mỹ & TQ (proxy volume)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-trade-volume"></div>
    </div>
  `);
  const tvCard = container.querySelector('[id="chart-trade-volume"]').closest('.chart-card');
  const usTradeData = parseFindicatorSeries(
    Array.isArray(macro.us_trade) ? macro.us_trade : (macro.us_trade?.data || [])
  );
  const cnTradeData = parseFindicatorSeries(
    Array.isArray(macro.cn_trade) ? macro.cn_trade : (macro.cn_trade?.data || [])
  );
  function renderTrade(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-trade-volume', {
      yAxis: [
        { title: { text: 'Tỷ USD (Mỹ)' } },
        { title: { text: 'Tỷ USD (TQ)' }, opposite: true },
      ],
      series: [
        { name: 'XNK Mỹ', data: usTradeData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'XNK TQ', data: cnTradeData.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(tvCard, renderTrade);
  renderTrade('1Y');

  // XK VN tổng (proxy throughput cảng VN)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK VN tổng (proxy cảng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-vn-export"></div>
    </div>
  `);
  const vnExpCard = container.querySelector('[id="chart-vn-export"]').closest('.chart-card');
  const vnExpData = parseFindicatorSeries(macro?.vn_export || [], 'date', 'valueUnit');
  function renderVnExport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-vn-export', {
      yAxis: [{ title: { text: 'Triệu USD' } }],
      series: [{ name: 'XK VN', data: vnExpData.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(vnExpCard, renderVnExport);
  renderVnExport('1Y');
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, peFwd: 154, grossMargin: 2, roe: 8, dtGrowth: 163 },
    columns: ['marketCap', 'pe', 'pb', 'peFwd', 'grossMargin', 'roe', 'dtGrowth'],
    pctFields: ['grossMargin', 'roe', 'dtGrowth'],
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
