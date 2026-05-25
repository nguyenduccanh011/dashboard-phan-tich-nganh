// static/js/sector-electricity.js
// Render trang ngành Điện — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorElectricity() {
  let data;
  try {
    const res = await fetch('/api/sector/electricity/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Điện — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Điện';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Điện — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a, data.block_c);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');

  // Chart 1: Than đá ICE (USD/T) + TQ (CNY/T) — dual axis
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá than đá</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-coal"></div>
    </div>
  `);
  const cardCoal = container.lastElementChild;
  const seriesCoalIce = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 68));
  const seriesCoalTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 196));
  function renderCoal(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-coal', {
      yAxis: [
        { title: { text: 'USD/T' } },
        { title: { text: 'CNY/T' }, opposite: true },
      ],
      series: [
        { name: 'ICE (USD/T)', data: seriesCoalIce.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'TQ (CNY/T)', data: seriesCoalTq.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(cardCoal, renderCoal);
  renderCoal('1Y');

  // Chart 2: Khí TN Henry Hub + Dầu Brent — dual axis
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Khí TN & Dầu Brent</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gas-brent"></div>
    </div>
  `);
  const cardGas = container.lastElementChild;
  const seriesGas   = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 66));
  const seriesBrent = parseFindicatorSeries(blockA.macro_35?.filter(r => r.nameId === 65));
  function renderGasBrent(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gas-brent', {
      yAxis: [
        { title: { text: 'USD/MMBtu' } },
        { title: { text: 'USD/Bbl' }, opposite: true },
      ],
      series: [
        { name: 'Henry Hub (USD/MMBtu)', data: seriesGas.filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Brent (USD/Bbl)', data: seriesBrent.filter(p => p[0] >= cutoff), color: HC_COLORS[3], yAxis: 1 },
      ],
    });
  }
  initYearButtons(cardGas, renderGasBrent);
  renderGasBrent('1Y');

  // Chart 3: Giá đầu vào nội địa — Than NK + Dầu FO + Dầu DO (VNĐ)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Giá đầu vào nội địa (12 tháng gần nhất)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-input-domestic"></div>
    </div>
  `);
  const latestPrices = blockA.input_price_latest || {};
  // nameId: 1=Than NK, 2=Dầu FO, 3=Dầu DO, 17=Giá bán điện bình quân
  const domesticItems = [
    { nid: '1', name: 'Than NK (VNĐ/kg)', color: HC_COLORS[0] },
    { nid: '2', name: 'Dầu FO (VNĐ/lít)', color: HC_COLORS[1] },
    { nid: '3', name: 'Dầu DO (VNĐ/lít)', color: HC_COLORS[2] },
    { nid: '17', name: 'Giá bán điện bq (VNĐ/kWh)', color: HC_COLORS[3] },
  ];
  const domesticSeries = domesticItems.map(item => ({
    name: item.name,
    color: item.color,
    data: parseFindicatorSeries(blockA.input_price_trend?.[item.nid]),
  }));
  if (domesticSeries.some(s => s.data.length)) {
    createStockChart('chart-input-domestic', { series: domesticSeries });
  } else {
    showEmpty('chart-input-domestic');
  }

  // Chart 4: Giá khí TN nội địa (USD/MMBTU) — 4,5,6
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Giá khí TN nội địa (USD/MMBTU)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-gas-domestic"></div>
    </div>
  `);
  const gasDomesticItems = [
    { nid: '4', name: 'Pool SE', color: HC_COLORS[0] },
    { nid: '5', name: 'Nam Côn Sơn', color: HC_COLORS[1] },
    { nid: '6', name: 'Cửu Long', color: HC_COLORS[2] },
  ];
  const gasDomesticSeries = gasDomesticItems.map(item => ({
    name: item.name, color: item.color,
    data: parseFindicatorSeries(blockA.input_price_trend?.[item.nid]),
  }));
  if (gasDomesticSeries.some(s => s.data.length)) {
    createStockChart('chart-gas-domestic', { series: gasDomesticSeries });
  } else {
    showEmpty('chart-gas-domestic');
  }
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Cơ cấu nguồn điện % (stacked) — data-year-options="5Y,10Y,All"
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="5Y,10Y,All">
      <div class="chart-header">
        <span class="chart-title">Cơ cấu nguồn điện (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-proportion"></div>
    </div>
  `);
  const cardProp = container.lastElementChild;
  const proportionData = blockB.output_resource_by_proportion;
  function renderProportion(year) {
    if (!proportionData || !proportionData.length) { showEmpty('chart-proportion'); return; }
    const cutoff = yearToCutoff(year === 'All' ? 'MAX' : year);
    const filtered = proportionData.filter(r => {
      const ts = new Date(r.date || r.time).getTime();
      return ts >= cutoff;
    });
    const resourceNames = {
      1: 'Thủy điện', 2: 'Nhiệt than', 3: 'Khí', 5: 'Gió', 6: 'Mặt trời', 7: 'NK & Khác'
    };
    const periods = [...new Set(filtered.map(r => r.date || r.time))].sort();
    const seriesIds = [1, 2, 3, 5, 6, 7];
    createChart('chart-proportion', {
      chart: { type: 'area' },
      plotOptions: { area: { stacking: 'percent' } },
      xAxis: { categories: periods, type: 'category' },
      yAxis: [{ title: { text: '%' }, labels: { format: '{value}%' } }],
      series: seriesIds.map((rid, i) => ({
        name: resourceNames[rid] || `Nguồn ${rid}`,
        color: HC_COLORS[i],
        data: periods.map(p => {
          const row = filtered.find(r => (r.date || r.time) === p && r.resourceId === rid);
          return row?.value ?? null;
        }),
      })),
    });
  }
  initYearButtons(cardProp, renderProportion);
  renderProportion('5Y');

  // Chart 2: Sản lượng per loại nguồn (Tỷ kWh tuyệt đối) — không có year buttons
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Sản lượng điện theo nguồn (Tỷ kWh)</span>
      </div>
      <div class="chart-container" id="chart-resource-value"></div>
    </div>
  `);
  const resourceValueData = blockB.output_resource_by_value || {};
  const resourceNameMap = { '1': 'Thủy điện', '2': 'Nhiệt than', '3': 'Khí', '5': 'Gió', '6': 'Mặt trời', '7': 'NK & Khác', '8': 'Tổng' };
  const resourceSeries = Object.entries(resourceValueData)
    .filter(([rid]) => rid !== '8')
    .map(([rid, rows], i) => ({
      name: resourceNameMap[rid] || `Nguồn ${rid}`,
      color: HC_COLORS[i],
      data: parseFindicatorSeries(rows),
    }));
  if (resourceSeries.some(s => s.data.length)) {
    createStockChart('chart-resource-value', { series: resourceSeries });
  } else {
    showEmpty('chart-resource-value');
  }

  // Chart 3: ENSO forecast + history — data-year-options="1Y,3Y,5Y,All"
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,All">
      <div class="chart-header">
        <span class="chart-title">Chỉ số ENSO (El Niño / La Niña)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-enso"></div>
    </div>
  `);
  const cardEnso = container.lastElementChild;
  const ensoHistory = blockB.enso_history || [];
  const ensoForecast = blockB.enso_forecast || [];
  function renderEnso(year) {
    const cutoff = yearToCutoff(year === 'All' ? 'MAX' : year);
    const histData = parseFindicatorSeries(ensoHistory).filter(p => p[0] >= cutoff);
    const fcastData = parseFindicatorSeries(ensoForecast);
    if (!histData.length && !fcastData.length) { showEmpty('chart-enso'); return; }
    createStockChart('chart-enso', {
      series: [
        { name: 'ENSO lịch sử', data: histData, color: HC_COLORS[0] },
        { name: 'ENSO dự báo', data: fcastData, color: HC_COLORS[1], dashStyle: 'Dash' },
      ],
      yAxis: [{ plotLines: [{ value: 0, color: '#888', width: 1 }] }],
    });
  }
  initYearButtons(cardEnso, renderEnso);
  renderEnso('1Y');

  // Chart 4: Mực nước hồ thủy điện (top 5 hồ theo sản lượng)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Mực nước hồ thủy điện</span>
      </div>
      <div class="chart-container" id="chart-lake"></div>
    </div>
  `);
  const lakeNames = blockB.lake_names || [];
  const lakeLevels = blockB.lake_levels || {};
  const lakeEntries = Object.entries(lakeLevels).slice(0, 5);
  if (lakeEntries.length) {
    createStockChart('chart-lake', {
      series: lakeEntries.map(([lakeId, lakeObj], i) => ({
        name: lakeObj.info?.name || lakeObj.info?.lakeName || `Hồ ${lakeId}`,
        color: HC_COLORS[i],
        data: parseFindicatorSeries(lakeObj.data),
      })),
    });
  } else {
    showEmpty('chart-lake');
  }

  // Chart 5: IIP điện VN YoY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">IIP Điện VN (YoY)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container chart-sm" id="chart-iip"></div>
    </div>
  `);
  const cardIip = container.lastElementChild;
  const iipData = parseFindicatorSeries(blockB.iip_electric);
  function renderIip(year) {
    const cutoff = yearToCutoff(year);
    const filtered = iipData.filter(p => p[0] >= cutoff);
    if (!filtered.length) { showEmpty('chart-iip'); return; }
    createStockChart('chart-iip', {
      series: [{ name: 'IIP Điện YoY (%)', data: filtered, color: HC_COLORS[0] }],
    });
  }
  initYearButtons(cardIip, renderIip);
  renderIip('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');

  // Chart 1: Giá bán điện bình quân monthly
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Giá bán điện bình quân (VNĐ/kWh)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-output-price"></div>
    </div>
  `);
  const outputPriceData = parseFindicatorSeries(blockC.output_price);
  if (outputPriceData.length) {
    createStockChart('chart-output-price', {
      series: [{ name: 'Giá điện bq (VNĐ/kWh)', data: outputPriceData, color: HC_COLORS[0] }],
    });
  } else {
    showEmpty('chart-output-price');
  }

  // Chart 2: Quy hoạch công suất (bar tĩnh)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Quy hoạch công suất theo nguồn (MW)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-policy-resource"></div>
    </div>
  `);
  const policyResource = blockC.policy_resource;
  if (policyResource && policyResource.length) {
    const categories = policyResource.map(r => r.name || r.resourceName || '');
    const values = policyResource.map(r => r.value || r.capacity || 0);
    createChart('chart-policy-resource', {
      chart: { type: 'bar' },
      xAxis: { categories },
      series: [{ name: 'Công suất (MW)', data: values, color: HC_COLORS[0] }],
    });
  } else {
    showEmpty('chart-policy-resource');
  }

  // Chart 3: Sản lượng điện mặt trời mái nhà theo năm
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Điện mặt trời mái nhà — Công suất lắp đặt (MW)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-solar"></div>
    </div>
  `);
  const solarData = blockC.solar_desc;
  if (solarData && solarData.length) {
    const years = solarData.map(r => r.year || r.name || '');
    const caps = solarData.map(r => r.capacity || r.value || 0);
    createChart('chart-solar', {
      chart: { type: 'column' },
      xAxis: { categories: years },
      series: [{ name: 'Công suất ĐMTMN (MW)', data: caps, color: HC_COLORS[4] }],
    });
  } else {
    showEmpty('chart-solar');
  }
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Biên giá điện — Chi phí NVL</span></div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  showEmpty('chart-spread', 'Giá điện bq (VNĐ/kWh) vs Chi phí than NK × USD/VND');
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
