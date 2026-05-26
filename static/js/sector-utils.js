// Shared helpers cho tất cả sector-*.js — load trước charts.js

function showEmpty(containerId, message = 'Không có dữ liệu') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="empty-chart">${message}</div>`;
}

// Xử lý cả 2 format: {ticker: [...]} và {ticker: {ticker: [...]}}
function getTickerRows(blockData, ticker) {
  const v = (blockData || {})[ticker];
  if (!v) return [];
  return v[ticker] || (Array.isArray(v) ? v : []);
}

// Giải quyết bug analyst.recommend vs analyst.recommendation
function getAnalystRec(blockE_ticker) {
  const analyst = blockE_ticker?.analyst;
  return Array.isArray(analyst) ? analyst[0] : (analyst || null);
}

// Nhóm rows theo quý, trả về categories và hàm lấy data theo accountId
function getQuarterRows(rows, n = 8) {
  const label = r => r.period || `${r.year}Q${r.quarter}`;
  const quarters = [...new Set(rows.map(label))].sort().slice(-n);
  const getQ = (accId) => quarters.map(q => {
    const r = rows.find(x => label(x) === q && x.accountId === accId);
    return r?.value ?? null;
  });
  return { quarters, getQ };
}

// ─── Phase 2: Shared renderers ────────────────────────────────────────────────

// Default BCTC series cho non-bank (accId: null = không có accId trực tiếp, bị lọc ra)
const _DEFAULT_BCTC_SERIES = [
  { name: 'Doanh thu',  accId: 24,   type: 'column', color: HC_COLORS[0] },
  { name: 'LN gộp',    accId: 28,   type: 'column', color: HC_COLORS[2] },
  { name: 'LNST',      accId: 43,   type: 'column', color: HC_COLORS[3] },
  { name: 'Biên gộp %', accId: null, type: 'line',   color: HC_COLORS[1], yAxis: 1,
    tooltip: { valueSuffix: '%' } },
];

// Thay thế 27 bản copy renderBlockF
// opts.series: override default series (dùng cho bank và các sector đặc thù)
// opts.yLabel: override nhãn trục Y trái
function renderBctcChart(containerId, ticker, blockF, opts = {}) {
  const rows = getTickerRows(blockF, ticker);
  if (!rows.length) { showEmpty(containerId, 'Chưa có dữ liệu BCTC'); return; }
  const { quarters, getQ } = getQuarterRows(rows);
  const series = (opts.series || _DEFAULT_BCTC_SERIES)
    .filter(s => s.accId !== null)
    .map(s => ({ ...s, data: getQ(s.accId) }));
  createChart(containerId, {
    chart: { type: 'column' },
    xAxis: { categories: quarters },
    yAxis: [
      { title: { text: opts.yLabel || 'Tỷ VNĐ' } },
      { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } },
    ],
    series,
  });
}

// Default account map cho non-bank sectors (từ cache thực tế)
const _DEFAULT_ACCOUNT_MAP = {
  marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, dtGrowth: 163,
};
const _DEFAULT_COLUMNS = ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'dtGrowth'];
const _DEFAULT_PCT_FIELDS = new Set(['grossMargin', 'roe', 'dtGrowth']);

// Thay thế 27 bản copy renderBlockE
// opts.accountMap, opts.columns, opts.pctFields: override cho bank và sector đặc thù
function renderValuationTable(containerId, blockE, opts = {}) {
  const accountMap = opts.accountMap || _DEFAULT_ACCOUNT_MAP;
  const columns    = opts.columns    || _DEFAULT_COLUMNS;
  const pctFields  = new Set(opts.pctFields || [..._DEFAULT_PCT_FIELDS]);
  const tickers    = Object.keys(blockE || {});

  if (!tickers.length) { showEmpty(containerId, 'Chưa có dữ liệu định giá'); return; }

  const getValue = (tickerData, field) => {
    const accId = accountMap[field];
    const trailing = tickerData?.trailing || {};
    const rows = trailing[Object.keys(trailing)[0]] || [];
    return (rows.find(r => r.accountId === accId))?.value ?? null;
  };

  const fmt = (val, field) => {
    if (val === null || val === undefined) return '—';
    if (pctFields.has(field)) return `<span class="${val >= 0 ? 'num-up' : 'num-down'}">${(val * 100).toFixed(1)}%</span>`;
    return Highcharts.numberFormat(val, 1);
  };

  const recTag = (rec) => {
    if (!rec?.recommend) return '—';
    const map = { BUY: 'tag-buy', HOLD: 'tag-hold', SELL: 'tag-sell' };
    return `<span class="${map[rec.recommend] || ''}">${rec.recommend}</span>`;
  };

  const headers = columns.map(c => `<th>${c}</th>`).join('');
  const bodyRows = tickers.map(t => {
    const rec   = getAnalystRec(blockE[t]);
    const cells = columns.map(c => `<td>${fmt(getValue(blockE[t], c), c)}</td>`).join('');
    const upside = rec?.upside != null
      ? `<span class="${rec.upside >= 0 ? 'num-up' : 'num-down'}">${(rec.upside / 100).toFixed(1)}%</span>`
      : '—';
    return `<tr><td>${t}</td>${cells}<td>${recTag(rec)}</td><td>${upside}</td><td>${rec?.targetPrice ? Highcharts.numberFormat(rec.targetPrice, 0) : '—'}</td></tr>`;
  }).join('');

  document.getElementById(containerId).innerHTML = `
    <table class="stock-table">
      <thead><tr><th>Ticker</th>${headers}<th>Recommend</th><th>Upside</th><th>Target</th></tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>`;
}

// ─── Block G: Định giá lịch sử & Cổ tức ─────────────────────────────────────
// opts.pe_id / opts.pb_id: account_id cho PE/PB (mặc định 39/154 cho corpType=4)
// opts.tickers: subset tickers muốn hiển thị (mặc định dùng tất cả, tối đa 5)
function renderBlockG(blockG, tickers, opts = {}) {
  const container = document.getElementById('block-g-charts');
  if (!blockG || !tickers || !tickers.length) return;

  const peId = opts.pe_id !== undefined ? opts.pe_id : 39;
  const pbId = opts.pb_id !== undefined ? opts.pb_id : 154;
  const maxT = (opts.tickers || tickers).slice(0, 5);

  // 1. PE / PB lịch sử
  const valData = {};
  maxT.forEach(t => {
    const rows = (blockG[t] || {}).valuation || [];
    if (!rows.length) return;
    valData[t] = {
      pe: rows.filter(r => r.account_id === peId)
              .map(r => [new Date(r.date).getTime(), parseFloat(r.value)])
              .sort((a, b) => a[0] - b[0]),
      pb: rows.filter(r => r.account_id === pbId)
              .map(r => [new Date(r.date).getTime(), parseFloat(r.value)])
              .sort((a, b) => a[0] - b[0]),
    };
  });

  if (Object.keys(valData).length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">PE / PB lịch sử</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-lg" id="chart-g-valuation"></div>
      </div>
    `);
    const valCard = container.lastElementChild;
    const peSeries = Object.entries(valData)
      .filter(([, d]) => d.pe.length)
      .map(([t, d], i) => ({ name: `PE ${t}`, data: d.pe, color: HC_COLORS[i % HC_COLORS.length], yAxis: 0 }));
    const pbSeries = Object.entries(valData)
      .filter(([, d]) => d.pb.length)
      .map(([t, d], i) => ({ name: `PB ${t}`, data: d.pb, color: HC_COLORS[i % HC_COLORS.length], yAxis: 1, dashStyle: 'ShortDash' }));
    function renderVal(year) {
      const cut = yearToCutoff(year);
      createStockChart('chart-g-valuation', {
        yAxis: [{ title: { text: 'PE (x)' } }, { title: { text: 'PB (x)' }, opposite: true }],
        series: [...peSeries, ...pbSeries].map(s => ({ ...s, data: s.data.filter(p => p[0] >= cut) })),
      });
    }
    initYearButtons(valCard, renderVal);
    renderVal('1Y');
  }

  // 2. Cổ tức tiền mặt
  const divData = {};
  maxT.forEach(t => {
    const rows = ((blockG[t] || {}).dividend || []).filter(r => r.type === 1).sort((a, b) => a.year - b.year);
    if (rows.length) divData[t] = rows;
  });

  if (Object.keys(divData).length) {
    const allYears = [...new Set(Object.values(divData).flat().map(r => r.year))].sort().slice(-10);
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">Cổ tức tiền mặt (% mệnh giá)</span></div>
        <div class="chart-container chart-lg" id="chart-g-dividend"></div>
      </div>
    `);
    createChart('chart-g-dividend', {
      chart: { type: 'column' },
      xAxis: { categories: allYears.map(String) },
      yAxis: [{ title: { text: '%' }, labels: { format: '{value}%' } }],
      tooltip: { valueSuffix: '%' },
      series: Object.entries(divData).map(([t, rows], i) => ({
        name: t,
        data: allYears.map(y => { const r = rows.find(x => x.year === y); return r ? parseFloat((r.value * 100).toFixed(2)) : null; }),
        color: HC_COLORS[i % HC_COLORS.length],
      })),
    });
  }

  // 3. Doanh thu theo quý (chỉ khi có revenue data)
  const revData = {};
  maxT.slice(0, 3).forEach(t => {
    const rows = ((blockG[t] || {}).revenue || []).filter(r => r.type === 1);
    if (rows.length) {
      revData[t] = rows.map(r => [new Date(r.date).getTime(), r.value]).sort((a, b) => a[0] - b[0]);
    }
  });

  if (Object.keys(revData).length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="3Y,5Y,MAX">
        <div class="chart-header">
          <span class="chart-title">Doanh thu theo quý</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-lg" id="chart-g-revenue"></div>
      </div>
    `);
    const revCard = container.lastElementChild;
    const revSeries = Object.entries(revData).map(([t, pts], i) => ({
      name: t, type: 'column', data: pts, color: HC_COLORS[i % HC_COLORS.length],
    }));
    function renderRev(year) {
      const cut = yearToCutoff(year);
      createStockChart('chart-g-revenue', {
        yAxis: [{ title: { text: 'VNĐ' } }],
        series: revSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cut) })),
      });
    }
    initYearButtons(revCard, renderRev);
    renderRev('3Y');
  }

  // 4. LNST từ sản xuất theo quý
  const patData = {};
  maxT.slice(0, 3).forEach(t => {
    const rows = ((blockG[t] || {}).profit_after_tax || []).filter(r => r.type === 1);
    if (rows.length) {
      patData[t] = rows.map(r => [new Date(r.date).getTime(), r.value]).sort((a, b) => a[0] - b[0]);
    }
  });

  if (Object.keys(patData).length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="3Y,5Y,MAX">
        <div class="chart-header">
          <span class="chart-title">LNST từ sản xuất theo quý</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container chart-lg" id="chart-g-pat"></div>
      </div>
    `);
    const patCard = container.lastElementChild;
    const patSeries = Object.entries(patData).map(([t, pts], i) => ({
      name: t, type: 'column', data: pts, color: HC_COLORS[i % HC_COLORS.length],
    }));
    function renderPat(year) {
      const cut = yearToCutoff(year);
      createStockChart('chart-g-pat', {
        yAxis: [{ title: { text: 'VNĐ' } }],
        series: patSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cut) })),
      });
    }
    initYearButtons(patCard, renderPat);
    renderPat('3Y');
  }

  // 5. Corp Profile — bảng tóm tắt metrics hiện tại
  const profRows = maxT
    .map(t => ({ ticker: t, ...(blockG[t]?.corp_profile || {}) }))
    .filter(r => r.closePrice);

  if (profRows.length) {
    const fmt = (v, digits = 1) => v != null ? Highcharts.numberFormat(v, digits) : '—';
    const fmtPct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v).toFixed(2)}%</span>` : '—';
    const rows = profRows.map(r => `
      <tr>
        <td><b>${r.ticker}</b></td>
        <td>${fmt(r.closePrice, 0)}</td>
        <td>${fmtPct(r.perPriceChange)}</td>
        <td>${fmt(r.marketCap, 0)} tỷ</td>
        <td>${fmt(r.pe)}</td>
        <td>${fmt(r.pb)}</td>
        <td>${fmt(r.evEbitda)}</td>
        <td>${fmt(r.eps, 0)}</td>
        <td>${fmt(r.bvps, 0)}</td>
      </tr>`).join('');
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">Thông tin cổ phiếu hiện tại</span></div>
        <div style="overflow-x:auto">
          <table class="stock-table">
            <thead><tr>
              <th>Ticker</th><th>Giá</th><th>%D</th><th>Vốn hóa</th>
              <th>P/E</th><th>P/B</th><th>EV/EBITDA</th><th>EPS</th><th>BVPS</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `);
  }
}

// ─── Phase 3: Cache contract / dev-mode validator ─────────────────────────────

function checkDataFreshness(series, label, warnDays = 60) {
  if (!series.length) return;
  const latest = Math.max(...series.map(p => p[0]));
  const daysSince = (Date.now() - latest) / 86400000;
  if (daysSince > warnDays) {
    console.warn(`[${label}] data stale: ${Math.round(daysSince)} ngày kể từ điểm cuối`);
    return daysSince;
  }
  return 0;
}

// Dev-mode only — chạy khi localhost để phát hiện format mismatch sớm
if (location.hostname === 'localhost') {
  window._validateSectorCache = function(data, schema) {
    for (const [block, blockSchema] of Object.entries(schema)) {
      const blockData = data[block];
      if (!blockData) { console.error(`[SCHEMA] missing block: ${block}`); continue; }
      for (const [key, rule] of Object.entries(blockSchema)) {
        const val = blockData[key];
        if (rule.required && val == null)
          console.error(`[SCHEMA] ${block}.${key}: required but missing`);
        if (rule.type === 'array' && !Array.isArray(val))
          console.error(`[SCHEMA] ${block}.${key}: expected array, got ${typeof val}`);
        if (rule.type === 'tickerDict' && (typeof val !== 'object' || Array.isArray(val)))
          console.error(`[SCHEMA] ${block}.${key}: expected object (tickerDict), got ${typeof val}`);
        if (rule.minLength && Array.isArray(val) && val.length < rule.minLength)
          console.warn(`[SCHEMA] ${block}.${key}: length ${val.length} < minLength ${rule.minLength}`);
      }
    }
  };
}
