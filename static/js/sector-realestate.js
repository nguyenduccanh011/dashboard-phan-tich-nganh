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
  const byNameId = (id) => parseFindicatorSeries(rateRows.filter(r => r.nameId === id));

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
        `<a href="${i.url || '#'}" target="_blank" rel="noopener" style="color:#4fc3f7">${i.name || i.date}</a>`
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

  const num = (v, dp = 1) => v != null ? Highcharts.numberFormat(v, dp) : '—';
  const rows = tickers.map(t => {
    const val = Array.isArray(valuations[t]) ? valuations[t][0] : valuations[t];
    return {
      ticker: t,
      nav: val?.nav || val?.NAV,
      pe: val?.pe || val?.PE,
      pb: val?.pb || val?.PB,
      premium: val?.premium || val?.navPremium,
    };
  });

  document.getElementById('valuation-table').innerHTML = `
    <table class="stock-table">
      <thead><tr><th>Ticker</th><th>NAV (Tỷ)</th><th>PE</th><th>PB</th><th>Premium/Discount NAV</th></tr></thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.ticker}</td>
            <td>${num(r.nav, 0)}</td>
            <td>${num(r.pe)}</td>
            <td>${num(r.pb)}</td>
            <td>${r.premium != null ? `${(r.premium * 100).toFixed(1)}%` : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE);
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const rows = tickers.map(t => {
    const tr = blockE[t]?.trailing;
    const tickerData = tr?.[t] || (Array.isArray(tr) ? tr : []);
    const get = (id) => tickerData.find?.(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = Array.isArray(analyst) ? analyst[0] : analyst;
    return {
      ticker: t,
      marketCap: get(35), pe: get(39), pb: get(40),
      grossMargin: get(2), roe: get(8), dtGrowth: get(163),
      recommendation: rec?.recommend, upside: rec?.upside, targetPrice: rec?.targetPrice,
    };
  });

  const recTag = (r) => {
    if (!r) return '—';
    const map = { BUY: 'tag-buy', HOLD: 'tag-hold', SELL: 'tag-sell' };
    return `<span class="${map[r] || ''}">${r}</span>`;
  };
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v * 100).toFixed(1)}%</span>` : '—';
  const num = (v, dp = 1) => v != null ? Highcharts.numberFormat(v, dp) : '—';

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
            <td>${r.upside != null ? pct(r.upside / 100) : '—'}</td>
            <td>${r.targetPrice ? num(r.targetPrice, 0) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function renderBlockF(blockF) {
  const container = document.getElementById('block-f-charts');
  const tickers = Object.keys(blockF);

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
