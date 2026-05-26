// static/js/sector-food-beverage.js
// Render trang ngành Thực phẩm & Đồ uống — 6 khối A–F
// Phụ thuộc: charts.js (đã load qua sector.html)

(async function SectorFoodBeverage() {
  let data;
  try {
    const res = await fetch('/api/sector/food-beverage/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Thực phẩm & Đồ uống — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Thực phẩm & Đồ uống';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Thực phẩm & Đồ uống — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b, data.block_a);
  renderBlockC(data.block_g, data.tickers);
  renderBlockD(data.block_g, data.tickers);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
  window.renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = Array.isArray(blockA.macro_35) ? blockA.macro_35 : [];
  const byNameId = (id) => parseFindicatorSeries(macro35.filter(r => r.nameId === id));

  // Chart 1: Đường RS An Khê (685) & Đường ICE (97) & Đường TQ (220)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá đường (An Khê VNĐ / ICE USD / TQ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-sugar"></div>
    </div>
  `);

  const card1 = container.lastElementChild;

  function renderSugar(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-sugar', {
      yAxis: [
        { title: { text: 'USD cents/Lbs' } },
        { title: { text: 'VNĐ/kg' }, opposite: true },
      ],
      series: [
        { name: 'Đường ICE (USd/Lbs)', data: byNameId(97).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Đường TQ', data: byNameId(220).filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Đường RS An Khê (VNĐ/kg)', data: byNameId(685).filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card1, renderSugar);
  renderSugar('1Y');

  // Chart 2: Ngũ cốc — Lúa mỳ CBOT (88), Ngô CBOT (108), Đậu nành (87)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Ngũ cốc CBOT (Lúa mỳ / Ngô / Đậu nành)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-grains"></div>
    </div>
  `);

  const card2 = container.lastElementChild;

  function renderGrains(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-grains', {
      series: [
        { name: 'Lúa mỳ CBOT (USd/Bu)', data: byNameId(88).filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'Ngô CBOT (USd/Bu)', data: byNameId(108).filter(p => p[0] >= cutoff), color: HC_COLORS[1] },
        { name: 'Đậu nành CBOT (USd/Bu)', data: byNameId(87).filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
      ],
    });
  }
  initYearButtons(card2, renderGrains);
  renderGrains('1Y');

  // Chart 3: Dầu cọ Malaysia (90) — nguyên liệu dầu ăn/bánh kẹo
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Dầu cọ Malaysia (MYR/T)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-palm-oil"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const palmData = byNameId(90);

  function renderPalmOil(year) {
    const cutoff = yearToCutoff(year);
    if (!palmData.length) { showEmpty('chart-palm-oil'); return; }
    createStockChart('chart-palm-oil', {
      series: [{ name: 'Dầu cọ Malaysia (MYR/T)', data: palmData.filter(p => p[0] >= cutoff), color: HC_COLORS[3] }],
    });
  }
  initYearButtons(card3, renderPalmOil);
  renderPalmOil('1Y');
}


function renderBlockB(blockB, blockA) {
  const container = document.getElementById('block-b-charts');

  // Chart 1: Bán lẻ VN — proxy tiêu dùng nội địa
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ hàng hóa & dịch vụ VN (Tỷ VNĐ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-retail-vn"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const retailRows = parseFindicatorSeries(
    Array.isArray(blockB.retail_vn) ? blockB.retail_vn : [], 'date', 'value'
  );

  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-retail-vn', {
      series: [{ name: 'Bán lẻ VN (Tỷ VNĐ)', data: retailRows.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card1, renderRetail);
  renderRetail('1Y');

  // Chart 2a: Tiêu thụ bia theo phân khúc — stacked column
  const beerData = blockB.beer_data;
  const beerByProduct = (beerData && Array.isArray(beerData.beerConsumptionByProduct))
    ? beerData.beerConsumptionByProduct : [];
  const beerByChannel = (beerData && Array.isArray(beerData.beerConsumptionByChannel))
    ? beerData.beerConsumptionByChannel : [];

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Tiêu thụ bia theo phân khúc (Triệu lít)</span></div>
      <div class="chart-container" id="chart-beer-product"></div>
    </div>
  `);
  if (!beerByProduct.length) {
    showEmpty('chart-beer-product');
  } else {
    const productYears = [...new Set(beerByProduct.map(r => r.year))].sort();
    const productSegments = [...new Set(beerByProduct.map(r => r.name))];
    createChart('chart-beer-product', {
      chart: { type: 'column' },
      xAxis: { categories: productYears },
      yAxis: { title: { text: 'Triệu lít' } },
      plotOptions: { column: { stacking: 'normal' } },
      series: productSegments.map((seg, i) => ({
        name: seg,
        color: HC_COLORS[i % HC_COLORS.length],
        data: productYears.map(y => {
          const r = beerByProduct.find(x => x.year === y && x.name === seg);
          return r ? r.value : null;
        }),
      })),
    });
  }

  // Chart 2b: Tiêu thụ bia theo kênh Off/On-trade
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Tiêu thụ bia theo kênh Off/On-trade (Nghìn lít)</span></div>
      <div class="chart-container" id="chart-beer-channel"></div>
    </div>
  `);
  if (!beerByChannel.length) {
    showEmpty('chart-beer-channel');
  } else {
    const channelYears = [...new Set(beerByChannel.map(r => r.year))].sort();
    const channels = [...new Set(beerByChannel.map(r => r.channel))];
    createChart('chart-beer-channel', {
      chart: { type: 'column' },
      xAxis: { categories: channelYears },
      yAxis: { title: { text: 'Nghìn lít' } },
      series: channels.map((ch, i) => ({
        name: ch,
        color: HC_COLORS[i % HC_COLORS.length],
        data: channelYears.map(y => {
          const r = beerByChannel.find(x => x.year === y && x.channel === ch);
          return r ? r.value : null;
        }),
      })),
    });
  }

  // Chart 2c: Cơ cấu chi phí sản xuất bia — pie
  const beerCost = (beerData && Array.isArray(beerData.beerCostStructure))
    ? beerData.beerCostStructure : [];
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Cơ cấu chi phí sản xuất bia</span></div>
      <div class="chart-container chart-sm" id="chart-beer-cost"></div>
    </div>
  `);
  if (!beerCost.length) {
    showEmpty('chart-beer-cost');
  } else {
    createChart('chart-beer-cost', {
      chart: { type: 'pie' },
      series: [{ name: 'Chi phí', data: beerCost.map(r => ({ name: r.name, y: Math.round(r.value * 1000) / 10 })) }],
    });
  }

  // Chart 3a: Thị phần sữa — pie (milkMarketShare)
  const milkData = blockB.milk_data;
  const milkShare = (milkData && Array.isArray(milkData.milkMarketShare))
    ? milkData.milkMarketShare : [];
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Thị phần sữa (2022)</span></div>
      <div class="chart-container chart-sm" id="chart-milk"></div>
    </div>
  `);
  if (!milkShare.length) {
    showEmpty('chart-milk');
  } else {
    createChart('chart-milk', {
      chart: { type: 'pie' },
      series: [{ name: 'Thị phần sữa (%)', data: milkShare.map(r => ({ name: r.name, y: Math.round(r.value * 1000) / 10 })) }],
    });
  }

  // Chart 3b: Cơ cấu sản phẩm sữa — pie (milkProductStructure)
  const milkStructure = (milkData && Array.isArray(milkData.milkProductStructure))
    ? milkData.milkProductStructure : [];
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Cơ cấu sản phẩm sữa (2022)</span></div>
      <div class="chart-container chart-sm" id="chart-milk-structure"></div>
    </div>
  `);
  if (!milkStructure.length) {
    showEmpty('chart-milk-structure');
  } else {
    createChart('chart-milk-structure', {
      chart: { type: 'pie' },
      series: [{ name: 'Cơ cấu (%)', data: milkStructure.map(r => ({ name: r.name, y: Math.round(r.value * 1000) / 10 })) }],
    });
  }

  // Chart 3c: Đàn bò sữa nội địa (milkDomesticCows) — column
  const milkCows = (milkData && Array.isArray(milkData.milkDomesticCows))
    ? milkData.milkDomesticCows : [];
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Đàn bò sữa nội địa (Con)</span></div>
      <div class="chart-container" id="chart-milk-cows"></div>
    </div>
  `);
  if (!milkCows.length) {
    showEmpty('chart-milk-cows');
  } else {
    createChart('chart-milk-cows', {
      chart: { type: 'column' },
      xAxis: { categories: milkCows.map(r => r.year) },
      yAxis: { title: { text: 'Số con' } },
      series: [{ name: 'Đàn bò sữa (Con)', color: HC_COLORS[0], data: milkCows.map(r => r.value) }],
    });
  }

  // Chart 2d: Tiêu thụ bia theo quốc gia (beerConsumptionByCountry 2020) — bar
  const beerByCountry = (beerData && Array.isArray(beerData.beerConsumptionByCountry))
    ? beerData.beerConsumptionByCountry : [];
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Tiêu thụ bia theo quốc gia — bình quân đầu người (Lít/Người, 2020)</span></div>
      <div class="chart-container" id="chart-beer-country"></div>
    </div>
  `);
  if (!beerByCountry.length) {
    showEmpty('chart-beer-country');
  } else {
    const sorted = [...beerByCountry].sort((a, b) => b.valuePerCapita - a.valuePerCapita);
    createChart('chart-beer-country', {
      chart: { type: 'bar' },
      xAxis: { categories: sorted.map(r => r.country.country) },
      yAxis: { title: { text: 'Lít/Người' } },
      series: [{ name: 'Bình quân đầu người (Lít/Người)', color: HC_COLORS[2], data: sorted.map(r => r.valuePerCapita) }],
    });
  }

  // Chart 4: Giá hàng hoá F&B nội địa — đường RS An Khê (block_a) + lúa WiChart
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Giá hàng hoá F&B nội địa (đường / lúa)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-comdty-vn"></div>
    </div>
  `);

  const card4 = container.lastElementChild;
  const macro35 = Array.isArray(blockA && blockA.macro_35) ? blockA.macro_35 : [];
  const sugarRows = parseFindicatorSeries(macro35.filter(r => r.nameId === 685));
  const riceWichart = blockB.rice_price_wichart;
  const riceSeriesRaw = (riceWichart && riceWichart.chart && Array.isArray(riceWichart.chart.series))
    ? riceWichart.chart.series[0].data : [];

  function renderComdtyVn(year) {
    const cutoff = yearToCutoff(year);
    const sugarFiltered = sugarRows.filter(p => p[0] >= cutoff);
    const riceFiltered = riceSeriesRaw.filter(p => p[0] >= cutoff);
    if (!sugarFiltered.length && !riceFiltered.length) { showEmpty('chart-comdty-vn'); return; }
    createStockChart('chart-comdty-vn', {
      yAxis: [
        { title: { text: 'VNĐ/kg (Đường)' } },
        { title: { text: 'Nghìn đồng/kg (Lúa)' }, opposite: true },
      ],
      series: [
        { name: 'Đường RS An Khê (VNĐ/kg)', data: sugarFiltered, color: HC_COLORS[0], yAxis: 0 },
        { name: 'Lúa nội địa (Nghìn đồng/kg)', data: riceFiltered, color: HC_COLORS[1], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card4, renderComdtyVn);
  renderComdtyVn('1Y');
}


// Block C: Doanh thu thuần theo quý — proxy ASP/top-line (block_g)
function renderBlockC(blockG, tickers) {
  const container = document.getElementById('block-c-charts');
  const MAIN_TICKERS = ['VNM', 'SAB', 'BHN', 'MCM'];
  const used = MAIN_TICKERS.filter(t => tickers.includes(t) && blockG[t] && Array.isArray(blockG[t].revenue) && blockG[t].revenue.length);

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Doanh thu thuần theo quý (Tỷ VNĐ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-revenue-qtly"></div>
    </div>
  `);
  const card = container.lastElementChild;

  function makeRevSeries(ticker) {
    return (blockG[ticker].revenue || [])
      .map(r => [new Date(r.date).getTime(), Math.round(r.value / 1e9)])
      .sort((a, b) => a[0] - b[0]);
  }

  function renderRevQtly(year) {
    const cutoff = yearToCutoff(year);
    if (!used.length) { showEmpty('chart-revenue-qtly'); return; }
    createStockChart('chart-revenue-qtly', {
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: used.map((t, i) => ({
        name: t,
        color: HC_COLORS[i % HC_COLORS.length],
        data: makeRevSeries(t).filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(card, renderRevQtly);
  renderRevQtly('3Y');

  // YoY growth per ticker
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Tăng trưởng doanh thu YoY (% so cùng kỳ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-revenue-yoy"></div>
    </div>
  `);
  const card2 = container.lastElementChild;

  function makeYoySeries(ticker) {
    const rows = (blockG[ticker].revenue || []).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    });
    const result = [];
    rows.forEach(r => {
      const ts = new Date(r.date).getTime();
      const prev = rows.find(p => p.year === r.year - 1 && p.quarter === r.quarter);
      if (prev && prev.value) {
        result.push([ts, Math.round((r.value / prev.value - 1) * 10000) / 100]);
      }
    });
    return result;
  }

  function renderYoy(year) {
    const cutoff = yearToCutoff(year);
    if (!used.length) { showEmpty('chart-revenue-yoy'); return; }
    createStockChart('chart-revenue-yoy', {
      yAxis: [{ title: { text: '% YoY' }, labels: { format: '{value}%' } }],
      series: used.map((t, i) => ({
        name: t,
        color: HC_COLORS[i % HC_COLORS.length],
        data: makeYoySeries(t).filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(card2, renderYoy);
  renderYoy('3Y');
}


// Block D: Biên lợi nhuận ròng (%) theo quý (block_g)
function renderBlockD(blockG, tickers) {
  const container = document.getElementById('block-d-charts');
  const used = tickers.filter(t => blockG[t] && Array.isArray(blockG[t].revenue) && Array.isArray(blockG[t].profit_after_tax));

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Biên lợi nhuận ròng theo quý (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-net-margin"></div>
    </div>
  `);
  const card = container.lastElementChild;

  function makeMarginSeries(ticker) {
    const revRows = blockG[ticker].revenue || [];
    const patRows = blockG[ticker].profit_after_tax || [];
    return revRows.reduce((acc, rev) => {
      if (!rev.value) return acc;
      const ts = new Date(rev.date).getTime();
      const pat = patRows.find(p => p.year === rev.year && p.quarter === rev.quarter);
      if (pat && pat.value != null) {
        acc.push([ts, Math.round(pat.value / rev.value * 10000) / 100]);
      }
      return acc;
    }, []).sort((a, b) => a[0] - b[0]);
  }

  function renderMargin(year) {
    const cutoff = yearToCutoff(year);
    if (!used.length) { showEmpty('chart-net-margin'); return; }
    createStockChart('chart-net-margin', {
      yAxis: [{ title: { text: 'Biên LN ròng (%)' }, labels: { format: '{value}%' } }],
      series: used.map((t, i) => ({
        name: t,
        color: HC_COLORS[i % HC_COLORS.length],
        data: makeMarginSeries(t).filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(card, renderMargin);
  renderMargin('3Y');

  // Lợi nhuận sau thuế tuyệt đối (Tỷ VNĐ)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Lợi nhuận sau thuế theo quý (Tỷ VNĐ)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-pat-qtly"></div>
    </div>
  `);
  const card2 = container.lastElementChild;

  function makePatSeries(ticker) {
    return (blockG[ticker].profit_after_tax || [])
      .map(r => [new Date(r.date).getTime(), Math.round(r.value / 1e9)])
      .sort((a, b) => a[0] - b[0]);
  }

  function renderPat(year) {
    const cutoff = yearToCutoff(year);
    if (!used.length) { showEmpty('chart-pat-qtly'); return; }
    createStockChart('chart-pat-qtly', {
      yAxis: [{ title: { text: 'Tỷ VNĐ' } }],
      series: used.map((t, i) => ({
        name: t,
        color: HC_COLORS[i % HC_COLORS.length],
        data: makePatSeries(t).filter(p => p[0] >= cutoff),
      })),
    });
  }
  initYearButtons(card2, renderPat);
  renderPat('3Y');
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