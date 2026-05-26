// static/js/sector-steel.js
// Render trang ngành Thép — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorSteel() {
  let data;
  try {
    const res = await fetch('/api/sector/steel/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Thép — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Thép';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Thép — Sector Hub';

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

  // Chart 1: Quặng sắt CME + TQ (dual axis)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Quặng sắt</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="stale-badge" style="display:none"></span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container" id="chart-iron-ore"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const seriesCme = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 82));
  const seriesTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 243));

  function renderIronOre(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-iron-ore', {
      yAxis: [
        { title: { text: 'USD/T' }, labels: { format: '{value:,.0f}' } },
        { title: { text: 'CNY/T' }, labels: { format: '{value:,.0f}' }, opposite: true },
      ],
      series: [
        { name: 'CME (USD/T)', data: seriesCme.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TQ (CNY/T)', data: seriesTq.filter(p => p[0] >= cutoff), color: HC_COLORS[4], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderIronOre);
  renderIronOre('1Y');

  // Chart 2: Than cốc SGX + TQ (dual axis)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Than cốc</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-coal"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const seriesCoalSgx = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 153));
  const seriesCoalTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 158));

  function renderCoal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-coal', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'CNY/T' }, opposite: true },
      ],
      series: [
        { name: 'SGX (USD/T)', data: seriesCoalSgx.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TQ (CNY/T)', data: seriesCoalTq.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card2, renderCoal);
  renderCoal('1Y');

  // Chart 3: HRC CME + TQ (dual axis)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">HRC (Thép cuộn cán nóng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-hrc"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const seriesHrcCme = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 86));
  const seriesHrcTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 161));

  function renderHrc(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-hrc', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'CNY/T' }, opposite: true },
      ],
      series: [
        { name: 'CME (USD/T)', data: seriesHrcCme.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TQ (CNY/T)', data: seriesHrcTq.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card3, renderHrc);
  renderHrc('1Y');

  // Badge stale cho CNY/VND nếu nguồn dữ liệu stale
  if (blockA.cny_vnd?.stale) {
    const badge = card1.querySelector('.stale-badge');
    setStaleBadge(card1, 'warn', 'CNY/VND đến 31/12/2025');
  }
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: Thị phần 4 DN (pie)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Thị phần nội địa</span>
      </div>
      <div class="chart-container chart-sm" id="chart-market-share"></div>
    </div>
  `);

  const shareData = blockB.market_share;
  if (!shareData || !shareData.length) {
    showEmpty('chart-market-share');
  } else {
    const dates = [...new Set(shareData.map(r => r.date))].sort();
    const latestDate = dates[dates.length - 1];
    const latestRows = shareData.filter(r => r.date === latestDate);
    createChart('chart-market-share', {
      chart: { type: 'pie' },
      series: [{
        name: 'Thị phần',
        data: latestRows.map(r => ({ name: r.ticket, y: +(r.value * 100).toFixed(2) })),
      }],
    });
  }

  // Chart: Xuất khẩu thép monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Xuất khẩu thép (Nghìn tấn)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-steel-export"></div>
    </div>
  `);

  const cardExport = container.lastElementChild;
  const exportData = blockB.export_status || [];
  const exportSeriesIds = [
    { nameId: 18, name: 'Tổng XK' },
    { nameId: 19, name: 'Thép cuộn' },
    { nameId: 20, name: 'Thép thanh' },
    { nameId: 21, name: 'Ống thép' },
  ];

  function renderExport(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-steel-export', {
      series: exportSeriesIds.map((s, i) => ({
        name: s.name,
        color: HC_COLORS[i],
        data: parseFindicatorSeries(
          exportData.find(r => r.name_id === s.nameId)?.data || [],
          'date', 'quantity'
        ).filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(cardExport, renderExport);
  renderExport('1Y');

  // Chart: Tồn kho
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tồn kho thép nội địa</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-inventory"></div>
    </div>
  `);

  const cardInv = container.lastElementChild;
  const invData = blockB.inventory || [];

  const INV_SERIES = [
    { nameId: 18, name: 'Thép XD' },
    { nameId: 19, name: 'HRC/CRC' },
    { nameId: 20, name: 'Ống thép' },
    { nameId: 21, name: 'Tôn mạ' },
  ];

  function renderInventory(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-inventory', {
      yAxis: [{ title: { text: 'Nghìn tấn' } }],
      series: INV_SERIES.map((s, i) => {
        const bucket = invData.find(r => r.name_id === s.nameId);
        const rows = bucket ? bucket.data : [];
        return {
          name: s.name,
          color: HC_COLORS[i],
          data: parseFindicatorSeries(rows, 'date', 'quantity').filter(p => p[0] >= cutoff),
        };
      }),
    });
  }
  initYearButtons(cardInv, renderInventory);
  renderInventory('1Y');

  // Chart: Nhập khẩu thép VN theo năm (annual)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Nhập khẩu thép VN (theo năm)</span>
      </div>
      <div class="chart-container" id="chart-import-annual"></div>
    </div>
  `);

  // Dedup by year — lấy row có volume lớn nhất mỗi năm
  const importByYear = new Map();
  for (const r of ((blockB.overview || {}).steelOverviewImportValue || [])) {
    if (!importByYear.has(r.year) || r.volume > importByYear.get(r.year).volume) {
      if (r.volume > 1) importByYear.set(r.year, r);
    }
  }
  const importRows = [...importByYear.values()].sort((a, b) => a.year - b.year);

  if (!importRows.length) {
    showEmpty('chart-import-annual');
  } else {
    createChart('chart-import-annual', {
      chart: { type: 'column' },
      xAxis: { categories: importRows.map(r => r.year) },
      yAxis: [
        { title: { text: 'Triệu USD' }, labels: { format: '{value:,.0f}' } },
        { title: { text: 'Nghìn tấn' }, labels: { format: '{value:,.0f}' }, opposite: true },
      ],
      series: [
        { name: 'Giá trị (Triệu USD)', data: importRows.map(r => +r.value.toFixed(1)), color: HC_COLORS[0], yAxis: 0 },
        { name: 'Khối lượng (Nghìn tấn)', data: importRows.map(r => +r.volume.toFixed(1)), color: HC_COLORS[1], yAxis: 1, type: 'line' },
      ],
    });
  }

  // Chart: Top sản lượng thép thế giới (latest year)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Sản lượng thép thế giới – Top 8</span>
      </div>
      <div class="chart-container chart-sm" id="chart-world-production"></div>
    </div>
  `);

  const mfgData     = ((blockB.overview || {}).steelManufacturingCountryData || []);
  const mfgCountries = ((blockB.overview || {}).steelManufacturingCountry || []);

  if (!mfgData.length) {
    showEmpty('chart-world-production');
  } else {
    const cmap      = Object.fromEntries(mfgCountries.map(c => [c.id, c.country]));
    const latestYr  = Math.max(...mfgData.map(r => r.year));
    const top8      = mfgData.filter(r => r.year === latestYr)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    createChart('chart-world-production', {
      chart: { type: 'bar' },
      xAxis: { categories: top8.map(r => cmap[r.countryId] || r.countryId) },
      yAxis: [{ title: { text: 'Triệu tấn' } }],
      series: [{
        name: `${latestYr} (Triệu tấn)`,
        data: top8.map(r => r.value),
        color: HC_COLORS[2],
      }],
      title: { text: null },
      subtitle: { text: `Năm ${latestYr}`, style: { fontSize: '11px' } },
    });
  }

  // Chart: Thép Trung Quốc — tồn kho & sản xuất
  const cnData = blockB.cn_series || [];
  const CN_META = [
    { nameId: 5, name: 'Tồn kho TQ' },
    { nameId: 2, name: 'Sản xuất thô TQ' },
    { nameId: 6, name: 'Tiêu thụ TQ' },
    { nameId: 1, name: 'Nhập khẩu quặng TQ' },
  ];

  if (cnData.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">Thép Trung Quốc – Tồn kho &amp; Sản xuất (Triệu tấn)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-cn-steel"></div>
      </div>
    `);
    const cardCn = container.lastElementChild;
    function renderCnSteel(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-cn-steel', {
        yAxis: [{ title: { text: 'Triệu tấn' } }],
        series: CN_META.map((s, i) => ({
          name: s.name,
          color: HC_COLORS[i],
          data: parseFindicatorSeries(
            cnData.filter(r => r.name_id === s.nameId), 'date', 'value'
          ).filter(p => p[0] >= cutoff),
        })),
      });
    }
    initYearButtons(cardCn, renderCnSteel);
    renderCnSteel('1Y');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá thép nội địa (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-sell-price"></div>
    </div>
  `);

  const card = container.querySelector('.chart-card');
  const prices = blockC.sell_prices || [];

  // name_id=11 là CB300-D10 nội địa, đơn vị VNĐ/tấn → chia 1000 → VNĐ/kg
  const cb300Data = parseFindicatorSeries(prices.filter(r => r.name_id === 11))
    .map(p => [p[0], p[1] / 1000]);

  function renderSellPrice(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-sell-price', {
      yAxis: [{ title: { text: 'VNĐ/kg' } }],
      series: [{
        name: 'CB300-D10', color: HC_COLORS[0],
        data: cb300Data.filter(p => p[0] >= cutoff),
      }],
    });
  }
  initYearButtons(card, renderSellPrice);
  renderSellPrice('1Y');

  // Chart: CB300 VN (VNĐ/kg) vs Thép thanh TQ (CNY/T) — dual axis
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Thép thanh: VN vs Trung Quốc</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-rebar-compare"></div>
    </div>
  `);

  const cardCmp = container.lastElementChild;
  const rb177Data = parseFindicatorSeries(prices.filter(r => r.name_id === 177)); // CNY/T

  function renderRebarCompare(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-rebar-compare', {
      yAxis: [
        { title: { text: 'VNĐ/kg' }, labels: { format: '{value:,.0f}' } },
        { title: { text: 'CNY/T' }, labels: { format: '{value:,.0f}' }, opposite: true },
      ],
      series: [
        { name: 'CB300 VN (VNĐ/kg)', color: HC_COLORS[0], yAxis: 0, data: cb300Data.filter(p => p[0] >= cutoff) },
        { name: 'Thép thanh TQ (CNY/T)', color: HC_COLORS[1], yAxis: 1, data: rb177Data.filter(p => p[0] >= cutoff) },
      ],
    });
  }
  initYearButtons(cardCmp, renderRebarCompare);
  renderRebarCompare('1Y');
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Spread Thép – NVL</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);

  const cardSpread = container.lastElementChild;

  // CB300 nội địa: name_id=11, VNĐ/tấn
  const seriesCb300 = parseFindicatorSeries(
    (blockC.sell_prices || []).filter(r => r.name_id === 11)
  );
  // Quặng sắt CME: name_id=82, USD/T
  const seriesOre = parseFindicatorSeries(
    (blockA.macro_35 || []).filter(r => r.name_id === 82)
  );
  // Than cốc SGX: name_id=153, USD/T
  const seriesCoal = parseFindicatorSeries(
    (blockA.macro_35 || []).filter(r => r.name_id === 153)
  );
  // USD/VND: name_id=2
  const seriesUsd = parseFindicatorSeries(blockA.usd_vnd || []);

  // Binary search: tìm giá trị gần nhất trong sorted series
  function nearestValue(sorted, ts) {
    if (!sorted.length) return null;
    let lo = 0, hi = sorted.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (sorted[mid][0] <= ts) lo = mid; else hi = mid - 1;
    }
    const a = sorted[lo];
    const b = lo + 1 < sorted.length ? sorted[lo + 1] : null;
    if (!b) return a[1];
    return Math.abs(a[0] - ts) <= Math.abs(b[0] - ts) ? a[1] : b[1];
  }

  // CB300 là weekly, ore/coal/usd là daily → lấy giá gần nhất ±7 ngày
  const spreadSeries = seriesCb300.reduce((acc, [ts, cb300]) => {
    const ore  = nearestValue(seriesOre,  ts);
    const coal = nearestValue(seriesCoal, ts);
    const usd  = nearestValue(seriesUsd,  ts);
    if (ore != null && coal != null && usd != null) {
      const nvl = (ore * 1.6 + coal * 0.5) * usd; // VNĐ/tấn
      acc.push([ts, Math.round(cb300 - nvl)]);
    }
    return acc;
  }, []);

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    const filtered = spreadSeries.filter(p => p[0] >= cutoff);
    if (!filtered.length) { showEmpty('chart-spread', 'Không đủ dữ liệu'); return; }
    createStockChart('chart-spread', {
      yAxis: [{ title: { text: 'VNĐ/tấn' }, labels: { format: '{value:,.0f}' } }],
      series: [{
        name: 'Spread CB300 − NVL',
        color: HC_COLORS[0],
        data: filtered,
      }],
    });
  }
  initYearButtons(cardSpread, renderSpread);
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