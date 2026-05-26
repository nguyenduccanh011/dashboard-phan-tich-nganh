// static/js/block-enterprise-snapshot.js
// Load và render enterprise snapshot (live per-company data)
// Endpoint: /api/sector/{code}/enterprise-snapshot

async function loadAndRenderEnterpriseSnapshot(sectorCode) {
  const container = document.getElementById('block-enterprise-content');
  if (!container) return;

  try {
    const res = await fetch(`/api/sector/${sectorCode}/enterprise-snapshot?limit=10`);
    if (!res.ok) {
      container.innerHTML = `<p style="color:#888;">Không thể tải dữ liệu enterprise (${res.status})</p>`;
      return;
    }

    const data = await res.json();
    renderEnterpriseSnapshot(data);
  } catch (e) {
    container.innerHTML = `<p style="color:#cc0000;">Lỗi: ${e.message}</p>`;
  }
}

function renderEnterpriseSnapshot(data) {
  const container = document.getElementById('block-enterprise-content');
  container.innerHTML = '';

  if (!data.rows || data.rows.length === 0) {
    container.innerHTML = '<p style="color:#888;">Không có dữ liệu doanh nghiệp</p>';
    return;
  }

  // Header
  container.insertAdjacentHTML('beforeend', `
    <div style="margin-bottom:20px;color:#666;font-size:14px;">
      📈 Cập nhật: ${new Date(data.updated_at).toLocaleString('vi-VN')} | ${data.rows.length} công ty
    </div>
  `);

  // Summary metrics (top row)
  const avgPE = (data.rows.reduce((sum, r) => sum + (r.pe || 0), 0) / data.rows.length).toFixed(1);
  const avgPB = (data.rows.reduce((sum, r) => sum + (r.pb || 0), 0) / data.rows.length).toFixed(1);

  container.insertAdjacentHTML('beforeend', `
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:12px;margin-bottom:20px;">
      <div style="background:#f0f9ff;padding:16px;border-radius:6px;border-left:4px solid #0066cc;">
        <div style="font-size:12px;color:#666;">Avg P/E</div>
        <div style="font-size:24px;font-weight:bold;color:#0066cc;">${avgPE}</div>
      </div>
      <div style="background:#f0fff0;padding:16px;border-radius:6px;border-left:4px solid #00cc00;">
        <div style="font-size:12px;color:#666;">Avg P/B</div>
        <div style="font-size:24px;font-weight:bold;color:#00cc00;">${avgPB}</div>
      </div>
      <div style="background:#fff9f0;padding:16px;border-radius:6px;border-left:4px solid #ff9900;">
        <div style="font-size:12px;color:#666;">Companies</div>
        <div style="font-size:24px;font-weight:bold;color:#ff9900;">${data.rows.length}</div>
      </div>
    </div>
  `);

  // Main table
  container.insertAdjacentHTML('beforeend', `
    <div style="overflow-x:auto;border-radius:6px;border:1px solid #ddd;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;border-bottom:2px solid #ddd;">
            <th style="padding:12px;text-align:left;font-weight:600;">Mã</th>
            <th style="padding:12px;text-align:left;font-weight:600;">Tên</th>
            <th style="padding:12px;text-align:center;font-weight:600;">Giá</th>
            <th style="padding:12px;text-align:center;font-weight:600;">VĐH</th>
            <th style="padding:12px;text-align:center;font-weight:600;">P/E</th>
            <th style="padding:12px;text-align:center;font-weight:600;">P/B</th>
            <th style="padding:12px;text-align:center;font-weight:600;">EPS</th>
            <th style="padding:12px;text-align:center;font-weight:600;">DT Mới</th>
            <th style="padding:12px;text-align:center;font-weight:600;">LN Mới</th>
            <th style="padding:12px;text-align:center;font-weight:600;">CP</th>
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr style="border-bottom:1px solid #eee;hover:background:#fafafa;">
              <td style="padding:12px;font-weight:600;color:#0066cc;"><strong>${row.ticker}</strong></td>
              <td style="padding:12px;font-size:13px;">${row.name || '—'}</td>
              <td style="padding:12px;text-align:center;font-weight:500;">${row.close_price ? row.close_price.toLocaleString('vi-VN', {maximumFractionDigits: 0}) : '—'}</td>
              <td style="padding:12px;text-align:center;color:#00cc00;font-weight:600;">${row.market_cap ? (row.market_cap / 1000).toFixed(0) + 'B' : '—'}</td>
              <td style="padding:12px;text-align:center;${row.pe ? (row.pe < 10 ? 'color:#00cc00' : row.pe > 20 ? 'color:#cc0000' : '') : ''}">${row.pe ? row.pe.toFixed(1) : '—'}</td>
              <td style="padding:12px;text-align:center;${row.pb ? (row.pb < 1 ? 'color:#00cc00' : row.pb > 2 ? 'color:#cc0000' : '') : ''}">${row.pb ? row.pb.toFixed(2) : '—'}</td>
              <td style="padding:12px;text-align:center;">${row.eps ? row.eps.toFixed(0) : '—'}</td>
              <td style="padding:12px;text-align:center;color:#0066cc;">${row.latest_revenue ? (row.latest_revenue / 1000000).toFixed(0) + 'T' : '—'}</td>
              <td style="padding:12px;text-align:center;color:#0066cc;font-weight:500;">${row.latest_profit ? (row.latest_profit / 1000000).toFixed(0) + 'T' : '—'}</td>
              <td style="padding:12px;text-align:center;font-size:11px;color:#666;">${row.latest_profit_period || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `);

  // Dividend summary
  const dividend_companies = data.rows.filter(r => r.cash_dividend || r.stock_dividend);
  if (dividend_companies.length > 0) {
    container.insertAdjacentHTML('beforeend', `
      <div style="margin-top:20px;padding:16px;background:#f5f5f5;border-radius:6px;">
        <div style="font-weight:600;margin-bottom:12px;">📊 Cổ tức gần nhất</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;">
          ${dividend_companies.map(r => `
            <div style="background:white;padding:12px;border-radius:4px;border-left:3px solid #f39c12;">
              <div style="font-weight:600;">${r.ticker}</div>
              <div style="font-size:12px;color:#666;margin-top:4px;">
                ${r.latest_dividend_year ? `Năm ${r.latest_dividend_year}` : ''}<br/>
                ${r.cash_dividend ? `💵 ${r.cash_dividend.toFixed(2)}đ` : ''}
                ${r.stock_dividend ? ` | 📈 ${r.stock_dividend.toFixed(2)}%` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  // Error summary
  const errors = data.rows.filter(r => r.errors && Object.keys(r.errors).length > 0);
  if (errors.length > 0) {
    container.insertAdjacentHTML('beforeend', `
      <div style="margin-top:20px;padding:12px;background:#ffe6e6;border-radius:6px;color:#cc0000;font-size:12px;">
        ⚠️ ${errors.length} công ty có lỗi dữ liệu
      </div>
    `);
  }
}
