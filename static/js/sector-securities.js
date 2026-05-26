// static/js/sector-securities.js
// Render trang ngành Chứng khoán — 6 khối A–F
// corpType=3: accountIds TRAILING riêng (99/104/105/107/108/109...)

(async function SectorSecurities() {
  let data;
  try {
    const res = await fetch('/api/sector/securities/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Chứng khoán — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Chứng khoán';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Chứng khoán — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b, data.block_d);
  renderBlockC(data.block_c);
  renderBlockD(data.block_d);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  renderBlockG(data.block_g, data.tickers, { pe_id: 152, pb_id: 153 });
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Thanh khoản TTCK (macroItemId=134)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Thanh khoản TTCK (Tỷ VNĐ/phiên)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-market-liquidity"></div>
    </div>
  `);
  const liqCard = container.querySelector('[id="chart-market-liquidity"]').closest('.chart-card');
  const marketRows = blockA.market_data || [];
  // nameId default (thanh khoản) — lấy nameId=1 hoặc rows không có nameId cụ thể
  const liqData = parseFindicatorSeries(
    marketRows.filter(r => !r.name_id || r.name_id === 1 || r.name_id === 'liquidity')
  );
  const vnidxData = parseFindicatorSeries(marketRows.filter(r => r.name_id === 3));
  const vn30Data  = parseFindicatorSeries(marketRows.filter(r => r.name_id === 2));

  function renderLiquidity(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-market-liquidity', {
      yAxis: [
        { title: { text: 'Tỷ VNĐ' } },
        { title: { text: 'VNINDEX' }, opposite: true },
      ],
      series: [
        { name: 'Thanh khoản', type: 'column', data: liqData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'VNINDEX', type: 'line', data: vnidxData.filter(p => p[0] >= cutoff), color: HC_COLORS[1], yAxis: 1 },
        { name: 'VN30', type: 'line', data: vn30Data.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(liqCard, renderLiquidity);
  renderLiquidity('1Y');

  // Chart 2: Lãi suất vay margin (proxy VNIBOR)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lãi suất vay margin (proxy)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-margin-rate"></div>
    </div>
  `);
  const mrCard = container.querySelector('[id="chart-margin-rate"]').closest('.chart-card');
  const marginRows = blockA.margin_rate || [];
  const mrNameIds = [...new Set(marginRows.map(r => r.name_id))].slice(0, 4);
  const mrSeriesData = mrNameIds.map((nid, i) => ({
    name: marginRows.find(r => r.name_id === nid)?.name || `Kỳ hạn ${nid}`,
    data: parseFindicatorSeries(marginRows.filter(r => r.name_id === nid)),
    color: HC_COLORS[i],
  }));

  function renderMarginRate(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-margin-rate', {
      yAxis: [{ title: { text: '%/năm' } }],
      series: mrSeriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(mrCard, renderMarginRate);
  renderMarginRate('1Y');
}


function renderBlockB(blockB, blockD) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Thị phần môi giới tất cả CTCK (pie/bar)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Thị phần môi giới CTCK</span>
      </div>
      <div class="chart-container chart-lg" id="chart-brokerage-share"></div>
    </div>
  `);
  const shareData = blockB.brokerage_share;
  const companies = Array.isArray(shareData) ? shareData : (shareData?.data || []);
  if (companies.length) {
    // Lấy top 15
    const top15 = [...companies].sort((a, b) => (b.share || b.value || 0) - (a.share || a.value || 0)).slice(0, 15);
    createChart('chart-brokerage-share', {
      chart: { type: 'bar' },
      xAxis: { categories: top15.map(c => c.ticket || c.name) },
      yAxis: [{ title: { text: 'Thị phần %' }, labels: { format: '{value:.2f}%' } }],
      series: [{
        name: 'Thị phần',
        data: top15.map(c => c.share || c.value || null),
        color: HC_COLORS[0],
      }],
    });
  } else {
    showEmpty('chart-brokerage-share');
  }

  // Chart 2: Thị phần môi giới HOSE theo quý (từ block_d TRAILING accId=107)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Thị phần môi giới HOSE theo quý</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-share-ts"></div>
    </div>
  `);
  const tsCard = container.querySelector('[id="chart-share-ts"]').closest('.chart-card');
  const topCtck = ['SSI', 'VND', 'HCM', 'MBS', 'VCI'];
  const tsSeriesData = topCtck.map((ctck, i) => {
    const rows = getTickerRows(blockD, ctck).filter(r => r.accountId === 107);
    return {
      name: ctck,
      data: rows.map(r => {
        const month = (r.quarter - 1) * 3 + 1;
        return [Date.UTC(r.year, month - 1, 1), r.value != null ? parseFloat((r.value * 100).toFixed(2)) : null];
      }).filter(p => p[1] != null).sort((a, b) => a[0] - b[0]),
      color: HC_COLORS[i],
    };
  }).filter(s => s.data.length > 0);

  function renderShareTs(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-share-ts', {
      yAxis: [{ title: { text: '%' }, labels: { format: '{value:.2f}%' } }],
      series: tsSeriesData.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(tsCard, renderShareTs);
  renderShareTs('3Y');

  // Chart 3: PE/PB TTCK VN + Breadth
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">PE/PB TTCK & Breadth</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-market-pe-pb"></div>
    </div>
  `);
  const pepbCard = container.querySelector('[id="chart-market-pe-pb"]').closest('.chart-card');
  const bpRows = blockB.market_breadth_pe || [];
  const breadthData = parseFindicatorSeries(bpRows.filter(r => r.name_id === 19));
  const peData = parseFindicatorSeries(bpRows.filter(r => r.name_id === 22));
  const pbData = parseFindicatorSeries(bpRows.filter(r => r.name_id === 24));

  function renderPePb(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-market-pe-pb', {
      yAxis: [
        { title: { text: 'PE / PB' } },
        { title: { text: '% CP > SMA200' }, opposite: true },
      ],
      series: [
        { name: 'PE', data: peData.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'PB', data: pbData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Breadth >SMA200', data: breadthData.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(pepbCard, renderPePb);
  renderPePb('1Y');

  // Chart 4: Dư nợ margin tổng hợp
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Dư nợ margin per CTCK</span>
      </div>
      <div class="chart-container" id="chart-margin-debt"></div>
    </div>
  `);
  const marginDebt = blockB.margin_debt || {};
  const mdTickers = Object.keys(marginDebt).filter(t => !marginDebt[t]?.error);
  if (mdTickers.length) {
    const mdValues = mdTickers.map(t => {
      const rows = marginDebt[t]?.[t] || marginDebt[t]?.data || [];
      const r = rows.find(x => x.accountId === 108);
      return r?.value ?? null;
    });
    createChart('chart-margin-debt', {
      chart: { type: 'bar' },
      xAxis: { categories: mdTickers },
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: [{ name: 'Dư nợ margin', data: mdValues, color: HC_COLORS[3] }],
    });
  } else {
    showEmpty('chart-margin-debt');
  }
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Dòng tiền ròng TTCK
  const moneyFlow = blockC?.money_flow;
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Dòng tiền ròng TTCK</span>
      </div>
      <div class="chart-container" id="chart-money-flow"></div>
    </div>
  `);
  const mfRows = Array.isArray(moneyFlow) ? moneyFlow : (moneyFlow?.data || []);
  if (mfRows.length) {
    const nid1 = mfRows.filter(r => r.name_id === 1 || r.name_id === 1);
    const nid2 = mfRows.filter(r => r.name_id === 2 || r.name_id === 2);
    const toTs = rows => rows.map(r => [
      new Date(r.start_date || r.date || r.month).getTime(),
      r.value ?? null,
    ]).filter(p => !isNaN(p[0]) && p[1] != null);

    createStockChart('chart-money-flow', {
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: [
        { name: 'Dòng tiền ròng (1)', data: toTs(nid1), color: HC_COLORS[0], type: 'column' },
        { name: 'Dòng tiền ròng (2)', data: toTs(nid2), color: HC_COLORS[1], type: 'column' },
      ],
    });
  } else {
    showEmpty('chart-money-flow');
  }

  // Revenue structure per CTCK (SSI làm default)
  const defaultTicker = 'SSI';
  const tickerData = blockC[defaultTicker];
  if (tickerData?.revenue) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">Cơ cấu DT ${defaultTicker}</span>
        </div>
        <div class="chart-container chart-lg" id="chart-revenue-${defaultTicker}"></div>
      </div>
    `);
    const revRows = Array.isArray(tickerData.revenue) ? tickerData.revenue : (tickerData.revenue?.data || []);
    if (revRows.length) {
      const periods = [...new Set(revRows.map(r => r.period))].sort().slice(-8);
      const types = [...new Set(revRows.map(r => r.type))];
      createChart(`chart-revenue-${defaultTicker}`, {
        chart: { type: 'column' },
        xAxis: { categories: periods },
        yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
        plotOptions: { column: { stacking: 'normal' } },
        series: types.map((t, i) => ({
          name: `Loại ${t}`,
          data: periods.map(p => {
            const r = revRows.find(x => x.period === p && x.type === t);
            return r?.value ?? null;
          }),
          color: HC_COLORS[i % HC_COLORS.length],
        })),
      });
    } else {
      showEmpty(`chart-revenue-${defaultTicker}`);
    }
  }
}


function renderBlockE(blockE) {
  // corpType=3 (chứng khoán): accountIds khác biệt hoàn toàn
  // Bug cũ: get(tr, id) truyền object thay vì array → tất cả giá trị = undefined
  renderValuationTable('block-e-table', blockE, {
    accountMap: {
      grossMargin: 99, roe: 104, roa: 105,
      shareHose: 107, shareHnx: 160, shareUpcom: 161,
      marginDebt: 108, marginRatio: 109,
    },
    columns: ['grossMargin', 'roe', 'roa', 'shareHose', 'shareHnx', 'shareUpcom', 'marginDebt', 'marginRatio'],
    pctFields: ['grossMargin', 'roe', 'roa'],
  });
}


function renderBlockD(blockD) {
  const container = document.getElementById('block-d-charts');
  const tickers = ['SSI', 'VND', 'HCM', 'MBS', 'VCI'];

  // Chart 1: Thị phần HOSE theo quý per CTCK (accId=107, fraction → %)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Thị phần môi giới HOSE theo quý</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-d-share-hose"></div>
    </div>
  `);
  const shareHoseCard = container.querySelector('[id="chart-d-share-hose"]').closest('.chart-card');
  const shareHoseSeries = tickers.map((t, i) => {
    const rows = getTickerRows(blockD, t).filter(r => r.accountId === 107);
    return {
      name: t,
      data: rows.map(r => [Date.UTC(r.year, (r.quarter - 1) * 3, 1), parseFloat((r.value * 100).toFixed(2))])
        .filter(p => p[1] != null).sort((a, b) => a[0] - b[0]),
      color: HC_COLORS[i],
    };
  }).filter(s => s.data.length > 0);

  function renderShareHose(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-d-share-hose', {
      yAxis: [{ title: { text: '%' }, labels: { format: '{value:.2f}%' } }],
      series: shareHoseSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(shareHoseCard, renderShareHose);
  renderShareHose('3Y');

  // Chart 2: Tỷ lệ cho vay ký quỹ/Vốn CSH theo quý (accId=109, fraction → %)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tỷ lệ margin/Vốn CSH theo quý</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-d-margin-ratio"></div>
    </div>
  `);
  const marginRatioCard = container.querySelector('[id="chart-d-margin-ratio"]').closest('.chart-card');
  const marginRatioSeries = tickers.map((t, i) => {
    const rows = getTickerRows(blockD, t).filter(r => r.accountId === 109);
    return {
      name: t,
      data: rows.map(r => [Date.UTC(r.year, (r.quarter - 1) * 3, 1), parseFloat((r.value * 100).toFixed(1))])
        .filter(p => p[1] != null).sort((a, b) => a[0] - b[0]),
      color: HC_COLORS[i],
    };
  }).filter(s => s.data.length > 0);

  function renderMarginRatio(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-d-margin-ratio', {
      yAxis: [{ title: { text: '%' }, labels: { format: '{value:.0f}%' } }],
      series: marginRatioSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(marginRatioCard, renderMarginRatio);
  renderMarginRatio('3Y');

  // Chart 3: Tăng trưởng dư nợ margin QoQ (accId=108, fraction → %)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tăng trưởng dư nợ margin QoQ</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-d-margin-growth"></div>
    </div>
  `);
  const marginGrowthCard = container.querySelector('[id="chart-d-margin-growth"]').closest('.chart-card');
  const marginGrowthSeries = tickers.map((t, i) => {
    const rows = getTickerRows(blockD, t).filter(r => r.accountId === 108);
    return {
      name: t,
      data: rows.map(r => [Date.UTC(r.year, (r.quarter - 1) * 3, 1), parseFloat((r.value * 100).toFixed(1))])
        .filter(p => p[1] != null).sort((a, b) => a[0] - b[0]),
      color: HC_COLORS[i],
    };
  }).filter(s => s.data.length > 0);

  function renderMarginGrowth(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-d-margin-growth', {
      yAxis: [{ title: { text: '%' } }],
      series: marginGrowthSeries.map(s => ({ ...s, data: s.data.filter(p => p[0] >= cutoff) })),
    });
  }
  initYearButtons(marginGrowthCard, renderMarginGrowth);
  renderMarginGrowth('3Y');
}


function renderBlockF(blockF) {
  const container = document.getElementById('block-f-charts');
  // corpType=3 INCOME_STATEMENT: 56=DT môi giới, 62=Doanh thu HĐ, 95=KQ HĐ, 106=LNST
  const securitiesSeries = [
    { name: 'Doanh thu HĐ', accId: 62,  type: 'column', color: HC_COLORS[0] },
    { name: 'DT môi giới',  accId: 56,  type: 'column', color: HC_COLORS[2] },
    { name: 'KQ HĐ',        accId: 95,  type: 'column', color: HC_COLORS[4] },
    { name: 'LNST',         accId: 106, type: 'column', color: HC_COLORS[3] },
  ];
  Object.keys(blockF || {}).forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 năm</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);
    renderBctcChart(`chart-bctc-${ticker}`, ticker, blockF, { series: securitiesSeries });
  });
}
