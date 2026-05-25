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
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
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
    marketRows.filter(r => !r.nameId || r.nameId === 1 || r.nameId === 'liquidity')
  );
  const vnidxData = parseFindicatorSeries(marketRows.filter(r => r.nameId === 3));
  const vn30Data  = parseFindicatorSeries(marketRows.filter(r => r.nameId === 2));

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
  const mrNameIds = [...new Set(marginRows.map(r => r.nameId))].slice(0, 4);
  const mrSeriesData = mrNameIds.map((nid, i) => ({
    name: marginRows.find(r => r.nameId === nid)?.name || `Kỳ hạn ${nid}`,
    data: parseFindicatorSeries(marginRows.filter(r => r.nameId === nid)),
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


function renderBlockB(blockB) {
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

  // Chart 2: Thị phần môi giới time-series (sstock, quarterly)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Thị phần môi giới theo quý</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-share-ts"></div>
    </div>
  `);
  const tsCard = container.querySelector('[id="chart-share-ts"]').closest('.chart-card');
  const marketShareTs = blockB.market_share_ts || {};
  const topCtck = ['SSI', 'VPS', 'TCBS', 'VCI', 'HCM'];
  const tsSeriesData = topCtck.map((ctck, i) => {
    const raw = marketShareTs[ctck];
    const rows = raw?.dataSeriesValuesInfo || raw?.data || (Array.isArray(raw) ? raw : []);
    return {
      name: ctck,
      data: rows.map(r => [
        new Date(r.date || r.period || r.start_date).getTime(),
        r.value != null ? r.value : null,
      ]).filter(p => !isNaN(p[0]) && p[1] != null),
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
  const breadthData = parseFindicatorSeries(bpRows.filter(r => r.nameId === 19));
  const peData = parseFindicatorSeries(bpRows.filter(r => r.nameId === 22));
  const pbData = parseFindicatorSeries(bpRows.filter(r => r.nameId === 24));

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
      const rows = Array.isArray(marginDebt[t]) ? marginDebt[t] : (marginDebt[t]?.data || []);
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
    const nid1 = mfRows.filter(r => r.name_id === 1 || r.nameId === 1);
    const nid2 = mfRows.filter(r => r.name_id === 2 || r.nameId === 2);
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
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const get = (rows, id) => (rows || []).find(r => r.accountId === id)?.value;

  const rows = tickers.map(t => {
    const tr = blockE[t]?.trailing;
    const analyst = blockE[t]?.analyst;
    const rec = analyst?.recommendation;
    return {
      ticker: t,
      grossMargin: get(tr, 99),         // Biên LN gộp
      roe: get(tr, 104),                // ROE
      roa: get(tr, 105),                // ROA
      shareHose: get(tr, 107),          // Thị phần MG HOSE
      shareHnx: get(tr, 160),           // Thị phần MG HNX
      shareUpcom: get(tr, 161),         // Thị phần MG UPCOM
      marginDebt: get(tr, 108),         // Dư nợ margin
      marginRatio: get(tr, 109),        // Margin/Vốn CSH
      recommendation: rec?.type,
      upside: rec?.upside,
      targetPrice: rec?.targetPrice,
    };
  });

  const recTag = (r) => {
    if (!r) return '—';
    const map = { BUY: 'tag-buy', HOLD: 'tag-hold', SELL: 'tag-sell' };
    return `<span class="${map[r] || ''}">${r}</span>`;
  };
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v * 100).toFixed(2)}%</span>` : '—';
  const num = (v, dp = 1) => v != null ? Highcharts.numberFormat(v, dp) : '—';
  const share = v => v != null ? `${v.toFixed(2)}%` : '—';

  container.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Biên LN gộp</th>
          <th>ROE</th>
          <th>ROA</th>
          <th>Thị phần HOSE</th>
          <th>Thị phần HNX</th>
          <th>Thị phần UPCOM</th>
          <th>Dư nợ margin (tỷ)</th>
          <th>Margin/Vốn CSH</th>
          <th>Recommend</th>
          <th>Upside</th>
          <th>Target</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.ticker}</td>
            <td>${pct(r.grossMargin)}</td>
            <td>${pct(r.roe)}</td>
            <td>${pct(r.roa)}</td>
            <td>${share(r.shareHose)}</td>
            <td>${share(r.shareHnx)}</td>
            <td>${share(r.shareUpcom)}</td>
            <td>${num(r.marginDebt, 0)}</td>
            <td>${r.marginRatio != null ? r.marginRatio.toFixed(2) + 'x' : '—'}</td>
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
  const tickers = Object.keys(blockF || {});

  tickers.forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);

    const rows = blockF[ticker];
    if (!rows?.length) { showEmpty(`chart-bctc-${ticker}`); return; }

    const quarters = [...new Set(rows.map(r => r.period))].sort().slice(-8);
    const getQ = (accId) => quarters.map(q => {
      const r = rows.find(x => x.period === q && x.accountId === accId);
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
        { name: 'LN gộp',    type: 'column', data: getQ(28), color: HC_COLORS[2] },
        { name: 'LNST',      type: 'column', data: getQ(43), color: HC_COLORS[3] },
        { name: 'Biên gộp %', type: 'line', data: getQ(2), color: HC_COLORS[1], yAxis: 1,
          tooltip: { valueSuffix: '%' } },
      ],
    });
  });
}
