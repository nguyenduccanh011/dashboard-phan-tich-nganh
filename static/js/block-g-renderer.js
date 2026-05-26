// static/js/block-g-renderer.js
// Render Block G (sector-specific data) cho tất cả sectors
// Dữ liệu khác nhau tùy sector: lake levels, exports, market share, etc.

function renderBlockG(blockG, sectorCode, tickers) {
  const container = document.getElementById('block-g-charts');
  if (!container) return;
  container.innerHTML = '';

  if (!blockG) {
    container.innerHTML = '<p style="color:#888">Không có dữ liệu Block G</p>';
    return;
  }

  // Electricity-specific
  if (sectorCode === 'electricity') {
    renderElectricityBlockG(blockG);
  }
  // Steel-specific
  else if (sectorCode === 'steel' || sectorCode === 'cement') {
    renderMarketShareBlockG(blockG);
  }
  // Shrimp/Pangasius-specific
  else if (sectorCode === 'shrimp' || sectorCode === 'pangasius') {
    renderExportBlockG(blockG);
  }
  // Default: show available data
  else {
    renderGenericBlockG(blockG);
  }
}

function renderElectricityBlockG(blockG) {
  const container = document.getElementById('block-g-charts');

  // Lake levels
  if (blockG.lake_level && Array.isArray(blockG.lake_level) && blockG.lake_level.length > 0) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">📊 Mực nước các hồ chứa</span>
        </div>
        <div id="lake-level-table" style="overflow-x:auto;"></div>
      </div>
    `);

    const table = document.getElementById('lake-level-table');
    const html = `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #ddd;">
            <th style="padding:12px;text-align:left;">Hồ chứa</th>
            <th style="padding:12px;text-align:center;">Mực nước (m)</th>
            <th style="padding:12px;text-align:center;">Sức chứa (Mm³)</th>
            <th style="padding:12px;text-align:center;">% Đầy</th>
          </tr>
        </thead>
        <tbody>
          ${blockG.lake_level.map(lake => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;font-weight:500;">${lake.name || 'N/A'}</td>
              <td style="padding:12px;text-align:center;color:#0066cc;font-weight:600;">${lake.level ? lake.level.toFixed(1) : '—'}</td>
              <td style="padding:12px;text-align:center;">${lake.capacity?.toLocaleString('vi-VN') || '—'}</td>
              <td style="padding:12px;text-align:center;"><strong>${lake.pct ? lake.pct.toFixed(1) + '%' : '—'}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    table.innerHTML = html;
  }

  // ENSO Forecast
  if (blockG.enso_forecast) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">🌊 ENSO Forecast (El Niño/La Niña)</span>
        </div>
        <div id="enso-chart" style="min-height:300px;"></div>
      </div>
    `);

    const forecast = blockG.enso_forecast;
    if (forecast.forecast && Array.isArray(forecast.forecast)) {
      const data = forecast.forecast.map(f => ({
        name: f.month,
        y: f.oni_forecast || 0
      }));

      createStockChart('enso-chart', {
        title: { text: '' },
        yAxis: {
          title: { text: 'ONI Index' },
          plotLines: [
            { value: 0.5, color: '#e74c3c', width: 2, label: { text: 'El Niño Threshold' } },
            { value: -0.5, color: '#3498db', width: 2, label: { text: 'La Niña Threshold' } }
          ]
        },
        series: [{
          name: 'ONI Forecast',
          data: data,
          type: 'line',
          color: '#f39c12'
        }]
      });
    }
  }

  // Power output by resource
  if (blockG.output_resource_by_proportion && Array.isArray(blockG.output_resource_by_proportion)) {
    const latest = blockG.output_resource_by_proportion[0];
    if (latest) {
      container.insertAdjacentHTML('beforeend', `
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">⚡ Cơ cấu nguồn điện (${latest.date})</span>
          </div>
          <div id="power-mix-chart" style="min-height:300px;"></div>
        </div>
      `);

      const resources = [
        { name: 'Coal', key: 'coal' },
        { name: 'Hydro', key: 'hydro' },
        { name: 'Wind', key: 'wind' },
        { name: 'Solar', key: 'solar' },
        { name: 'Other', key: 'other' }
      ];

      const data = resources
        .filter(r => latest[r.key] !== undefined && latest[r.key] > 0)
        .map(r => ({ name: r.name, y: latest[r.key] }));

      createStockChart('power-mix-chart', {
        chart: { type: 'pie' },
        title: { text: '' },
        series: [{ data: data }]
      });
    }
  }
}

function renderMarketShareBlockG(blockG) {
  const container = document.getElementById('block-g-charts');

  if (blockG.market_share && Array.isArray(blockG.market_share)) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">🏆 Thị phần ngành</span>
        </div>
        <div id="market-share-chart" style="min-height:300px;"></div>
        <div id="market-share-table" style="margin-top:20px;overflow-x:auto;"></div>
      </div>
    `);

    // Chart
    const data = blockG.market_share.map(m => ({
      name: m.ticker || m.company,
      y: m.share || m.market_share || 0
    }));

    createStockChart('market-share-chart', {
      chart: { type: 'pie' },
      title: { text: '' },
      series: [{ data: data }]
    });

    // Table
    const table = document.getElementById('market-share-table');
    const html = `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #ddd;">
            <th style="padding:12px;text-align:left;">Công ty</th>
            <th style="padding:12px;text-align:center;">Thị phần (%)</th>
            <th style="padding:12px;text-align:center;">Sản lượng</th>
          </tr>
        </thead>
        <tbody>
          ${blockG.market_share.map(m => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;font-weight:500;">${m.ticker || m.company}</td>
              <td style="padding:12px;text-align:center;color:#0066cc;font-weight:600;">${(m.share || m.market_share || 0).toFixed(1)}%</td>
              <td style="padding:12px;text-align:center;">${(m.produced || m.volume || m.production || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    table.innerHTML = html;
  }
}

function renderExportBlockG(blockG) {
  const container = document.getElementById('block-g-charts');

  // Per-company export
  if (blockG.export_by_company) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">📦 Xuất khẩu theo doanh nghiệp</span>
        </div>
        <div id="export-company-table" style="overflow-x:auto;"></div>
      </div>
    `);

    const table = document.getElementById('export-company-table');
    let html = `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #ddd;">
            <th style="padding:12px;text-align:left;">Doanh nghiệp</th>
            <th style="padding:12px;text-align:center;">Tháng/Năm</th>
            <th style="padding:12px;text-align:center;">Lượng (tấn)</th>
            <th style="padding:12px;text-align:center;">Giá trị (USD)</th>
            <th style="padding:12px;text-align:center;">Giá/kg</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.entries(blockG.export_by_company).forEach(([company, data]) => {
      if (Array.isArray(data) && data[0]) {
        const latest = data[0];
        html += `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px;font-weight:500;">${company}</td>
            <td style="padding:12px;text-align:center;">${latest.date}</td>
            <td style="padding:12px;text-align:center;">${(latest.quantity || 0).toLocaleString('vi-VN')}</td>
            <td style="padding:12px;text-align:center;color:#0066cc;">${(latest.turnover || 0).toLocaleString('vi-VN')}</td>
            <td style="padding:12px;text-align:center;font-weight:600;">${latest.price_per_kg ? latest.price_per_kg.toFixed(2) : '—'}</td>
          </tr>
        `;
      }
    });

    html += `</tbody></table>`;
    table.innerHTML = html;
  }

  // By market
  if (blockG.export_by_market) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">🌍 Xuất khẩu theo thị trường</span>
        </div>
        <div id="export-market-chart" style="min-height:300px;"></div>
      </div>
    `);

    const data = Object.entries(blockG.export_by_market).map(([market, values]) => {
      const latest = Array.isArray(values) ? values[0] : values;
      return {
        name: market,
        y: latest?.quantity || latest?.value || 0
      };
    });

    createStockChart('export-market-chart', {
      chart: { type: 'column' },
      title: { text: '' },
      xAxis: { type: 'category' },
      series: [{ data: data, name: 'Lượng xuất khẩu' }]
    });
  }
}

function renderGenericBlockG(blockG) {
  const container = document.getElementById('block-g-charts');

  if (Object.keys(blockG).length === 0) {
    container.innerHTML = '<p style="color:#888">Không có dữ liệu Block G</p>';
    return;
  }

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">📊 Dữ liệu ngành</span>
      </div>
      <pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:12px;">
${JSON.stringify(blockG, null, 2)}
      </pre>
    </div>
  `);
}
