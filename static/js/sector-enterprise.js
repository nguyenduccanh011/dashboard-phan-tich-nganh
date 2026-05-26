// Shared enterprise API panel for every sector page.
// Depends on charts.js and Highcharts already loaded by sector.html.

(async function SectorEnterprisePanel() {
  const code = location.pathname.split('/').pop();
  const target = document.getElementById('block-g-content');
  if (!target || !code) return;

  try {
    const res = await fetch(`/api/sector/${code}/enterprise-snapshot?limit=6`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    renderEnterprisePanel(payload);
  } catch (error) {
    target.innerHTML = `
      <div class="enterprise-empty">
        Chưa tải được dữ liệu enterprise mở rộng. ${escapeHtml(error.message || '')}
      </div>
    `;
  }
})();


function renderEnterprisePanel(payload) {
  const target = document.getElementById('block-g-content');
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) {
    target.innerHTML = '<div class="enterprise-empty">Không có ticker để tải dữ liệu enterprise.</div>';
    return;
  }

  target.innerHTML = `
    <div class="enterprise-kpi-grid">
      ${rows.slice(0, 6).map(row => enterpriseCard(row)).join('')}
    </div>

    <div class="sector-grid-2 enterprise-grid">
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">Tỷ trọng vốn hóa / doanh thu / LNST</span>
        </div>
        <div class="chart-container chart-sm" id="chart-enterprise-position"></div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">Cổ tức gần nhất</span>
        </div>
        <div id="enterprise-dividend-table" class="table-scroll"></div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Snapshot enterprise API</span>
      </div>
      <div id="enterprise-snapshot-table" class="table-scroll"></div>
    </div>
  `;

  renderPositionChart(rows);
  renderDividendTable(rows);
  renderSnapshotTable(rows);
}


function enterpriseCard(row) {
  return `
    <article class="enterprise-card">
      <div class="enterprise-card-top">
        <strong>${escapeHtml(row.ticker)}</strong>
        <span>${formatRatio(row.market_cap_share)}</span>
      </div>
      <div class="enterprise-price">${formatPlain(row.close_price)}</div>
      <dl>
        <div><dt>PE</dt><dd>${formatMetric(row.pe, 1)}</dd></div>
        <div><dt>PB</dt><dd>${formatMetric(row.pb, 1)}</dd></div>
        <div><dt>DT mới nhất</dt><dd>${formatLarge(row.latest_revenue)}</dd></div>
        <div><dt>LNST mới nhất</dt><dd>${formatLarge(row.latest_profit)}</dd></div>
      </dl>
    </article>
  `;
}


function renderPositionChart(rows) {
  const categories = rows.map(row => row.ticker);
  const hasAnyShare = rows.some(row => row.market_cap_share || row.revenue_share || row.profit_share);
  if (!hasAnyShare) {
    showEmpty('chart-enterprise-position', 'Chưa đủ dữ liệu tỷ trọng');
    return;
  }

  createChart('chart-enterprise-position', {
    chart: { type: 'column' },
    xAxis: { categories },
    yAxis: { labels: { format: '{value}%' }, max: 100 },
    tooltip: {
      pointFormatter: function() {
        return `<span style="color:${this.color}">●</span> <b>${this.series.name}:</b> ${Highcharts.numberFormat(this.y, 1)}%<br/>`;
      },
    },
    series: [
      { name: 'Vốn hóa', data: rows.map(row => ratioToPct(row.market_cap_share)), color: HC_COLORS[0] },
      { name: 'Doanh thu', data: rows.map(row => ratioToPct(row.revenue_share)), color: HC_COLORS[2] },
      { name: 'LNST', data: rows.map(row => ratioToPct(row.profit_share)), color: HC_COLORS[3] },
    ],
  });
}


function renderDividendTable(rows) {
  const target = document.getElementById('enterprise-dividend-table');
  target.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Năm</th>
          <th>Tiền mặt</th>
          <th>Cổ phiếu</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td>${escapeHtml(row.ticker)}</td>
            <td>${row.latest_dividend_year || '---'}</td>
            <td>${formatDividend(row.cash_dividend)}</td>
            <td>${formatDividend(row.stock_dividend)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function renderSnapshotTable(rows) {
  const target = document.getElementById('enterprise-snapshot-table');
  target.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Giá</th>
          <th>Vốn hóa</th>
          <th>PE</th>
          <th>PB</th>
          <th>EPS</th>
          <th>BVPS</th>
          <th>DT kỳ mới</th>
          <th>LNST kỳ mới</th>
          <th>Lỗi API</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td>${escapeHtml(row.ticker)}</td>
            <td>${formatPlain(row.close_price)}</td>
            <td>${formatLarge(row.market_cap)}</td>
            <td>${formatMetric(row.pe, 1)}</td>
            <td>${formatMetric(row.pb, 1)}</td>
            <td>${formatPlain(row.eps)}</td>
            <td>${formatPlain(row.bvps)}</td>
            <td>${formatLarge(row.latest_revenue)}<br><span class="table-note">${escapeHtml(row.latest_revenue_period || '')}</span></td>
            <td>${formatLarge(row.latest_profit)}<br><span class="table-note">${escapeHtml(row.latest_profit_period || '')}</span></td>
            <td>${formatErrors(row.errors)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function ratioToPct(value) {
  return value == null ? null : Number(value) * 100;
}


function formatRatio(value) {
  return value == null ? '---' : `${(Number(value) * 100).toFixed(1)}% vốn hóa`;
}


function formatDividend(value) {
  if (value == null || isNaN(Number(value))) return '---';
  return `${(Number(value) * 100).toFixed(1)}%`;
}


function formatMetric(value, digits = 1) {
  if (value == null || isNaN(Number(value))) return '---';
  return Highcharts.numberFormat(Number(value), digits);
}


function formatPlain(value) {
  if (value == null || isNaN(Number(value))) return '---';
  return Highcharts.numberFormat(Number(value), 0);
}


function formatLarge(value) {
  if (value == null || isNaN(Number(value))) return '---';
  const abs = Math.abs(Number(value));
  if (abs >= 1e12) return `${Highcharts.numberFormat(Number(value) / 1e12, 1)} nghìn tỷ`;
  if (abs >= 1e9) return `${Highcharts.numberFormat(Number(value) / 1e9, 1)} tỷ`;
  if (abs >= 1e6) return `${Highcharts.numberFormat(Number(value) / 1e6, 1)} triệu`;
  return Highcharts.numberFormat(Number(value), 0);
}


function formatErrors(errors) {
  if (!errors || !Object.keys(errors).length) return '<span class="num-up">OK</span>';
  return `<span class="stale-badge warn">${Object.keys(errors).length} lỗi</span>`;
}


function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
