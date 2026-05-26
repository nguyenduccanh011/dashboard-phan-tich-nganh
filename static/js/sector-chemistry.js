// static/js/sector-chemistry.js
// Render trang ngành Phân bón / Hóa chất — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorChemistry() {
  let data;
  try {
    const res = await fetch('/api/sector/chemistry/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Phân bón / Hóa chất — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Phân bón / Hóa chất';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Phân bón / Hóa chất — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b, data.block_c);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c, data.block_d);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  window.window.window.renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = Array.isArray(blockA.macro_35) ? blockA.macro_35 : [];

  const byNameId = (id) => parseFindicatorSeries(macro35.filter(r => r.name_id === id));

  // Chart 1: Khí TN Henry Hub (66) — giá đầu vào chính DPM/DCM
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Khí TN Henry Hub & Than ICE</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gas-coal"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const gasData = byNameId(66);
  const coalData = byNameId(68);

  function renderGasCoal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gas-coal', {
      yAxis: [
        { title: { text: 'USD/MMBtu' } },
        { title: { text: 'USD/T' }, opposite: true },
      ],
      series: [
        { name: 'Henry Hub (USD/MMBtu)', data: gasData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Than ICE (USD/T)', data: coalData.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderGasCoal);
  renderGasCoal('1Y');

  // Chart 2: Lưu Huỳnh (182), Axit Sulfuric (253), Phốt pho vàng (213)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Hóa chất cơ bản TQ (Lưu Huỳnh / H₂SO₄ / P vàng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-chemicals"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const sulfurData = byNameId(182);
  const h2so4Data = byNameId(253);
  const phosphorData = byNameId(213);

  function renderChemicals(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-chemicals', {
      series: [
        { name: 'Lưu Huỳnh TQ', data: sulfurData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Axit Sulfuric TQ', data: h2so4Data.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Phốt pho vàng TQ', data: phosphorData.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card2, renderChemicals);
  renderChemicals('1Y');

  // Chart 3: Xút NaOH TQ Spot (nameId=243, CNY/T)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Xút (NaOH) TQ Spot (CNY/T)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-naoh"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const naohData = byNameId(243);

  function renderNaoh(year) {
    const cutoff = yearToCutoff(year);
    if (!naohData.length) { showEmpty('chart-naoh', 'Không có dữ liệu NaOH TQ'); return; }
    createStockChart('chart-naoh', {
      series: [{ name: 'NaOH TQ (CNY/T)', data: naohData.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
    });
  }
  initYearButtons(card3, renderNaoh);
  renderNaoh('1Y');
}


function renderBlockB(blockB, blockC) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Giá phân bón VN — dùng macro_35 nameIds 12,13,29,30 từ blockC
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá phân bón VN (VNĐ/kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fertilizer-price"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const prices = Array.isArray(blockC.prices) ? blockC.prices : [];
  const byId = (id) => parseFindicatorSeries(prices.filter(r => r.name_id === id));

  const ureaPM   = byId(12);
  const ureaCM   = byId(13);
  const dapDV    = byId(29);
  const kaliPM   = byId(30);

  function renderFertPrice(year) {
    const cutoff = yearToCutoff(year);
    const series = [
      { name: 'Urea Phú Mỹ', data: ureaPM.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
      { name: 'Urea Cà Mau',  data: ureaCM.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      { name: 'DAP Đình Vũ',  data: dapDV.filter(p => p[0] >= cutoff),  color: HC_COLORS[2] },
      { name: 'Kali Phú Mỹ',  data: kaliPM.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
    ].filter(s => s.data.length > 0);

    if (!series.length) { showEmpty('chart-fertilizer-price', 'Không có dữ liệu'); return; }
    createStockChart('chart-fertilizer-price', { series });
  }
  initYearButtons(card1, renderFertPrice);
  renderFertPrice('1Y');

  // Chart 2: Cơ cấu SX phân bón Urea (gas vs coal) — hai pie side-by-side
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Cơ cấu SX phân bón Urea (gas/coal)</span></div>
      <div style="display:flex;gap:8px;">
        <div style="flex:1">
          <div style="text-align:center;font-size:12px;color:#aaa;margin-bottom:4px">Urea từ khí</div>
          <div class="chart-container chart-sm" id="chart-urea-gas-struct"></div>
        </div>
        <div style="flex:1">
          <div style="text-align:center;font-size:12px;color:#aaa;margin-bottom:4px">Urea từ than</div>
          <div class="chart-container chart-sm" id="chart-urea-coal-struct"></div>
        </div>
      </div>
    </div>
  `);

  const fertData = blockB.fertilizer_data;
  const ureaGas  = fertData?.ureaGas  || [];
  const ureaCoal = fertData?.ureaCoal || [];

  if (!ureaGas.length && !ureaCoal.length) {
    showEmpty('chart-urea-gas-struct');
    showEmpty('chart-urea-coal-struct');
  } else {
    if (ureaGas.length) {
      createChart('chart-urea-gas-struct', {
        chart: { type: 'pie' },
        series: [{ name: 'Cơ cấu', data: ureaGas.map(d => ({ name: d.name, y: +(d.valuePercent * 100).toFixed(1) })) }],
      });
    } else showEmpty('chart-urea-gas-struct');

    if (ureaCoal.length) {
      createChart('chart-urea-coal-struct', {
        chart: { type: 'pie' },
        series: [{ name: 'Cơ cấu', data: ureaCoal.map(d => ({ name: d.name, y: +(d.valuePercent * 100).toFixed(1) })) }],
      });
    } else showEmpty('chart-urea-coal-struct');
  }

  // Chart 3: Cơ cấu SX Xút (Chlor-Alkali) — costStructure pie
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Cơ cấu SX Xút (Chlor-Alkali)</span></div>
      <div class="chart-container chart-sm" id="chart-caustic-struct"></div>
    </div>
  `);

  const causticData = blockB.caustic_soda_data;
  const costStruct  = causticData?.costStructure || [];

  if (!costStruct.length) {
    showEmpty('chart-caustic-struct');
  } else {
    createChart('chart-caustic-struct', {
      chart: { type: 'pie' },
      series: [{ name: 'Chi phí', data: costStruct.map(d => ({ name: d.name, y: +(d.value * 100).toFixed(1) })) }],
    });
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  const prices = Array.isArray(blockC.prices) ? blockC.prices : [];
  const byNameId = (id) => parseFindicatorSeries(prices.filter(r => r.name_id === id));

  // Chart 1: Giá Urea (CME USD, TQ USD, Phú Mỹ VNĐ, Cà Mau VNĐ)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá Urea (quốc tế & VN)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-urea-price"></div>
    </div>
  `);

  const card1 = container.lastElementChild;

  function renderUrea(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-urea-price', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'VNĐ/kg' }, opposite: true },
      ],
      series: [
        { name: 'Urea CME (USD/T)',      data: byNameId(50).filter(p => p[0] >= cutoff),  color: HC_COLORS[0] },
        { name: 'Urea TQ (USD/T)',       data: byNameId(190).filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Urea Phú Mỹ (VNĐ/kg)', data: byNameId(12).filter(p => p[0] >= cutoff),  color: HC_COLORS[2], yAxis: 1 },
        { name: 'Urea Cà Mau (VNĐ/kg)', data: byNameId(13).filter(p => p[0] >= cutoff),  color: HC_COLORS[3], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderUrea);
  renderUrea('1Y');

  // Chart 2: Giá DAP (TQ USD, Đình Vũ VNĐ) + Kali Phú Mỹ
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá DAP & Kali</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-dap-kali"></div>
    </div>
  `);

  const card2 = container.lastElementChild;

  function renderDapKali(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-dap-kali', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'VNĐ/kg' }, opposite: true },
      ],
      series: [
        { name: 'DAP TQ (USD/T)',       data: byNameId(156).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'DAP Đình Vũ (VNĐ/kg)', data: byNameId(29).filter(p => p[0] >= cutoff),  color: HC_COLORS[2], yAxis: 1 },
        { name: 'Kali Phú Mỹ (VNĐ/kg)', data: byNameId(30).filter(p => p[0] >= cutoff),  color: HC_COLORS[3], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card2, renderDapKali);
  renderDapKali('1Y');
}


// Build a sorted lookup array [{ts, val}] for fast nearest-date search
function _buildLookup(series) {
  return series.map(([ts, val]) => ({ ts, val })).sort((a, b) => a.ts - b.ts);
}

function _lookupNearest(lookup, ts) {
  if (!lookup.length) return null;
  let lo = 0, hi = lookup.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lookup[mid].ts < ts) lo = mid + 1; else hi = mid;
  }
  if (lo > 0 && Math.abs(lookup[lo - 1].ts - ts) < Math.abs(lookup[lo].ts - ts)) lo--;
  return lookup[lo].val;
}

function renderBlockD(blockA, blockC, blockD) {
  const container = document.getElementById('block-d-charts');

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Spread Urea – Khí đầu vào</span>
        <div class="year-btns"></div>
      </div>
      <div style="font-size:11px;color:#888;padding:0 12px 6px">
        Spread = Giá Urea Phú Mỹ (VNĐ/kg × 1000 → VNĐ/T) − Chi phí khí (Henry Hub × 28 MMBtu/T × USD/VND)
      </div>
      <div class="chart-container" id="chart-urea-spread"></div>
    </div>
  `);

  const card = container.lastElementChild;

  const macro35   = Array.isArray(blockA.macro_35) ? blockA.macro_35 : [];
  const prices    = Array.isArray(blockC.prices)   ? blockC.prices   : [];
  const usdvndRaw = Array.isArray(blockD?.usdvnd)  ? blockD.usdvnd   : [];

  const ureaPMSeries = parseFindicatorSeries(prices.filter(r => r.name_id === 12));
  const hhSeries     = parseFindicatorSeries(macro35.filter(r => r.name_id === 66));
  const usdvndSeries = parseFindicatorSeries(usdvndRaw);

  const hhLookup     = _buildLookup(hhSeries);
  const usdvndLookup = _buildLookup(usdvndSeries);

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    const spreadData = [];

    for (const [ts, ureaPMkg] of ureaPMSeries) {
      if (ts < cutoff) continue;
      const hhPrice   = _lookupNearest(hhLookup, ts);
      const usdvnd    = _lookupNearest(usdvndLookup, ts);
      if (hhPrice == null || usdvnd == null) continue;

      const ureaPMvnd = ureaPMkg * 1000;                // VNĐ/T
      const gasCost   = hhPrice * 28 * usdvnd;          // USD/MMBtu × 28 MMBtu/T × VNĐ/USD
      const spread    = ureaPMvnd - gasCost;
      spreadData.push([ts, Math.round(spread)]);
    }

    if (!spreadData.length) {
      showEmpty('chart-urea-spread', 'Không đủ dữ liệu tính spread');
      return;
    }

    createStockChart('chart-urea-spread', {
      yAxis: [{ title: { text: 'VNĐ/T' } }],
      series: [{
        name: 'Spread Urea PM − Khí',
        data: spreadData,
        color: HC_COLORS[0],
        zones: [{ value: 0, color: '#ef4444' }, { color: HC_COLORS[0] }],
      }],
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
