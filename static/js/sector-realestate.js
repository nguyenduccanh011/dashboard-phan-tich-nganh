// static/js/sector-realestate.js
// Render trang ngành Bất động sản — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorRealEstate() {
  let data;
  try {
    const res = await fetch('/api/sector/realestate/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Bất động sản — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Bất động sản';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Bất động sản — Sector Hub';

  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Lãi suất huy động 12M/24M/36M
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất huy động (12M / 24M / 36M)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-interest-rate"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const rateRows = Array.isArray(blockB.interest_rates) ? blockB.interest_rates : [];
  // nameId=6=12M, nameId=9=24M, nameId=10=36M (⚠ data 36M đến 08/2024)
  // Average across banks per date to get a single representative line
  const byNameId = (id) => {
    const byDate = {};
    rateRows.filter(r => r.name_id === id).forEach(r => {
      const v = parseFloat(r.value);
      if (!isNaN(v)) {
        if (!byDate[r.date]) byDate[r.date] = { sum: 0, n: 0 };
        byDate[r.date].sum += v;
        byDate[r.date].n += 1;
      }
    });
    return Object.entries(byDate)
      .map(([date, { sum, n }]) => [new Date(date).getTime(), sum / n])
      .filter(([t]) => !isNaN(t))
      .sort((a, b) => a[0] - b[0]);
  };

  // Stale badge cho 36M
  setStaleBadge(card1, 'warn', 'Lãi suất 36M: dữ liệu đến 08/2024');

  function renderRate(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-interest-rate', {
      series: [
        { name: 'Lãi suất 12M (%)', data: byNameId(6).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Lãi suất 24M (%)', data: byNameId(9).filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Lãi suất 36M (⚠ đến 08/2024)', data: byNameId(10).filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card1, renderRate);
  renderRate('1Y');

  // Chart 2: Vốn đầu tư NSNN & Đầu tư xã hội
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Vốn đầu tư NSNN & Đầu tư xã hội (catalyst BĐS)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-investment-re"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const capexRows = parseFindicatorSeries(
    Array.isArray(blockB.capex_public) ? blockB.capex_public : [], 'date', 'value'
  );
  const socialRows = parseFindicatorSeries(
    Array.isArray(blockB.social_investment) ? blockB.social_investment : [], 'date', 'value'
  );

  function renderInvestment(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-investment-re', {
      series: [
        { name: 'Vốn NSNN (Tỷ VNĐ)', data: capexRows.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Đầu tư xã hội (Tỷ VNĐ)', data: socialRows.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
      ],
    });
  }
  initYearButtons(card2, renderInvestment);
  renderInvestment('1Y');

  // Chart 3: BĐS Trung Quốc — Đầu tư phát triển + Doanh thu + Diện tích sàn
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">BĐS Trung Quốc (YoY%) — tín hiệu đầu tư toàn cầu</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-china-re"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const cnInvest = parseFindicatorSeries(Array.isArray(blockB.china_re_invest) ? blockB.china_re_invest : [], 'date', 'value');
  const cnSales = parseFindicatorSeries(Array.isArray(blockB.china_re_sales) ? blockB.china_re_sales : [], 'date', 'value');
  const cnArea = parseFindicatorSeries(Array.isArray(blockB.china_re_area) ? blockB.china_re_area : [], 'date', 'value');

  if (!cnInvest.length && !cnSales.length && !cnArea.length) {
    showEmpty('chart-china-re', 'Chưa có dữ liệu BĐS Trung Quốc');
  } else {
    function renderChinaRe(year) {
      const cutoff = yearToCutoff(year);
      createChart('chart-china-re', {
        chart: { type: 'line' },
        yAxis: [{ title: { text: 'YoY%' }, plotLines: [{ value: 0, color: '#888', dashStyle: 'dash', width: 1 }] }],
        series: [
          { name: 'Đầu tư PT BĐS (YoY%)', data: cnInvest.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
          { name: 'DT bán BĐS (YoY%)', data: cnSales.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
          { name: 'Diện tích sàn (YoY%)', data: cnArea.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
        ],
      });
    }
    initYearButtons(card3, renderChinaRe);
    renderChinaRe('1Y');
  }

  // Chính sách pháp lý BĐS — hiển thị dạng danh sách
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Chính sách pháp lý BĐS (Luật có hiệu lực)</span></div>
      <div id="laws-list" class="text-muted" style="padding:12px;max-height:260px;overflow-y:auto;font-size:13px;"></div>
    </div>
  `);

  const lawsData = blockB.laws;
  const lawsList = document.getElementById('laws-list');
  if (!lawsData || typeof lawsData !== 'object') {
    lawsList.textContent = 'Không có dữ liệu chính sách';
  } else {
    const years = Object.keys(lawsData).sort().reverse();
    lawsList.innerHTML = years.map(yr => {
      const items = Array.isArray(lawsData[yr]) ? lawsData[yr] : [];
      const links = items.map(i =>
        `<a href="${i.document_url || '#'}" target="_blank" rel="noopener" style="color:#4fc3f7">${i.document_name || i.date_effective || i.date_issue}</a>`
      ).join('<br>');
      return `<strong>${yr}:</strong><br>${links || '—'}<br><br>`;
    }).join('');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Bảng định giá per-DN (VHM, NVL, PDR, DXG, KDH)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Định giá các DN BĐS</span></div>
      <div id="valuation-table" style="overflow-x:auto;"></div>
    </div>
  `);

  const valuations = blockC.valuations || {};
  const tickers = Object.keys(valuations);
  if (!tickers.length) {
    document.getElementById('valuation-table').innerHTML = '<p class="text-muted">Không có dữ liệu</p>';
    return;
  }

  const num = (v, dp = 2) => v != null ? Highcharts.numberFormat(v, dp) : '—';
  const rows = tickers.map(t => {
    const val = Array.isArray(valuations[t]) ? valuations[t][0] : valuations[t];
    return {
      ticker: t,
      pbMin: val?.min,
      pbLatest: val?.latest,
      pbMedian: val?.median,
      pbMax: val?.max,
      latestDate: val?.latest_date ? val.latest_date.slice(0, 10) : '—',
    };
  });

  document.getElementById('valuation-table').innerHTML = `
    <table class="stock-table">
      <thead><tr><th>Ticker</th><th>P/B mới nhất</th><th>P/B trung vị</th><th>P/B min</th><th>P/B max</th><th>Ngày</th></tr></thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.ticker}</td>
            <td>${num(r.pbLatest)}</td>
            <td>${num(r.pbMedian)}</td>
            <td>${num(r.pbMin)}</td>
            <td>${num(r.pbMax)}</td>
            <td>${r.latestDate}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
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
