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
  renderBlockG(data.block_g, data.tickers, {});
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
  const seriesCoalIce = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 68));
  const seriesCoalTq  = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 196));
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
  const seriesGas   = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 66));
  const seriesBrent = parseFindicatorSeries(blockA.macro_35?.filter(r => r.name_id === 65));
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
          const row = filtered.find(r => (r.date || r.time) === p && r.name_id === rid);
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
  // enso_history: {date, lanina, elnino} — combined index = elnino + lanina (lanina is negative)
  function parseEnsoHistory(rows) {
    if (!rows || !rows.length) return [];
    const flat = Array.isArray(rows[0]) ? rows.flat() : rows;
    return flat
      .map(r => {
        const t = new Date(r.date).getTime();
        const v = (r.elnino || 0) + (r.lanina || 0);
        return [t, v];
      })
      .filter(([t]) => !isNaN(t))
      .sort((a, b) => a[0] - b[0]);
  }
  function renderEnso(year) {
    const cutoff = yearToCutoff(year === 'All' ? 'MAX' : year);
    const histData = parseEnsoHistory(ensoHistory).filter(p => p[0] >= cutoff);
    const fcastData = parseFindicatorSeries(ensoForecast, 'date', 'value');
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

  // Chart 6: Sản lượng điện per-DN theo năm (Triệu kWh)
  const mfgData = blockB.manufacturing_per_dn || {};
  const mfgTickers = Object.keys(mfgData).filter(t => (mfgData[t] || []).length);
  if (mfgTickers.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">Sản lượng điện per-DN (Triệu kWh)</span>
        </div>
        <div class="chart-container" id="chart-mfg-dn"></div>
      </div>
    `);
    const allYears = [...new Set(mfgTickers.flatMap(t => (mfgData[t] || []).map(r => r.year)))].sort();
    createChart('chart-mfg-dn', {
      chart: { type: 'column' },
      xAxis: { categories: allYears.map(String) },
      series: mfgTickers.map((t, i) => ({
        name: t,
        color: HC_COLORS[i],
        data: allYears.map(y => { const r = (mfgData[t] || []).find(x => x.year === y); return r ? r.value : null; }),
      })),
    });
  }

  // Chart 7: Điện nhập khẩu từ Trung Quốc (100 Triệu kWh)
  const elecTqData = parseFindicatorSeries(blockB.elec_tq);
  if (elecTqData.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">Điện nhập khẩu từ TQ (100 Triệu kWh)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-elec-tq"></div>
      </div>
    `);
    const cardTq = container.lastElementChild;
    function renderElecTq(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-elec-tq', {
        series: [{ name: 'NK điện TQ (100 Tr kWh)', data: elecTqData.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
      });
    }
    initYearButtons(cardTq, renderElecTq);
    renderElecTq('1Y');
  }
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
  const rawPrice = blockC.output_price || [];
  const flatPrice = Array.isArray(rawPrice[0]) ? rawPrice.flat() : rawPrice;
  const outputPriceData = parseFindicatorSeries(flatPrice);
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
    const categories = policyResource.map(r => r.name_legend || r.name || '');
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

  // Chart 4: Giá FIT năng lượng tái tạo (Cent/kWh) — grouped by đợt quy định
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Giá FIT năng lượng tái tạo (Cent/kWh)</span>
      </div>
      <div class="chart-container chart-sm" id="chart-fit"></div>
    </div>
  `);
  const fitRows = (blockC.policy_renewable || []).filter(r => r.unit === 'Cent/Kwh' && r.value != null);
  if (fitRows.length) {
    const names = [...new Set(fitRows.map(r => r.name))];
    const dates = [...new Set(fitRows.map(r => r.date))].sort();
    createChart('chart-fit', {
      chart: { type: 'bar' },
      xAxis: { categories: names },
      series: dates.map((d, i) => ({
        name: d,
        color: HC_COLORS[i],
        data: names.map(n => { const r = fitRows.find(x => x.name === n && x.date === d); return r ? r.value : null; }),
      })),
    });
  } else {
    showEmpty('chart-fit');
  }
}


function renderBlockD(blockA, blockC) {
  const container = document.getElementById('block-d-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Biên giá điện — Chi phí than NK (proxy VNĐ/kWh)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-spread"></div>
    </div>
  `);
  const card = container.lastElementChild;

  const rawPrice = blockC?.output_price;
  const priceRows = Array.isArray(rawPrice)
    ? (Array.isArray(rawPrice[0]) ? rawPrice.flat() : rawPrice)
    : [];

  const macro35 = blockA?.macro_35 || [];
  const coalRows = macro35.filter(r => r.name_id === 68); // Newcastle ICE USD/ton
  const usdRows = blockA?.usd_vnd || [];

  function monthlyAvg(rows, dateField, valField) {
    const sum = {}, cnt = {};
    rows.forEach(r => {
      const d = new Date(r[dateField]);
      if (isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      sum[k] = (sum[k] || 0) + parseFloat(r[valField] || 0);
      cnt[k] = (cnt[k] || 0) + 1;
    });
    const out = {};
    Object.keys(sum).forEach(k => out[k] = sum[k] / cnt[k]);
    return out;
  }

  const coalByMonth = monthlyAvg(coalRows, 'date', 'value');
  const usdByMonth = monthlyAvg(usdRows, 'date', 'value');
  const pricePts = parseFindicatorSeries(priceRows);

  // coal cost per kWh ≈ coal(USD/T) × USD/VND × 0.00035 (kg coal/kWh)
  const COAL_KG_PER_KWH = 0.00035;
  const coalCostPts = [], spreadPts = [];

  pricePts.forEach(([ts, elecPrice]) => {
    const d = new Date(ts);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const coal = coalByMonth[k];
    const usd = usdByMonth[k];
    if (!coal || !usd) return;
    const coalCost = Math.round(coal * usd * COAL_KG_PER_KWH);
    coalCostPts.push([ts, coalCost]);
    spreadPts.push([ts, Math.round(elecPrice - coalCost)]);
  });

  if (!pricePts.length) {
    showEmpty('chart-spread', 'Không có dữ liệu giá điện bq');
    return;
  }

  function render(year) {
    const cut = yearToCutoff(year);
    const series = [
      { name: 'Giá điện bq (VNĐ/kWh)', data: pricePts.filter(p => p[0] >= cut), color: HC_COLORS[0] },
    ];
    if (coalCostPts.length) {
      series.push({ name: 'Chi phí than NK (proxy VNĐ/kWh)', data: coalCostPts.filter(p => p[0] >= cut), color: HC_COLORS[3] });
      series.push({ name: 'Spread', data: spreadPts.filter(p => p[0] >= cut), color: HC_COLORS[1] });
    }
    createStockChart('chart-spread', { yAxis: [{ title: { text: 'VNĐ/kWh' } }], series });
  }
  initYearButtons(card, render);
  render('1Y');
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