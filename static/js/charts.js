/**
 * charts.js — Highcharts base theme + factory functions
 * Import trước mọi sector-*.js
 * Phụ thuộc: Highcharts Stock đã được load qua CDN
 */

// === PALETTE (đồng bộ với --hc-* trong main.css) ===
const HC_COLORS = [
  '#1d4ed8',  // 0 — giá/price
  '#b91c1c',  // 1 — chi phí/cost
  '#15803d',  // 2 — spread/margin
  '#b45309',  // 3 — volume/thị phần
  '#6d28d9',  // 4 — tỷ giá/macro
  '#0369a1',  // 5 — lãi suất/rate
  '#be185d',  // 6 — phụ
  '#047857',  // 7 — phụ
  '#92400e',  // 8 — phụ
  '#1e40af',  // 9 — phụ
];

// === GLOBAL HIGHCHARTS THEME ===
Highcharts.setOptions({
  colors: HC_COLORS,
  chart: {
    backgroundColor: '#FAFAF7',   // --paper
    style: { fontFamily: "'Inter', system-ui, sans-serif" },
    animation: { duration: 250 },
  },
  title: { text: null },
  subtitle: { text: null },
  credits: { enabled: false },
  exporting: { enabled: false },
  legend: {
    itemStyle: { color: '#5F6460', fontSize: '11px', fontWeight: '600' },
    itemHoverStyle: { color: '#161616' },
  },
  xAxis: {
    type: 'datetime',
    lineColor: 'rgba(22,22,22,.10)',
    tickColor: 'rgba(22,22,22,.10)',
    labels: { style: { color: '#5F6460', fontSize: '11px' } },
    crosshair: { color: 'rgba(22,22,22,.15)', dashStyle: 'ShortDash' },
  },
  yAxis: {
    gridLineColor: 'rgba(22,22,22,.07)',
    labels: { style: { color: '#5F6460', fontSize: '11px' } },
    title: { text: null },
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(22,22,22,.12)',
    borderRadius: 6,
    shadow: { color: 'rgba(0,0,0,.08)', offsetX: 0, offsetY: 4, opacity: 1, width: 12 },
    style: { color: '#161616', fontSize: '12px' },
    shared: true,
    xDateFormat: '%d/%m/%Y',
    headerFormat: '<span style="font-size:10px;color:#5F6460">{point.key}</span><br/>',
    pointFormatter: function() {
      const val = this.y >= 1000
        ? Highcharts.numberFormat(this.y, 0, '.', ',')
        : Highcharts.numberFormat(this.y, 2, '.', ',');
      return `<span style="color:${this.color}">●</span> <b>${this.series.name}:</b> ${val}<br/>`;
    },
  },
  plotOptions: {
    series: {
      animation: { duration: 300 },
      states: { hover: { lineWidthPlus: 0 } },
    },
    line: {
      lineWidth: 1.5,
      marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
    },
    area: {
      fillOpacity: 0.08,
      lineWidth: 1.5,
      marker: { enabled: false },
    },
    column: {
      borderWidth: 0,
      borderRadius: 2,
      pointPadding: 0.05,
      groupPadding: 0.1,
    },
    pie: {
      borderWidth: 1,
      borderColor: '#FFFFFF',
      dataLabels: { style: { fontSize: '11px', fontWeight: '600', color: '#161616', textOutline: 'none' } },
    },
  },
  responsive: {
    rules: [{
      condition: { maxWidth: 600 },
      chartOptions: {
        legend: { enabled: false },
        xAxis: { labels: { style: { fontSize: '10px' } } },
        yAxis: { labels: { style: { fontSize: '10px' } } },
      },
    }],
  },
});

// === FACTORY FUNCTIONS ===

/**
 * Tạo chart thường (không có navigator/scrollbar)
 * @param {string} containerId
 * @param {object} config — Highcharts options, merge với base theme
 */
function createChart(containerId, config) {
  clearSkeleton(containerId);
  return Highcharts.chart(containerId, Highcharts.merge({
    chart: { renderTo: containerId },
  }, config));
}

/**
 * Tạo Stock chart (có navigator, dùng cho time-series dài)
 * @param {string} containerId
 * @param {object} config
 */
function createStockChart(containerId, config) {
  clearSkeleton(containerId);
  return Highcharts.stockChart(containerId, Highcharts.merge({
    rangeSelector: { enabled: false },
    navigator: {
      enabled: true,
      height: 30,
      outlineColor: 'rgba(22,22,22,.10)',
      handles: { backgroundColor: '#F2F4EF', borderColor: 'rgba(22,22,22,.25)' },
      series: { color: '#008C44', lineWidth: 1 },
    },
    scrollbar: { enabled: false },
  }, config));
}

// === UI HELPERS ===

/**
 * Khởi tạo year-range buttons từ data-year-options attribute
 * @param {HTMLElement} chartCard — .chart-card element có data-year-options
 * @param {function} onSelect — callback(yearString: '1Y'|'3Y'|'5Y'|'MAX')
 * @param {string} defaultYear — mặc định chọn (default: options[0])
 */
function initYearButtons(chartCard, onSelect, defaultYear = null) {
  const opts = (chartCard.dataset.yearOptions || '1Y,3Y,5Y').split(',');
  const container = chartCard.querySelector('.year-btns');
  if (!container) return;

  const activeYear = defaultYear || opts[0];
  opts.forEach(y => {
    const btn = document.createElement('button');
    btn.textContent = y;
    if (y === activeYear) btn.classList.add('active');
    btn.addEventListener('click', () => {
      container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(y);
    });
    container.appendChild(btn);
  });
}

/**
 * Hiển thị stale badge trên chart card
 * @param {HTMLElement} chartCard
 * @param {'warn'|'info'|'error'} type
 * @param {string} text
 */
function setStaleBadge(chartCard, type, text) {
  let badge = chartCard.querySelector('.stale-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'stale-badge';
    const header = chartCard.querySelector('.chart-header');
    if (header) header.insertBefore(badge, header.querySelector('.year-btns'));
  }
  badge.className = `stale-badge ${type}`;
  badge.textContent = text;
  badge.style.display = '';
}

/**
 * Hiển thị skeleton loading trong container
 * @param {string} containerId
 */
function showSkeleton(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '<div class="skeleton"></div>';
}

/**
 * Xoá skeleton (gọi trước khi render chart)
 * @param {string} containerId
 */
function clearSkeleton(containerId) {
  const el = document.getElementById(containerId);
  if (el && el.querySelector('.skeleton')) el.innerHTML = '';
}

/**
 * Hiển thị trạng thái lỗi / không có data
 * @param {string} containerId
 * @param {string} message
 */
function showEmpty(containerId, message = 'Không có dữ liệu') {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div style="height:100%;min-height:200px;display:flex;align-items:center;justify-content:center;color:#5F6460;font-size:12px;gap:6px">
      <span style="font-size:18px">○</span> ${message}
    </div>`;
}

/**
 * Format số theo đơn vị VN
 * @param {number} value
 * @param {string} unit — 'ty' | 'trieu' | 'usd' | 'pct' | ''
 */
function formatVN(value, unit = '') {
  if (value == null || isNaN(value)) return '—';
  if (unit === 'ty') return (value / 1e9).toFixed(1) + ' tỷ';
  if (unit === 'trieu') return (value / 1e6).toFixed(0) + ' tr';
  if (unit === 'pct') return value.toFixed(1) + '%';
  if (unit === 'usd') return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return value.toLocaleString('vi-VN');
}

/**
 * Parse dữ liệu Findicator time-series thành mảng [timestamp_ms, value]
 * Findicator trả về {date: 'MM/DD/YYYY', value: number}
 * @param {Array} rows
 * @param {string} dateField — tên field ngày (default: 'date')
 * @param {string} valueField — tên field giá trị (default: 'value')
 */
function parseFindicatorSeries(rows, dateField = 'date', valueField = 'value') {
  if (!rows || !rows.length) return [];
  return rows
    .map(row => {
      const d = new Date(row[dateField]);
      return [d.getTime(), row[valueField]];
    })
    .filter(([t, v]) => !isNaN(t) && v != null)
    .sort((a, b) => a[0] - b[0]);
}

/**
 * Parse dữ liệu WiChart thành mảng [timestamp_ms, value]
 * Hỗ trợ 2 format: [[ts, val], ...] (WiChart series.data) hoặc [{timestamp_ms, value}, ...]
 * @param {Array} rows
 * @param {number} cutoffMs — cắt data trước timestamp này (để filter year)
 */
function parseWiChartSeries(rows, cutoffMs = 0) {
  if (!rows || !rows.length) return [];
  return rows
    .map(row => Array.isArray(row) ? row : [row.timestamp_ms, row.value])
    .filter(p => p[0] >= cutoffMs && p[1] != null)
    .sort((a, b) => a[0] - b[0]);
}

/**
 * Tính cutoff timestamp từ year string
 * @param {'1Y'|'3Y'|'5Y'|'MAX'} yearStr
 */
function yearToCutoff(yearStr) {
  const now = Date.now();
  const map = { '1Y': 365, '3Y': 365*3, '5Y': 365*5, 'MAX': 365*20 };
  const days = map[yearStr] || 365;
  return now - days * 24 * 3600 * 1000;
}
