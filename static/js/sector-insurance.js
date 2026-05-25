// static/js/sector-insurance.js
// Render trang ngành Bảo hiểm — 6 khối A–F
// corpType=2, loss ratio + combined ratio tính client-side

(async function SectorInsurance() {
  let data;
  try {
    const res = await fetch('/api/sector/insurance/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Bảo hiểm — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Bảo hiểm';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Bảo hiểm — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_e);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart: Lợi suất TPCP + FED rate
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Lợi suất TPCP VN & UST (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-bond-yield"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const tpcp5y  = parseFindicatorSeries((blockA?.tpcp || []).filter(r => r.nameId === 8));
  const tpcp10y = parseFindicatorSeries((blockA?.tpcp || []).filter(r => r.nameId === 9));
  const ust10y  = parseFindicatorSeries((blockA?.tpcp || []).filter(r => r.nameId === 3));

  function renderBondYield(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-bond-yield', {
      yAxis: [{ title: { text: '%' }, labels: { format: '{value}%' } }],
      series: [
        { name: 'TPCP VN 5Y', data: tpcp5y.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TPCP VN 10Y', data: tpcp10y.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'UST 10Y', data: ust10y.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card1, renderBondYield);
  renderBondYield('1Y');

  // Chart: Lãi suất huy động + FED
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất huy động 12M & FED rate (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-deposit-fed"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const deposit = parseFindicatorSeries(blockA?.deposit_rate);
  const fed     = parseFindicatorSeries(blockA?.fed_rate);

  function renderDepositFed(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-deposit-fed', {
      series: [
        { name: 'Lãi suất HĐ 12M', data: deposit.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'FED rate', data: fed.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(card2, renderDepositFed);
  renderDepositFed('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: Phí BH gốc per-DN theo quý
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Doanh thu phí BH gốc theo quý (Tỷ VNĐ)</span>
      </div>
      <div class="chart-container chart-lg" id="chart-ins-revenue"></div>
    </div>
  `);

  const revenues = blockB?.insurance_revenue || {};
  const tickers = Object.keys(revenues);

  if (!tickers.length) {
    showEmpty('chart-ins-revenue');
    return;
  }

  const allQuarters = [...new Set(
    tickers.flatMap(t => (revenues[t] || []).map(r => r.period || `${r.year}Q${r.quarter}`))
  )].sort().slice(-12);

  createChart('chart-ins-revenue', {
    chart: { type: 'column' },
    xAxis: { categories: allQuarters },
    series: tickers.map((t, i) => ({
      name: t,
      color: HC_COLORS[i],
      data: allQuarters.map(q => {
        const r = (revenues[t] || []).find(x => (x.period || `${x.year}Q${x.quarter}`) === q);
        return r?.value ?? null;
      }),
    })),
  });
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Phí BH gốc — xem Khối B</span></div>
      <div class="chart-container chart-sm" id="chart-ins-c"></div>
    </div>
  `);
  showEmpty('chart-ins-c', 'Không có giá bán riêng — xem doanh thu phí BH ở Khối B');
}


function renderBlockD(blockE) {
  // Loss ratio & Combined ratio tính từ IS corpType=2
  const container = document.getElementById('block-d-charts');

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Loss ratio & Combined ratio (%)</span></div>
      <div class="chart-container chart-lg" id="chart-ins-ratios"></div>
    </div>
  `);

  // Lấy IS data từ block_e — ticker đầu tiên để minh hoạ aggregate
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { showEmpty('chart-ins-ratios'); return; }

  // Tính ratio per ticker, lấy quý gần nhất
  const ratioRows = [];
  tickers.forEach(t => {
    const ts = blockE[t]?.income_statement;
    const rows = ts?.[t] || (Array.isArray(ts) ? ts : []);
    if (!rows.length) return;
    const quarters = [...new Set(rows.map(r => r.period || `${r.year}Q${r.quarter}`))].sort().slice(-8);
    const get = (q, id) => rows.find(x => (x.period || `${x.year}Q${x.quarter}`) === q && x.accountId === id)?.value;
    quarters.forEach(q => {
      const phi = get(q, 132);
      const boi = get(q, 143);
      const qldn = get(q, 176);
      if (phi && boi) {
        ratioRows.push({
          ticker: t, quarter: q,
          lossRatio: (boi / phi) * 100,
          combinedRatio: phi ? ((boi + (qldn || 0)) / phi) * 100 : null,
        });
      }
    });
  });

  if (!ratioRows.length) {
    showEmpty('chart-ins-ratios', 'Loss ratio = Bồi thường / Phí BH thuần. Combined = (Bồi thường + QLDN) / Phí BH thuần');
    return;
  }

  const quarters = [...new Set(ratioRows.map(r => r.quarter))].sort().slice(-8);
  const tickerList = [...new Set(ratioRows.map(r => r.ticker))];

  createChart('chart-ins-ratios', {
    chart: { type: 'line' },
    xAxis: { categories: quarters },
    yAxis: [{ title: { text: '%' }, plotLines: [
      { value: 65, color: 'orange', dashStyle: 'dash', width: 1, label: { text: 'Loss 65%' } },
      { value: 100, color: 'red', dashStyle: 'dash', width: 1, label: { text: 'Combined 100%' } },
    ]}],
    series: tickerList.flatMap((t, i) => [
      {
        name: `${t} Loss ratio`,
        color: HC_COLORS[i],
        data: quarters.map(q => ratioRows.find(r => r.ticker === t && r.quarter === q)?.lossRatio ?? null),
      },
      {
        name: `${t} Combined`,
        color: HC_COLORS[i],
        dashStyle: 'Dash',
        data: quarters.map(q => ratioRows.find(r => r.ticker === t && r.quarter === q)?.combinedRatio ?? null),
      },
    ]),
  });
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const rows = tickers.map(t => {
    const tr = blockE[t]?.trailing;
    const tickerData = tr?.[t] || (Array.isArray(tr) ? tr : []);
    const get = (id) => tickerData.find?.(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = Array.isArray(analyst) ? analyst[0] : analyst;
    return {
      ticker: t,
      marketCap: get(140), pe: get(144), pb: get(145),
      roe: get(131), roa: get(132),
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
          <th>ROE</th><th>ROA</th>
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
            <td>${pct(r.roe)}</td>
            <td>${pct(r.roa)}</td>
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
  Object.keys(blockF || {}).forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý (corpType=2)</span></div>
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
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: [
        { name: 'Phí BH gốc', type: 'column', data: getQ(125), color: HC_COLORS[0] },
        { name: 'LN gộp HĐ BH', type: 'column', data: getQ(170), color: HC_COLORS[2] },
        { name: 'LNST', type: 'column', data: getQ(191), color: HC_COLORS[3] },
      ],
    });
  });
}
