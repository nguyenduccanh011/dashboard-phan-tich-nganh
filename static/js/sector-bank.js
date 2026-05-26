// static/js/sector-bank.js
// Render trang ngành Ngân hàng — 6 khối A–F + bank-specific charts
// corpType=1: PE=89, PB=90, ROE=67, ROA=68

(async function SectorBank() {
  let data;
  try {
    const res = await fetch('/api/sector/bank/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Ngân hàng — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Ngân hàng';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Ngân hàng — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, { pe_id: 89, pb_id: 90 });
  renderBankCharts(data.bank_charts);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Lãi suất LNH (WiChart — qua đêm/1W/2W)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất LNH</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-lnh"></div>
    </div>
  `);
  const lnhCard = container.querySelector('[id="chart-lnh"]').closest('.chart-card');
  const lnhSeries = blockA.lnh?.chart?.series || [];
  function renderLnh(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-lnh', {
      yAxis: [{ title: { text: '%/năm' }, labels: { format: '{value:.2f}%' } }],
      series: (lnhSeries || []).map((s, i) => ({
        name: s.name || `Series ${i+1}`,
        data: (s.data || []).filter(p => p[0] >= cutoff),
        color: HC_COLORS[i],
      })),
    });
  }
  initYearButtons(lnhCard, renderLnh);
  renderLnh('1Y');

  // Chart 2: Lãi suất huy động (macroItemId=48, 10 kỳ hạn)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất huy động</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-deposit-rate"></div>
    </div>
  `);
  const depCard = container.querySelector('[id="chart-deposit-rate"]').closest('.chart-card');
  const depRows = blockA.deposit_rate || [];
  const depNameIds = [...new Set(depRows.map(r => r.name_id))];
  const depSeriesData = depNameIds.map((nid, i) => ({
    name: depRows.find(r => r.name_id === nid)?.name || `Kỳ hạn ${nid}`,
    data: parseFindicatorSeries(depRows.filter(r => r.name_id === nid)),
    color: HC_COLORS[i % HC_COLORS.length],
  }));
  function renderDepositRate(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-deposit-rate', {
      yAxis: [{ title: { text: '%/năm' } }],
      series: depSeriesData.map(s => ({
        ...s, data: s.data.filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(depCard, renderDepositRate);
  renderDepositRate('1Y');

  // Chart 3: FED Rate + USD/VND (dual axis)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">FED Rate & USD/VND</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-fed-usd"></div>
    </div>
  `);
  const fedCard = container.querySelector('[id="chart-fed-usd"]').closest('.chart-card');
  const fedData = parseFindicatorSeries(blockA.fed_rate || []);
  const usdData = parseFindicatorSeries(blockA.usd_vnd || []);
  function renderFedUsd(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-fed-usd', {
      yAxis: [
        { title: { text: 'FED Rate (%)' } },
        { title: { text: 'USD/VND' }, opposite: true },
      ],
      series: [
        { name: 'FED Rate', data: fedData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'USD/VND', data: usdData.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(fedCard, renderFedUsd);
  renderFedUsd('1Y');

  // Chart 4: TPCP VN 5Y/10Y + US reference
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lợi suất TPCP</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-tpcp"></div>
    </div>
  `);
  const tpcpCard = container.querySelector('[id="chart-tpcp"]').closest('.chart-card');
  const tpcpRows = blockA.tpcp || [];
  const tpcpMap = [
    { id: 8, name: 'VN 5Y',  color: HC_COLORS[0] },
    { id: 9, name: 'VN 10Y', color: HC_COLORS[1] },
    { id: 5, name: 'US 2Y',  color: HC_COLORS[2] },
    { id: 3, name: 'US 10Y', color: HC_COLORS[3] },
  ];
  const tpcpSeriesData = tpcpMap.map(t => ({
    name: t.name, color: t.color,
    data: parseFindicatorSeries(tpcpRows.filter(r => r.name_id === t.id)),
  }));
  function renderTpcp(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-tpcp', {
      yAxis: [{ title: { text: '%' } }],
      series: tpcpSeriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(tpcpCard, renderTpcp);
  renderTpcp('1Y');

  // Chart 5: OMO NHNN (stale badge: dừng 31/12/2025)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">OMO NHNN</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="stale-badge" style="display:none"></span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container" id="chart-omo"></div>
    </div>
  `);
  const omoCard = container.querySelector('[id="chart-omo"]').closest('.chart-card');
  if (blockA.omo_stale) {
    setStaleBadge(omoCard, 'warn', 'Dữ liệu dừng 31/12/2025');
  }
  const omoRows = blockA.omo || [];
  const omoNameIds = [...new Set(omoRows.map(r => r.name_id))];
  const omoSeriesData = omoNameIds.map((nid, i) => ({
    name: omoRows.find(r => r.name_id === nid)?.name || `OMO ${nid}`,
    data: parseFindicatorSeries(omoRows.filter(r => r.name_id === nid)),
    color: HC_COLORS[i % HC_COLORS.length],
  }));
  function renderOmo(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-omo', {
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: omoSeriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(omoCard, renderOmo);
  renderOmo('1Y');

  // Chart 6: Dự trữ ngoại hối
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Dự trữ ngoại hối VN</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-forex-reserve"></div>
    </div>
  `);
  const fxCard = container.querySelector('[id="chart-forex-reserve"]').closest('.chart-card');
  setStaleBadge(fxCard, 'warn', 'Dữ liệu đến 12/2024');
  const fxData = parseFindicatorSeries(blockA.forex_reserve || []);
  function renderForexReserve(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-forex-reserve', {
      yAxis: [{ title: { text: 'Triệu USD' } }],
      series: [{ name: 'Dự trữ ngoại hối', data: fxData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(fxCard, renderForexReserve);
  renderForexReserve('3Y');

  // Chart 7: DXY Index
  const dxyRaw = blockA.dxy;
  if (dxyRaw && (Array.isArray(dxyRaw[0]) ? dxyRaw[0].length : dxyRaw.length)) {
    const dxyRows = Array.isArray(dxyRaw[0]) ? dxyRaw[0] : dxyRaw;
    const dxyData = parseFindicatorSeries(dxyRows);
    if (dxyData.length) {
      container.insertAdjacentHTML('beforeend', `
        <div class="chart-card" data-year-options="1Y,3Y,5Y">
          <div class="chart-header">
            <span class="chart-title">DXY Index (USD Index)</span>
            <div class="year-btns"></div>
          </div>
          <div class="chart-container" id="chart-dxy"></div>
        </div>
      `);
      const dxyCard = container.lastElementChild;
      function renderDxy(year) {
        const cutoff = yearToCutoff(year);
        createStockChart('chart-dxy', {
          yAxis: [{ title: { text: 'pts' } }],
          series: [{ name: 'DXY', data: dxyData.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
        });
      }
      initYearButtons(dxyCard, renderDxy);
      renderDxy('1Y');
    }
  }
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: Tăng trưởng tín dụng hệ thống
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tín dụng toàn hệ thống</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-credit-system"></div>
    </div>
  `);
  const csCard = container.querySelector('[id="chart-credit-system"]').closest('.chart-card');
  const csRows = blockB.credit_system || [];
  const csValue = parseFindicatorSeries(csRows.filter(r => r.valueType === 'value' || !r.valueType));
  const csYoy = parseFindicatorSeries(csRows.filter(r => r.valueType === 'yoy'));
  function renderCreditSystem(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-credit-system', {
      yAxis: [
        { title: { text: 'Tỷ VNĐ' } },
        { title: { text: 'YoY %' }, opposite: true, labels: { format: '{value:.1f}%' } },
      ],
      series: [
        { name: 'Tín dụng (Tỷ VNĐ)', type: 'column', data: csValue.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'YoY %', type: 'line', data: csYoy.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(csCard, renderCreditSystem);
  renderCreditSystem('1Y');

  // Chart: Cung tiền M2
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Cung tiền M2 YoY</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-m2"></div>
    </div>
  `);
  const m2Card = container.querySelector('[id="chart-m2"]').closest('.chart-card');
  const m2Data = parseFindicatorSeries(blockB.m2 || []);
  function renderM2(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-m2', {
      yAxis: [{ title: { text: 'YoY %' }, labels: { format: '{value:.2f}%' } }],
      series: [{ name: 'M2 YoY', data: m2Data.filter(p => p[0] >= cutoff), color: HC_COLORS[2] }],
    });
  }
  initYearButtons(m2Card, renderM2);
  renderM2('1Y');

  // Chart: Cán cân thanh toán
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Cán cân thanh toán</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-bop"></div>
    </div>
  `);
  const bopCard = container.querySelector('[id="chart-bop"]').closest('.chart-card');
  const bopRows = blockB.balance_of_payments || [];
  if (!bopRows.length) {
    showEmpty('chart-bop', 'Chưa có dữ liệu cán cân thanh toán');
  } else {
    const bopVanglai = parseFindicatorSeries(bopRows.filter(r => r.name_id === 1));
    const bopTongthe = parseFindicatorSeries(bopRows.filter(r => r.name_id === 40));
    function renderBop(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-bop', {
        yAxis: [{ title: { text: 'Triệu USD' } }],
        series: [
          { name: 'Vãng lai', data: bopVanglai.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
          { name: 'Tổng thể', data: bopTongthe.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        ],
      });
    }
    initYearButtons(bopCard, renderBop);
    renderBop('1Y');
  }

  // Chart: CASA/NPL snapshot per-bank (bar)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">CASA / NPL snapshot</span>
      </div>
      <div class="chart-container chart-lg" id="chart-bank-overview"></div>
    </div>
  `);
  const overviewData = blockB.overview;
  if (!overviewData) { showEmpty('chart-bank-overview'); return; }
  // overview is {casaAndCof: [{ticket,name_legend,value},...], yeaAndNpl: [...], crWRA: [...]}
  const casaRows = (overviewData.casaAndCof || []).filter(r => r.name_legend === 'CASA');
  const nplRows  = (overviewData.yeaAndNpl  || []).filter(r => r.name_legend === 'NPL');
  const tickets  = casaRows.map(r => r.ticket);
  if (tickets.length) {
    const getVal = (rows, ticket) => { const r = rows.find(x => x.ticket === ticket); return r ? +(r.value * 100).toFixed(2) : null; };
    createChart('chart-bank-overview', {
      chart: { type: 'bar' },
      xAxis: { categories: tickets },
      yAxis: [{ title: { text: '%' }, labels: { format: '{value:.1f}%' } }],
      series: [
        { name: 'CASA %', data: tickets.map(t => getVal(casaRows, t)), color: HC_COLORS[0] },
        { name: 'NPL %',  data: tickets.map(t => getVal(nplRows,  t)), color: HC_COLORS[3] },
      ],
    });
  } else {
    showEmpty('chart-bank-overview');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // NIM per-bank (bar chart — latest TRAILING)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">NIM / CASA / CoF / LDR</span>
      </div>
      <div class="chart-container chart-lg" id="chart-nim-per-bank"></div>
    </div>
  `);

  const tickers = Object.keys(blockC || {});
  if (!tickers.length) { showEmpty('chart-nim-per-bank'); return; }

  const getVal = (rows, accId) => {
    const r = (rows || []).find(x => x.accountId === accId);
    return r?.value ?? null;
  };
  const getRows = (t) => getTickerRows(blockC, t);
  const pct100 = v => v != null ? +(v * 100).toFixed(4) : null;

  const nimData   = tickers.map(t => pct100(getVal(getRows(t), 60)));
  const casaData  = tickers.map(t => pct100(getVal(getRows(t), 57)));
  const cofData   = tickers.map(t => pct100(getVal(getRows(t), 58)));
  const ldrData   = tickers.map(t => pct100(getVal(getRows(t), 75)));

  createChart('chart-nim-per-bank', {
    chart: { type: 'bar' },
    xAxis: { categories: tickers },
    yAxis: [{ title: { text: '%' }, labels: { format: '{value:.2f}%' } }],
    series: [
      { name: 'NIM', data: nimData, color: HC_COLORS[0] },
      { name: 'CASA', data: casaData, color: HC_COLORS[1] },
      { name: 'CoF', data: cofData, color: HC_COLORS[3] },
      { name: 'LDR', data: ldrData, color: HC_COLORS[2] },
    ],
  });
}


function renderBlockD(blockC) {
  // NIM Spread = NIM − CoF per bank
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">NIM Spread (NIM − CoF)</span></div>
      <div class="chart-container" id="chart-nim-spread"></div>
    </div>
  `);

  const tickers = Object.keys(blockC || {});
  if (!tickers.length) { showEmpty('chart-nim-spread'); return; }

  const getVal = (rows, accId) => {
    const r = (rows || []).find(x => x.accountId === accId);
    return r?.value ?? null;
  };
  const getRows = (t) => getTickerRows(blockC, t);

  const spreadData = tickers.map(t => {
    const nim = getVal(getRows(t), 60);
    const cof = getVal(getRows(t), 58);
    return (nim != null && cof != null) ? parseFloat(((nim - cof) * 100).toFixed(3)) : null;
  });

  createChart('chart-nim-spread', {
    chart: { type: 'bar' },
    xAxis: { categories: tickers },
    yAxis: [{ title: { text: 'NIM − CoF (%)' } }],
    series: [{ name: 'NIM Spread', data: spreadData, color: HC_COLORS[0] }],
  });
}


function renderBlockE(blockE) {
  renderValuationTable('block-e-table', blockE, {
    accountMap: { vonHoa: 85, pe: 89, pb: 90, roe: 67, roa: 68, nim: 60, npl: 62, casa: 57, cir: 159, llcr: 64 },
    columns: ['vonHoa', 'pe', 'pb', 'roe', 'roa', 'nim', 'npl', 'casa', 'cir', 'llcr'],
    pctFields: ['roe', 'roa', 'nim', 'npl', 'casa', 'cir'],
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
    renderBctcChart(`chart-bctc-${ticker}`, ticker, blockF, {
      series: [
        { name: 'NII',      accId: 1,  type: 'column', color: HC_COLORS[0] },
        { name: 'Tổng TOI', accId: 46, type: 'column', color: HC_COLORS[1] },
        { name: 'Dự phòng', accId: 16, type: 'column', color: HC_COLORS[3] },
        { name: 'LNTT',     accId: 17, type: 'line',   color: HC_COLORS[2] },
        { name: 'LNST',     accId: 21, type: 'line',   color: HC_COLORS[4] },
      ],
    });
  });
}


function renderBankCharts(bankCharts) {
  if (!bankCharts) return;

  // Render credit growth snapshot (bar per bank)
  const creditGrowth = bankCharts.credit_growth;
  if (creditGrowth) {
    const container = document.getElementById('block-b-charts');
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">Tăng trưởng tín dụng vs trần NHNN</span></div>
        <div class="chart-container chart-lg" id="chart-credit-growth-bar"></div>
      </div>
    `);
    const banks = Array.isArray(creditGrowth) ? creditGrowth : (creditGrowth?.data || []);
    if (banks.length) {
      createChart('chart-credit-growth-bar', {
        chart: { type: 'bar' },
        xAxis: { categories: banks.map(b => b.ticket || b.name) },
        yAxis: [{ title: { text: '%' } }],
        series: [
          { name: 'Tăng trưởng TT', data: banks.map(b => b.creditGrowth || b.value || null), color: HC_COLORS[0] },
          { name: 'Trần NHNN', data: banks.map(b => b.limit || b.cap || null), color: HC_COLORS[3] },
        ],
      });
    }
  }

  // Per-bank detail — VCB default, có thể mở rộng với dropdown
  const perBank = bankCharts.per_bank || {};
  const defaultTicker = Object.keys(perBank)[0];
  if (!defaultTicker) return;

  _renderPerBankCharts(defaultTicker, perBank[defaultTicker]);
}


function _renderPerBankCharts(ticker, bankData) {
  if (!bankData) return;
  const container = document.getElementById('block-c-charts');

  // LNST per quý
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">LNST ${ticker} theo quý</span></div>
      <div class="chart-container" id="chart-pat-${ticker}"></div>
    </div>
  `);
  const patRows = bankData.profit_after_tax || [];
  if (patRows.length) {
    const periods = [...new Set(patRows.map(r => r.period || `${r.year}Q${r.quarter}`))].sort().slice(-8);
    createChart(`chart-pat-${ticker}`, {
      chart: { type: 'column' },
      xAxis: { categories: periods },
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: [{
        name: `LNST ${ticker}`,
        data: periods.map(p => { const r = patRows.find(x => (x.period || `${x.year}Q${x.quarter}`) === p); return r?.value ?? null; }),
        color: HC_COLORS[0],
      }],
    });
  } else {
    showEmpty(`chart-pat-${ticker}`);
  }

  // Nợ xấu ratio
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Nợ xấu ${ticker}</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-bad-debt-${ticker}"></div>
    </div>
  `);
  const bdCard = container.querySelector(`[id="chart-bad-debt-${ticker}"]`).closest('.chart-card');
  const bdRows = bankData.bad_debt_ratio || [];
  const bdTypes = [...new Set(bdRows.map(r => r.type))];
  const bdSeriesData = bdTypes.map((t, i) => ({
    name: t === 1 ? 'Nhóm 1 (Tốt)' : 'Nhóm 2+ (Xấu)',
    data: parseFindicatorSeries(bdRows.filter(r => r.type === t)),
    color: HC_COLORS[i],
  }));
  function renderBadDebt(year) {
    const cutoff = yearToCutoff(year);
    createStockChart(`chart-bad-debt-${ticker}`, {
      yAxis: [{ title: { text: '%' } }],
      series: bdSeriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(bdCard, renderBadDebt);
  renderBadDebt('1Y');
}
