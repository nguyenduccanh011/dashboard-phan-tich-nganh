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
  window.window.renderBlockG(data.block_g, data.tickers, { pe_id: 150, pb_id: 151 });
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
  const tpcp5y  = parseFindicatorSeries((blockA?.bond_yields || []).filter(r => r.nameId === 8));
  const tpcp10y = parseFindicatorSeries((blockA?.bond_yields || []).filter(r => r.nameId === 9));
  const ust10y  = parseFindicatorSeries((blockA?.bond_yields || []).filter(r => r.nameId === 3));

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
    tickers.flatMap(t => {
      const rows = revenues[t]?.type1 || Object.values(revenues[t] || {}).flat() || [];
      return rows.map(r => r.period || `${r.year}Q${r.quarter}`);
    })
  )].sort().slice(-12);

  createChart('chart-ins-revenue', {
    chart: { type: 'column' },
    xAxis: { categories: allQuarters },
    series: tickers.map((t, i) => ({
      name: t,
      color: HC_COLORS[i],
      data: allQuarters.map(q => {
        const rows = revenues[t]?.type1 || Object.values(revenues[t] || {}).flat() || [];
        const r = rows.find(x => (x.period || `${x.year}Q${x.quarter}`) === q);
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
  // corpType=2 (bảo hiểm): accountIds riêng
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 140, pe: 144, pb: 145, roe: 131, roa: 132 },
    columns: ['marketCap', 'pe', 'pb', 'roe', 'roa'],
    pctFields: ['roe', 'roa'],
  });
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
    renderBctcChart(`chart-bctc-${ticker}`, ticker, blockF, {
      series: [
        { name: 'Phí BH gốc',    accId: 125, type: 'column', color: HC_COLORS[0] },
        { name: 'LN gộp HĐ BH', accId: 170, type: 'column', color: HC_COLORS[2] },
        { name: 'LNST',          accId: 191, type: 'column', color: HC_COLORS[3] },
      ],
    });
  });
}
