// static/js/sector-rubber.js
// Render trang ngành Cao su — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)
// Lưu ý: WiChart cao_su stale ~15 tháng → hiển thị badge cảnh báo

(async function SectorRubber() {
  let data;
  try {
    const res = await fetch('/api/sector/rubber/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Cao su — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Cao su';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Cao su — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Cao su = khai thác, đầu vào là chi phí tĩnh.
  // Theo dõi Brent (logistics + máy thu hoạch) + WTI làm tham chiếu
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá dầu (chi phí thu hoạch & logistics)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-oil"></div>
    </div>
  `);
  const cardOil = container.lastElementChild;
  const seriesBrent = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 65));
  const seriesWti   = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 67));
  function renderOil(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-oil', {
      yAxis: [{ title: { text: 'USD/Bbl' } }],
      series: [
        { name: 'Brent (USD/Bbl)', data: seriesBrent.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'WTI (USD/Bbl)', data: seriesWti.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(cardOil, renderOil);
  renderOil('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Tổng quan ngành — diện tích, ứng dụng (tĩnh)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Cơ cấu ứng dụng cao su tự nhiên (%)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-application"></div>
    </div>
  `);
  const overview = blockB.overview;
  const appData = overview?.rubberApplication;
  if (appData && Array.isArray(appData) && appData.length) {
    createChart('chart-application', {
      chart: { type: 'pie' },
      series: [{
        name: 'Ứng dụng',
        data: appData.map(r => ({ name: r.name || r.category, y: r.value || r.percent })),
      }],
    });
  } else {
    showEmpty('chart-application');
  }

  // Chart 2: Sản lượng cao su VN theo năm
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Sản lượng cao su VN theo năm</span>
      </div>
      <div class="chart-container chart-sm" id="chart-production"></div>
    </div>
  `);
  const overallData = overview?.rubberOverall;
  if (overallData && Array.isArray(overallData) && overallData.length) {
    const years = overallData.map(r => r.year || r.name || '');
    const vals  = overallData.map(r => r.value || r.production || 0);
    createChart('chart-production', {
      chart: { type: 'column' },
      xAxis: { categories: years },
      series: [{ name: 'Sản lượng (Nghìn tấn)', data: vals, color: HC_COLORS[0] }],
    });
  } else {
    showEmpty('chart-production');
  }

  // Chart 3: XK cao su VN YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">XK cao su VN YoY (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-export-yoy"></div>
    </div>
  `);
  const cardYoy = container.lastElementChild;
  const exportYoyData = parseFindicatorSeries(blockB.export_yoy);
  function renderYoy(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-export-yoy', {
      series: [{ name: 'XK YoY (%)', data: exportYoyData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
    });
  }
  initYearButtons(cardYoy, renderYoy);
  renderYoy('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Chart 1: JPX (JPY/Kg) — data-year-options="1Y,3Y,5Y" (MAX → null)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá cao su JPX (JPY/Kg)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-jpx"></div>
    </div>
  `);
  const cardJpx = container.lastElementChild;
  const jpxData = parseFindicatorSeries(blockC.jpx);
  function renderJpx(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-jpx', {
      yAxis: [{ title: { text: 'JPY/Kg' } }],
      series: [{ name: 'JPX (JPY/Kg)', data: jpxData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardJpx, renderJpx);
  renderJpx('1Y');

  // Chart 2: Singapore TSR20 (USD Cents/Kg) + WiChart (stale badge)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Cao su Singapore TSR20 (USD Cents/Kg)</span>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="stale-badge" style="display:none"></span>
          <div class="year-btns"></div>
        </div>
      </div>
      <div class="chart-container" id="chart-sgx"></div>
    </div>
  `);
  const cardSgx = container.lastElementChild;
  const sgxData = parseFindicatorSeries(blockC.singapore);

  // WiChart backup — stale ~15 tháng, set badge
  const wiData = parseFindicatorSeries(blockC.wichart_cao_su?.data || blockC.wichart_cao_su);
  if (blockC.wichart_cao_su?.stale) {
    setStaleBadge(cardSgx, 'warn', blockC.wichart_cao_su.stale_reason || 'Dữ liệu đến 02/2025');
  }

  function renderSgx(year) {
    const cutoff = yearToCutoff(year);
    const series = [];
    if (sgxData.length) {
      series.push({ name: 'TSR20 Findicator (USd/Kg)', data: sgxData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] });
    }
    if (wiData.length) {
      series.push({ name: 'WiChart (stale 02/2025)', data: wiData.filter(p => p[0] >= cutoff), color: HC_COLORS[2], dashStyle: 'Dot' });
    }
    if (series.length) {
      createStockChart('chart-sgx', { series });
    } else {
      showEmpty('chart-sgx');
    }
  }
  initYearButtons(cardSgx, renderSgx);
  renderSgx('1Y');
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Biên lợi nhuận Cao su</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  showEmpty('chart-spread', 'Chi phí sản xuất tĩnh — so sánh biên BCTC với biến động giá bán (JPX/TSR20)');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const rows = tickers.map(t => {
    const trRaw = blockE[t]?.trailing;
    const tickerData = trRaw?.[t] || (Array.isArray(trRaw) ? trRaw : []);
    const get = (id) => tickerData.find?.(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = Array.isArray(analyst) ? analyst[0] : analyst;
    return {
      ticker: t,
      marketCap: get(35), pe: get(39), pb: get(40),
      grossMargin: get(2), roe: get(8), dtGrowth: get(163), peFwd: get(154),
      recommendation: rec?.recommend, upside: rec?.upside, targetPrice: rec?.targetPrice,
    };
  });

  const recTag = (r) => {
    if (!r) return '—';
    const map = { BUY: 'tag-buy', HOLD: 'tag-hold', SELL: 'tag-sell' };
    return `<span class="${map[r] || ''}">${r}</span>`;
  };
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v*100).toFixed(1)}%</span>` : '—';
  const num = (v, dp=1) => v != null ? Highcharts.numberFormat(v, dp) : '—';

  container.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th>Ticker</th><th>Vốn hóa (tỷ)</th><th>PE</th><th>PB</th>
          <th>Biên gộp</th><th>ROE</th><th>DT YoY</th>
          <th>Recommend</th><th>Upside</th><th>Target</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.ticker}</td>
            <td>${num(r.marketCap, 0)}</td>
            <td>${num(r.pe)}</td>
            <td>${num(r.pb)}</td>
            <td>${pct(r.grossMargin)}</td>
            <td>${pct(r.roe)}</td>
            <td>${pct(r.dtGrowth)}</td>
            <td>${recTag(r.recommendation)}</td>
            <td>${r.upside != null ? pct(r.upside/100) : '—'}</td>
            <td>${r.targetPrice ? num(r.targetPrice, 0) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function renderBlockF(blockF) {
  const container = document.getElementById('block-f-charts');
  const tickers = Object.keys(blockF || {});

  tickers.forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);

    const tickerData = blockF[ticker];
    const rows = tickerData?.[ticker] || (Array.isArray(tickerData) ? tickerData : []);
    if (!rows?.length) { showEmpty(`chart-bctc-${ticker}`); return; }

    const quarters = [...new Set(rows.map(r => r.period || `${r.year}Q${r.quarter}`))].sort().slice(-8);
    const getQ = (accId) => quarters.map(q => {
      const r = rows.find(x => (x.period || `${x.year}Q${x.quarter}`) === q && x.accountId === accId);
      return r?.value ?? null;
    });

    createChart(`chart-bctc-${ticker}`, {
      chart: { type: 'column' },
      xAxis: { categories: quarters },
      yAxis: [
        { title: { text: 'Tỷ VNĐ' } },
        { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } },
      ],
      series: [
        { name: 'Doanh thu', type: 'column', data: getQ(24), color: HC_COLORS[0] },
        { name: 'LN gộp', type: 'column', data: getQ(28), color: HC_COLORS[2] },
        { name: 'LNST', type: 'column', data: getQ(43), color: HC_COLORS[3] },
        { name: 'Biên gộp %', type: 'line', data: getQ(2), color: HC_COLORS[1], yAxis: 1,
          tooltip: { valueSuffix: '%' } },
      ],
    });
  });
}
